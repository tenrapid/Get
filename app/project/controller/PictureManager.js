Ext.define('Get.project.controller.PictureManager', {
	extend: 'Ext.Base',

	config: {
		project: null,
	},

	tmpDb: null,
	tmpDbFilename: null,
	tmpDbTableExists: false,
	projectDbTableExists: false,

	pictures: null,

	shemaString: 'id INTEGER PRIMARY KEY NOT NULL, original BLOB, regular BLOB, thumb BLOB',
	pictureSizes: {
		'original': [1200, 1200],
		'regular': [400, 400],
		'thumb': [100, 100],
	},

	constructor: function(config) {
		var me = this;

		this.initConfig(config);
		this.pictures = {};

		// TODO: getImage() on Picture instance?
		// Get.model.Picture.prototype.pictureManager = this;

		// remove tmpDb when doing a ReloadDev
		window.addEventListener('unload', function() {
			me.removeTmpDatabase();
		});
	},

	add: function(picture, callback, scope) {
		// create pictureData from given file
		var me = this,
			async = require('async'),
			pictureData = {
				id: picture.getId(),
				filename: picture.get('filename'),
				cropX: picture.get('cropX'),
				cropY: picture.get('cropY'),
				cropWidth: picture.get('cropWidth'),
				cropHeight: picture.get('cropHeight'),
			};

		if (!pictureData.filename) {
			Ext.Error.raise("No filename for picture given.");
		}

		async.waterfall([
			function(callback) {
				me.resize(pictureData, callback);
			},
			function(pictureData, callback) {
				me.savePictureData(pictureData, callback);
			}
		], function(err) {
			Ext.callback(callback, scope, [err]);
		});
	},

	crop: function(picture, callback, scope) {
		var me = this,
			async = require('async');

		async.waterfall([
			function(callback) {
				me.loadPictureData(picture, 'original', callback);
			},
			function(pictureData, callback) {
				Ext.apply(pictureData, {
					cropX: picture.get('cropX'),
					cropY: picture.get('cropY'),
					cropWidth: picture.get('cropWidth'),
					cropHeight: picture.get('cropHeight'),
				});
				me.resize(pictureData, callback);
			},
			function(pictureData, callback) {
				me.savePictureData(pictureData, callback);
			}
		], function(err) {
			Ext.callback(callback, scope, [err]);
		});
	},

	getImage: function(picture, size, callback, scope) {
		var me = this,
			async = require('async');

		async.waterfall([
			function(callback) {
				me.loadPictureData(picture, size, callback);
			},
			function(pictureData, callback) {
				var buffer = pictureData[size],
					blob = me.bufferToBlob(buffer);

				loadImage(blob, function(image) {
					callback(null, image);
				});
			}
		], function(err, image) {
			Ext.callback(callback, scope, [err, image]);
		});
	},

	save: function(callback, scope) {
		var me = this,
			async = require('async'),
			changedPictures = this.getProject().session.getChanges().Picture;

		if (!changedPictures) {
			Ext.callback(callback, scope);
			return;
		}

		async.waterfall([
			function(callback) {
				async.parallel({
					tmp: me.getTmpDatabase.bind(me),
					project: me.getProjectDatabase.bind(me)
				}, callback);
			},
			function(db, callback) {
				var tmpDb = db.tmp,
					projectDb = db.project,
					errors = [];

				async.parallel([
					// dropped pictures
					function(callback) {
						var dropped;

						if (!changedPictures.D) {
							callback();
							return;
						}

						dropped = Ext.Array.difference(changedPictures.D, me.pictures);

						me.copyPictureData(projectDb, tmpDb, 'insert', dropped, function(err) {
							if (!err) {
								changedPictures.D.forEach(function(id) {
									me.pictures[id] = true;
								});
							}
							else {
								errors.push(err);
							}
							callback();
						});
					},
					// updated pictures
					function(callback) {
						var updated = [];

						if (!changedPictures.U) {
							callback();
							return;
						}

						changedPictures.U.forEach(function(u) {
							var cropped = Object.keys(u).some(function(prop) {
								return prop.substr(0, 4) === 'crop'; 
							});
							if (cropped) {
								updated.push(u.id);
							}
						});

						me.copyPictureData(tmpDb, projectDb, 'update', updated, function(err) {
							if (err) {
								errors.push(err);
							}
							callback();
						});
					},
					// created pictures
					function(callback) {
						var created;

						if (!changedPictures.C) {
							callback();
							return;
						}

						created = changedPictures.C.map(function(c) {
							return c.id;
						});

						me.copyPictureData(tmpDb, projectDb, 'insert', created, function(err) {
							if (err) {
								errors.push(err);
							}
							callback();
						});
					}
				], function() {
					callback(errors.length ? errors : null);
				});
			},
		], function(err) {
			Ext.callback(callback, scope, [err]);
		});
	},

	close: function(callback, scope) {
		this.removeTmpDatabase(function(err) {
			Ext.callback(callback, scope, [err]);
		});
	},

	getTmpDatabase: function(callback) {
		var me = this,
			tmp = require('tmp'),
			sqlite3 = require('sqlite3'),
			async = require('async'),
			tmpDb;

		if (!this.tmpDb) {
			async.waterfall([
				function(callback) {
					// me.tmpDbFilename = tmp.tmpNameSync();
					me.tmpDbFilename = '/Users/tenrapid/Desktop/tmpdb';
					tmpDb = new sqlite3.Database(me.tmpDbFilename, callback);
				},
				function(callback) {
					me.createPictureDataTable(tmpDb, callback);
				}
			], function(err) {
				me.tmpDb = tmpDb;
				callback(err, tmpDb);
			});
		}
		else {
			callback(null, this.tmpDb);
		}
	},

	removeTmpDatabase: function(callback) {
		var me = this,
			fs = require('fs'),
			filename = this.tmpDb && this.tmpDb.filename;

		if (filename) {
			this.tmpDb.close(function() {
				fs.unlinkSync(filename);
				me.tmpDb = null;
				me.tmpDbTableExists = false;
				if (callback) callback();
			});
		}
		else {
			if (callback) callback();
		}
	},

	getProjectDatabase: function(callback) {
		var projectDb = this.getProject().getProxy().getDatabaseObject();

		this.createPictureDataTable(projectDb, function(err) {
			callback(err, projectDb);
		});
	},

	createPictureDataTable: function(db, callback) {
		var me = this;

		if (db.filename === this.tmpDbFilename && this.tmpDbTableExists || this.projectDbTableExists) {
			callback();
		}
		else {
			db.run('CREATE TABLE IF NOT EXISTS pictureData (' + this.shemaString + ')', function(err) {
				if (!err) {
					me[db.filename === me.tmpDbFilename ? 'tmpDbTableExists' : 'projectDbTableExists'] = true;
				}
				callback(err);
			});
		}
	},

	savePictureData: function(pictureData, callback) {
		var me = this,
			async = require('async');

		async.waterfall([
			this.getTmpDatabase.bind(this),
			function(db, callback) {
				if (me.pictures[pictureData.id]) {
					db.run('UPDATE pictureData SET regular = ?, thumb = ? WHERE id = ?', [
							pictureData.regular,
							pictureData.thumb,
							pictureData.id
						], callback);
				}
				else {
					db.run('INSERT INTO pictureData (id, original, regular, thumb) VALUES (?, ?, ?, ?)', [
							pictureData.id,
							pictureData.original,
							pictureData.regular,
							pictureData.thumb
						], callback);
				}
			}
		], function(err) {
			if (!err) {
				me.pictures[pictureData.id] = true;
			}
			callback(err);
		});
	},

	loadPictureData: function(picture, size, callback) {
		var me = this,
			async = require('async'),
			id = picture.getId(),
			getDatabase = this.pictures[id] ? this.getTmpDatabase : this.getProjectDatabase;

		async.waterfall([
			getDatabase.bind(this),
			function(db, callback) {
				db.get('SELECT ' + size + ' FROM pictureData WHERE id = ?', id, callback);
			},
			function(row, callback) {
				var buffer = row[size],
					pictureData = {
						id: id
					};

				pictureData[size] = buffer;
				callback(null, pictureData);
			}
		], callback);
	},

	copyPictureData: function(fromDb, toDb, mode, ids, callback) {
		var async = require('async'),
			tasks = [],
			selectSql = 'SELECT * FROM pictureData WHERE id = ?',
			insertSql = 'INSERT INTO pictureData (id, original, regular, thumb) VALUES (?, ?, ?, ?)',
			updateSql = 'UPDATE pictureData SET original = ?, regular = ?, thumb = ? WHERE id = ?',
			selectStatement,
			insertStatement,
			updateStatement;

		if (!(mode === 'insert' || mode === 'update')) {
			Ext.Error.raise('Invalid value for mode given: ' + mode);
		}

		async.waterfall([
			async.apply(async.parallel, [
				function(callback) {
					selectStatement = fromDb.prepare(selectSql, callback);
				}, 
				function(callback) {
					insertStatement = toDb.prepare(insertSql, callback);
				}, 
				function(callback) {
					updateStatement = toDb.prepare(updateSql, callback);
				}
			]),
			function(_, callback) {
				ids.forEach(function(id) {
					tasks.push(function(callback) {
						selectStatement.get(id, callback);
					});
					switch (mode) {
						case 'insert':
							tasks.push(function(row, callback) {
								insertStatement.run([
										row.id,
										row.original,
										row.regular,
										row.thumb
									], callback);
							});
							break;
						case 'update':
							tasks.push(function(row, callback) {
								updateStatement.run([
										row.original,
										row.regular,
										row.thumb,
										row.id
									], callback);
							});
							break;
					}
				});
				async.waterfall(tasks, callback);
			}
		], callback);
	},

	resize: function(pictureData, callback) {
		var me = this,
			file = pictureData.original ? this.bufferToBlob(pictureData.original) : ('file://' + pictureData.filename);

		loadImage(file, function(original) {
			if (original instanceof Event && original.type === 'error') {
				callback(new Error('Could not load image.'));
			}
			else {
				if (!pictureData.original) {
					pictureData.original = me.canvasToBuffer(original);
				}
				['regular', 'thumb'].forEach(function(size) {
					var canvas = loadImage.scale(original, {
							maxWidth: me.pictureSizes[size][0], 
							maxHeight: me.pictureSizes[size][1],
							left: pictureData.cropX * original.width,
							top: pictureData.cropY * original.height,
							sourceWidth: pictureData.cropWidth * original.width,
							sourceHeight: pictureData.cropHeight * original.height
						});
					pictureData[size] = me.canvasToBuffer(canvas);
				});
				callback(null, pictureData);
			}
		}, {
			canvas: true, 
			maxWidth: me.pictureSizes.original[0], 
			maxHeight: me.pictureSizes.original[1]
		});
	},

	canvasToBuffer: function(canvas) {
		var dataURI = canvas.toDataURL('image/jpeg'),
			bytes = atob(dataURI.split(',')[1]),
			buffer = new Buffer(bytes.length);

		for (var i = 0, l = bytes.length; i < l; i++) {
			buffer[i] = bytes.charCodeAt(i);
		}
		return buffer;
	},

	bufferToBlob: function(buffer) {
		var bytes = new Uint8Array(buffer.length);

		for (var i = 0, l = buffer.length; i < l; i++) {
			bytes[i] = buffer[i];
		}
		return new Blob([bytes], {type: 'image/jpeg'});
	},

	statics: {
		THUMB: 'thumb',
		REGULAR: 'regular',
		ORIGINAL: 'original'
	},

	cp: function() {
		var pic = this.getProject().session.createRecord('Picture', {
			filename: '/Users/tenrapid/Desktop/IMG_7790.jpg'
		});
		this.add(pic, function() {
			console.log('add', arguments);
		});
		return pic;
	},

	gi: function(pic) {
		this.getImage(pic, 'thumb', function() {
			console.log('getImage', arguments);
		});
	},

	s: function() {
		this.getProject().getProxy().setFilename('/Users/tenrapid/Desktop/picmantest.get');
		this.save(function(err) {
			console.log('save', arguments);
			if (err) {
				console.log(err);
			}
		});
	}

});

// pic=Ext.create('Get.model.Picture', {filename:'/Users/tenrapid/Desktop/IMG_7790.jpg'})
// p.pictureManager.add(pic, function() {console.log('add', arguments);})
// p.pictureManager.getImage(pic, 'thumb', function() {console.log('image', arguments);})
