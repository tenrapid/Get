Ext.define('Get.project.controller.PictureManager', {
	extend: 'Ext.Base',

	config: {
		project: null,
	},

	projectDbTableExists: false,

	pictures: null,

	tmpFileRemoveCallbacks: null,

	tableName: 'PictureData',
	shemaString: 'id INTEGER PRIMARY KEY NOT NULL, original BLOB, preview BLOB, thumb BLOB',
	pictureSizes: {
		'preview': [600, 600],
		'thumb': [100, 100]
	},

	constructor: function(config) {
		var me = this;

		this.initConfig(config);
		this.pictures = {};
		this.tmpFileRemoveCallbacks = [];

		// remove temp files when doing a ReloadDev
		window.addEventListener('unload', function() {
			me.close();
		});

		// TODO: getImage() on Picture instance?
		Get.model.Picture.prototype.pictureManager = this;
	},

	add: function(picture) {
		// create pictureData from given file
		var filename = picture.get('filename');

		if (!filename) {
			Ext.Error.raise("No filename for picture given.");
		}

		if (!this.pictures[picture.getId()]) {
			this.setFilename(picture, 'original', filename, true);
		}
	},

	getImageUrl: function(picture, size, callback) {
		var me = this,
			getUrl = function() {
				var dontCrop = size === 'original',
					filename = me.getFilename(picture, size === 'original-cropped' ? 'original' : size, dontCrop);
				return filename ? encodeURI('file://' + filename) : null;
			},
			url = getUrl(),
			async = require('async');

		if (url) {
			callback(null, url);
		}
		else {
			async.waterfall([
				function(callback) {
					if (!me.pictures[picture.getId()]) {
						me.loadFromDb(picture, callback);
					}
					else {
						callback();
					}
				},
				function(callback) {
					url = getUrl();
					if (!url) {
						me.resize(picture, callback);
					}
					else {
						callback();
					}
				}
			], function(err, url) {
				if (!err && !url) {
					url = getUrl();
				}
				callback(err, url);
			});
		}
	},

	save: function(callback, scope) {
		var me = this,
			changedPictures = this.getProject().session.getChanges().Picture,
			session = this.getProject().session,
			errors = [],
			async = require('async');

		if (!changedPictures) {
			Ext.callback(callback, scope);
			return;
		}

		async.parallel([
			// dropped pictures
			function(callback) {
				var dropped;

				if (!changedPictures.D) {
					callback();
					return;
				}

				dropped = changedPictures.D.map(function(id) {
					return session.peekRecord('Picture', id);
				});

				me.deleteFromDb(dropped, function(err) {
					if (err) {
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
						updated.push(session.peekRecord('Picture', u.id));
					}
				});

				me.saveToDb('update', updated, function(err) {
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
					return session.peekRecord('Picture', c.id);
				});

				me.saveToDb('insert', created, function(err) {
					if (err) {
						errors.push(err);
					}
					callback();
				});
			}
		], function() {
			Ext.callback(callback, scope, errors.length ? [errors] : null);
		});
	},

	close: function(callback, scope) {
		delete Get.model.Picture.prototype.pictureManager;

		this.tmpFileRemoveCallbacks.forEach(function(removeCallback) {
			removeCallback();
		});
		Ext.callback(callback, scope);
	},

	getProjectDatabase: function(callback) {
		var me = this,
			db = this.getProject().getProxy().getDatabaseObject();

		if (this.projectDbTableExists) {
			callback(null, db);
		}
		else {
			db.run('CREATE TABLE IF NOT EXISTS ' + this.tableName + ' (' + this.shemaString + ')', function(err) {
				if (!err) {
					me.projectDbTableExists = true;
				}
				callback(err, db);
			});
		}
	},

	getFilename: function(picture, size, dontCrop) {
		var id = picture.getId(),
			key = this.getPictureHashKey(picture, size, dontCrop);

		return this.pictures[id] ? this.pictures[id][key] : null;
	},

	setFilename: function(picture, size, filename, dontCrop) {
		var id = picture.getId(),
			key = this.getPictureHashKey(picture, size, dontCrop);

		if (!this.pictures[id]) {
			this.pictures[id] = {};
		}
		this.pictures[id][key] = filename;
	},

	getPictureHashKey: function(picture, size, dontCrop) {
		return dontCrop ? size + '|0|0|1|1' : size + '|' + 
											  picture.get('cropX') + '|' +
											  picture.get('cropY') + '|' +
											  picture.get('cropWidth') + '|' +
											  picture.get('cropHeight');
	},

	getTmpFile: function() {
		var tmp = require('tmp'),
			file = tmp.fileSync({dir: '/Users/tenrapid/Desktop/tmp/'});

		this.tmpFileRemoveCallbacks.push(file.removeCallback);
		return file;
	},

	loadFromDb: function(picture, callback) {
		var me = this,
			async = require('async'),
			fs = require('fs');

		async.waterfall([
			this.getProjectDatabase.bind(this),
			function(db, callback) {
				db.get('SELECT * FROM ' + me.tableName + ' WHERE id = ?', picture.getId(), callback);
			},
			function(row, callback) {
				if (!row) {
					callback(new Error('Could not load picture from database.'));
					return;
				}
				async.each(['original', 'preview', 'thumb'], function(size, callback) {
					var buffer = row[size],
						file = me.getTmpFile();

					fs.writeFile(file.name, buffer, function(err) {
						if (!err) {
							me.setFilename(picture, size, file.name, size === 'original');
						}
						callback(err);
					});
				}, callback);
			}
		], callback);
	},

	deleteFromDb: function(pictures, callback) {
		var me = this,
			async = require('async'),
			fs = require('fs'), 
			ids = pictures.map(function(picture) {
				return picture.getId();
			}),
			placeholders = ids.map(function() {
				return '?';
			});

		async.waterfall([
			function(callback) {
				async.each(pictures, function(picture) {
					if (!me.pictures[picture.getId()]) {
						me.loadFromDb(picture, callback);
					}
					else {
						callback();
					}
				}, callback);
			},
			this.getProjectDatabase.bind(this),
			function(db, callback) {
				db.run('DELETE FROM ' + me.tableName + ' WHERE id IN (' + placeholders.join(', ') + ')', ids, callback);
			},
		], callback);
	},

	saveToDb: function(mode, pictures, callback) {
		var me = this,
			async = require('async'),
			fs = require('fs'),
			tasks = [],
			insertSql = 'INSERT INTO ' + this.tableName + ' (id, original, preview, thumb) VALUES (?, ?, ?, ?)',
			updateSql = 'UPDATE ' + this.tableName + ' SET preview = ?, thumb = ? WHERE id = ?',
			insertStatement,
			updateStatement;

		if (!(mode === 'insert' || mode === 'update')) {
			Ext.Error.raise('Invalid value for mode given: ' + mode);
		}

		async.waterfall([
			this.getProjectDatabase.bind(this),
			function(db, callback) {
				async.parallel([
					function(callback) {
						insertStatement = db.prepare(insertSql, callback);
					}, 
					function(callback) {
						updateStatement = db.prepare(updateSql, callback);
					}
				], callback);
			},
			function(_, callback) {
				pictures.forEach(function(picture) {
					var id = picture.getId(),
						buffers = {},
						sizes = ['preview', 'thumb'].concat(mode === 'insert' ? ['original'] : []);

					tasks.push(function(callback) {
						async.each(sizes, function(size, callback) {
							var filename = me.getFilename(picture, size, size === 'original');

							fs.readFile(filename, function(err, buffer) {
								if (!err) {
									buffers[size] = buffer;
								}
								callback(err);
							});
						}, callback);
					});
					switch (mode) {
						case 'insert':
							tasks.push(function(callback) {
								insertStatement.run([
										id,
										buffers.original,
										buffers.preview,
										buffers.thumb
									], callback);
							});
							break;
						case 'update':
							tasks.push(function(callback) {
								updateStatement.run([
										buffers.preview,
										buffers.thumb,
										id,
									], callback);
							});
							break;
					}
				});
				async.waterfall(tasks, callback);
			}
		], callback);
	},

	resize: function(picture, callback) {
		var me = this,
			file = 'file://' + this.getFilename(picture, 'original', true),
			async = require('async'),
			fs = require('fs');

		async.waterfall([
			function(callback) {
				loadImage(file, function(original) {
					if (original instanceof Event && original.type === 'error') {
						callback(new Error('Could not load image.'));
					}
					else {
						callback(null, original);
					}
				}, {
					canvas: true
				});
			},
			function(original, callback) {
				var left = picture.get('cropX') * original.width,
					top = picture.get('cropY') * original.height,
					sourceWidth = picture.get('cropWidth') * original.width,
					sourceHeight = picture.get('cropHeight') * original.height;

				async.each(['preview', 'thumb'], function(size, callback) {
					var canvas = loadImage.scale(original, {
							maxWidth: me.pictureSizes[size][0], 
							maxHeight: me.pictureSizes[size][1],
							left: left,
							top: top,
							sourceWidth: sourceWidth,
							sourceHeight: sourceHeight
						}),
						buffer = me.canvasToBuffer(canvas),
						file = me.getTmpFile();

					fs.write(file.fd, buffer, 0, buffer.length, 0, function(err) {
						if (!err) {
							me.setFilename(picture, size, file.name);
						}
						//fs.closeSync(file.fd);
						callback(err);
					});
				}, callback);
			}
		], callback);
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
		PREVIEW: 'preview',
		ORIGINAL: 'original'
	},

	cp: function() {
		// var pic = this.getProject().session.createRecord('Picture', {
		var pic = Ext.create('Get.model.Picture', {
			filename: '/Users/tenrapid/Desktop/DSC_0147.jpg'
		});
		this.add(pic, function() {
			console.log('add', arguments);
		});
		return pic;
	},

	gi: function(pic) {
		this.getImage(pic, 'preview', function() {
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
