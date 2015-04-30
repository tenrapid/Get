Ext.define('Get.project.controller.PictureManager', {
	extend: 'Ext.app.Controller',

	config: {
		project: null,
	},

	tableName: 'PictureData',
	shemaString: 'id INTEGER PRIMARY KEY NOT NULL, original BLOB, preview BLOB, thumb BLOB',
	pictureSizes: {
		'preview': [600, 600],
		'thumb': [100, 100]
	},

	projectDbTableExists: false,
	pictures: null,
	tmpFileRemoveCallbacks: null,
	resizeQueue: null,
	resizeTasks: null,

	constructor: function(config) {
		var me = this,
			async = require('async');

		this.callParent(arguments);
		this.pictures = {};
		this.tmpFileRemoveCallbacks = [];

		// remove temp files when doing a ReloadDev
		window.addEventListener('unload', this.destroy.bind(this));

		// Inject a reference to me in all Picture instances.
		Get.model.Picture.prototype.pictureManager = this;

		this.resizeQueue = async.queue(this.resizeWorker.bind(this), 2);
		// this.resizeQueue = async.queue(this.resizeWorkerImageMagick.bind(this), 4);
		this.resizeTasks = {};
	},

	add: function(picture) {
		var filename;

		if (!this.pictures[picture.getId()]) {
			filename = picture.get('filename');
			if (!filename) {
				Ext.Error.raise("No filename for picture given.");
			}
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
			], function(err) {
				if (!err && !url) {
					url = getUrl();
				}
				callback(err, url);
			});
		}
	},

	save: function(callback, scope) {
		var me = this,
			async = require('async'),
			session = this.getProject().session,
			changes = session.getChanges().Picture,
			errors = [],
			dropped,
			updated,
			created,
			numberOfChanges,
			done = 0;

		if (!changes) {
			Ext.callback(callback, scope);
			return;
		}

		dropped = changes.D && changes.D.map(function(id) {
			return session.peekRecord('Picture', id);
		});

		created = changes.C && changes.C.map(function(c) {
			return session.peekRecord('Picture', c.id);
		});

		updated = changes.U && changes.U.filter(function(u) {
			return Object.keys(u).some(function(prop) {
				return prop.substr(0, 4) === 'crop'; 
			});
		}).map(function(u) {
			return session.peekRecord('Picture', u.id);
		});

		numberOfChanges = (dropped || []).concat(created || []).concat(updated || []).length;

		function progress() {
			done++;
			me.fireEvent('progress', done / numberOfChanges);
		} 

		async.parallel([
			// dropped pictures
			function(callback) {
				if (dropped) {
					me.deleteFromDb(dropped, progress, function(err) {
						if (err) {
							errors.push(err);
						}
						callback();
					});
				}
				else {
					callback();
				}
			},
			// updated pictures
			function(callback) {
				if (updated) {
					me.saveToDb('update', updated, progress, function(err) {
						if (err) {
							errors.push(err);
						}
						callback();
					});
				}
				else {
					callback();
				}
			},
			// created pictures
			function(callback) {
				if (created) {
					me.saveToDb('insert', created, progress, function(err) {
						if (err) {
							errors.push(err);
						}
						callback();
					});
				}
				else {
					callback();
				}
			}
		], function() {
			Ext.callback(callback, scope, errors.length ? [errors] : null);
		});
	},

	destroy: function() {
		delete Get.model.Picture.prototype.pictureManager;

		this.tmpFileRemoveCallbacks.forEach(function(removeCallback) {
			removeCallback();
		});
		this.callParent(arguments);
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
			file = tmp.fileSync({prefix: 'get-tmp-image', postfix: '.jpg'});

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

	deleteFromDb: function(pictures, progress, callback) {
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
				async.each(pictures, function(picture, callback) {
					if (!me.pictures[picture.getId()]) {
						me.loadFromDb(picture, function(err) {
							progress();
							callback(err);
						});
					}
					else {
						progress();
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

	saveToDb: function(mode, pictures, progress, callback) {
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
									], function(err) {
										progress();
										callback(err);
									});
							});
							break;
						case 'update':
							tasks.push(function(callback) {
								updateStatement.run([
										buffers.preview,
										buffers.thumb,
										id,
									], function(err) {
										progress();
										callback(err);
									});
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
			id = picture.getId(),
			callbacks = this.resizeTasks[id];

		if (!callbacks) {
			this.resizeTasks[id] = callbacks = [callback];
			this.resizeQueue.push(picture, function(err) {
				delete me.resizeTasks[id];
				callbacks.forEach(function(callback) {
					callback(err);
				});
			});
		}
		else {
			callbacks.push(callback);
		}
	},

	resizeWorker: function(picture, callback) {
		var me = this,
			file = 'file://' + this.getFilename(picture, 'original', true),
			async = require('async'),
			fs = require('fs');

		async.waterfall([
			function(callback) {
				loadImage(file, function(original) {
					if (original instanceof Event && original.type === 'error') {
						callback(new Error('Could not load image:' + file));
					}
					else {
						callback(null, original);
					}
				});
			},
			function(original, callback) {
				var left = Math.round(picture.get('cropX') * original.width),
					top = Math.round(picture.get('cropY') * original.height),
					sourceWidth = Math.round(picture.get('cropWidth') * original.width),
					sourceHeight = Math.round(picture.get('cropHeight') * original.height);

				async.eachSeries(['thumb', 'preview'], function(size, callback) {
					var canvas = loadImage.scale(original, {
							maxWidth: me.pictureSizes[size][0], 
							maxHeight: me.pictureSizes[size][1],
							left: left,
							top: top,
							sourceWidth: sourceWidth,
							sourceHeight: sourceHeight,
							canvas: true
						}),
						buffer = me.canvasToBuffer(canvas),
						file = me.getTmpFile();

					fs.writeFile(file.name, buffer, function(err) {
						if (!err) {
							me.setFilename(picture, size, file.name);
						}
						callback(err);
					});
				}, callback);
			}
		], callback);
	},

	resizeWorkerImageMagick: function(picture, callback) {
		var me = this,
			filename = this.getFilename(picture, 'original', true),
			async = require('async'),
			shell = require('shelljs');

		async.waterfall([
			function(callback) {
				var file = me.getTmpFile(),
					left = Math.round(picture.get('cropX') * picture.get('width')),
					top = Math.round(picture.get('cropY') * picture.get('height')),
					sourceWidth = Math.round(picture.get('cropWidth') * picture.get('width')),
					sourceHeight = Math.round(picture.get('cropHeight') * picture.get('height'));

				shell.exec([
						'convert',
						'"' + filename + '"',
						'-crop ' + sourceWidth + 'x' + sourceHeight + '+' + left + '+' + top,
						'-resize ' + me.pictureSizes.preview[0] + 'x' + me.pictureSizes.preview[1] +'\\>',
						'-strip',
						'-quality 75',
						file.name
					].join(' '), 
					function(code, output) {
						if (!code) {
							me.setFilename(picture, 'preview', file.name);
						}
						callback(code, file);
					}
				);
			},
			function(preview, callback) {
				var file = me.getTmpFile();
				shell.exec([
						'convert',
						'"' + preview.name + '"',
						'-resize ' + me.pictureSizes.thumb[0] + 'x' + me.pictureSizes.thumb[1] +'\\>',
						'-quality 85',
						file.name
					].join(' '), 
					function(code, output) {
						if (!code) {
							me.setFilename(picture, 'thumb', file.name);
						}
						callback(code);
					}
				);
			},
		], callback);
	},

	canvasToBuffer: function(canvas) {
		var dataURI = canvas.toDataURL('image/jpeg', 0.75),
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

});
