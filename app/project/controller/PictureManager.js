Ext.define('Get.project.controller.PictureManager', function() {

	var async = require('async'),
		fs = require('fs'),
		Promise = require('bluebird');

	Promise.defer = function() {
		var resolve,
			reject,
			promise = new Promise(function() {
				resolve = arguments[0];
				reject = arguments[1];
			});

		return {
			resolve: resolve,
			reject: reject,
			promise: promise
		};
	};

	return {
		extend: 'Ext.app.Controller',

		config: {
			project: null,
		},

		tableName: 'PictureData',
		shemaString: 'id INTEGER PRIMARY KEY NOT NULL, original BLOB, preview BLOB, thumb BLOB',
		pictureSizes: {
			'original': {
				crop: false
			},
			'original-cropped': {
				crop: true
			},
			'preview': {
				width: 600, 
				height: 600,
				crop: true
			},
			'thumb': {
				width: 100, 
				height: 100,
				crop: true
			}
		},

		projectDbTableExists: false,
		pictures: null,
		tmpFileRemoveCallbacks: null,
		resizeQueue: null,

		constructor: function(config) {
			this.callParent(arguments);
			this.pictures = {};
			this.tmpFileRemoveCallbacks = [];

			// remove temp files when doing a ReloadDev
			window.addEventListener('unload', this.destroy.bind(this));

			// Inject a reference to me in all Picture instances.
			Get.model.Picture.prototype.pictureManager = this;

			// this.resizeQueue = async.queue(this.resizeWorkerCanvas.bind(this), 2);
			this.resizeQueue = async.queue(this.resizeWorkerImageMagick.bind(this), 4);
		},

		add: function(picture) {
			var filename;

			if (!this.pictures[picture.getId()]) {
				filename = picture.get('filename');
				if (!filename) {
					Ext.Error.raise("No filename for picture given.");
				}
				this.setFile(picture, 'original', Promise.resolve(filename));
			}
		},

		duplicate: function(picture) {
			var me = this,
				identifier = picture.session.getIdentifier(picture.self),
				duplicate;

			// Use the session's identifier to generate an id. 
			// By not using picture.copy(null, session) we prevent the record from being adopted by the session 
			// right now, which would lead to the firing of corresponding events. We do this so that undo operation
			// grouping can be controlled in the callback of this method or even higher up. The picture gets adopted
			// by the session when it is added to a store.
			duplicate = picture.copy(identifier.generate());
			// Set phantom to true because creating a record with a specified id results in a record that is not phantom.
			duplicate.phantom = true;

			['original', 'preview', 'thumb'].forEach(function(size) {
				me.setFile(duplicate, size, me.getFile(picture, size));
			});

			return duplicate;
		},

		getImageUrl: function(picture, size, callback) {
			this.getImageFile(picture, size, function(err, filename) {
				callback(err, filename ? encodeURI('file://' + filename) : null);
			});
		},

		getImageFile: function(picture, size, callback) {
			this.getFile(picture, size).nodeify(callback);
		},

		save: function(callback, scope) {
			var me = this,
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

		getFile: function(picture, size) {
			var id = picture.getId(),
				key = this.getPictureHashKey(picture, size),
				file;

			if (!this.pictures[id]) {
				this.pictures[id] = {
					dbCrop: this.getCropHashKey(picture),
				};
			}

			file = this.pictures[id][key];

			if (!file) {
				if (size === 'original' || this.pictures[id].dbCrop === this.getCropHashKey(picture)) {
					this.loadFromDb(picture, size);
				}
				else {
					this.resize(picture, size);
				}
				file = this.pictures[id][key];
			}

			return file;
		},

		setFile: function(picture, size, file) {
			var id = picture.getId(),
				key = this.getPictureHashKey(picture, size);

			if (!this.pictures[id]) {
				this.pictures[id] = {};
			}
			this.pictures[id][key] = file;
		},

		getPictureHashKey: function(picture, size) {
			var sizeKey = (size === 'original-cropped' ? 'original' : size),
				cropKey = this.pictureSizes[size].crop ? this.getCropHashKey(picture) : '0|0|1|1';

			return sizeKey + '|' + cropKey;
		},

		getCropHashKey: function(picture) {
			return [picture.get('cropX'), picture.get('cropY'), picture.get('cropWidth'), picture.get('cropHeight')].join('|');
		},

		getTmpFile: function() {
			var tmp = require('tmp'),
				file = tmp.fileSync({prefix: 'get-tmp-image', postfix: '.jpg'});

			this.tmpFileRemoveCallbacks.push(file.removeCallback);
			return file;
		},

		loadFromDb: function(picture, sizes) {
			var me = this,
				deferreds = {};

			if (!Array.isArray(sizes)) {
				sizes = [sizes];
			}

			sizes.forEach(function(size) {
				var deferred = Promise.defer();
				deferreds[size] = deferred;
				me.setFile(picture, size, deferred.promise);
			});

			async.waterfall([
				this.getProjectDatabase.bind(this),
				function(db, callback) {
					db.get('SELECT ' + sizes.join(', ') + ' FROM ' + me.tableName + ' WHERE id = ?', picture.getId(), callback);
				},
				function(row, callback) {
					if (!row) {
						callback(new Error('Could not load picture from database.'));
						return;
					}
					async.each(sizes, function(size, callback) {
						var buffer = row[size],
							file = me.getTmpFile();

						fs.writeFile(file.name, buffer, function(err) {
							if (!err) {
								deferreds[size].resolve(file.name);
							}
							callback(err);
						});
					}, callback);
				}
			], function(err) {
				if (err) {
					Object.keys(deferreds).forEach(function(size) {
						deferreds[size].reject(err);
					});
				}
			});
		},

		deleteFromDb: function(pictures, progress, callback) {
			var me = this,
				ids = pictures.map(function(picture) {
					return picture.getId();
				}),
				placeholders = ids.map(function() {
					return '?';
				});

			async.waterfall([
				function(callback) {
					async.each(pictures, function(picture, callback) {
						var files = [me.getFile(picture, 'original')];

						if (me.pictures[picture.getId()].dbCrop === me.getCropHashKey(picture)) {
							files.push(me.getFile(picture, 'preview'));
							files.push(me.getFile(picture, 'thumb'));
						}

						Promise.all(files)
							.finally(progress)
							.nodeify(callback);
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
				tasks = [],
				insertSql = 'INSERT INTO ' + this.tableName + ' (id, original, preview, thumb) VALUES (?, ?, ?, ?)',
				updateSql = 'UPDATE ' + this.tableName + ' SET preview = ?, thumb = ? WHERE id = ?',
				insertStatement,
				updateStatement,
				readFile = function(filename) {
					return Promise.fromNode(function(callback) {
						fs.readFile(filename, callback);
					});
				};

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
							sizes = ['preview', 'thumb'].concat(mode === 'insert' ? ['original'] : []),
							buffers = {},
							readTask,
							writeTask,
							statement,
							args;


						// Read tmp files into buffers.
						readTask = function(callback) {
							sizes.forEach(function(size) {
								buffers[size] = me.getFile(picture, size).then(readFile);
							});
							Promise.props(buffers).nodeify(callback);
						};

						// Write buffers into database.
						writeTask = function(buffers, callback) {
							switch (mode) {
								case 'insert':
									statement = insertStatement;
									args = [
										id,
										buffers.original,
										buffers.preview,
										buffers.thumb
									];
									break;
								case 'update':
									statement = updateStatement;
									args = [
										buffers.preview,
										buffers.thumb,
										id
									];
									break;
							}
							statement.run(args, callback);
						};

						tasks.push(function(callback) {
							async.waterfall([readTask, writeTask], function(err) {
								if (!err) {
									me.pictures[id].dbCrop = me.getCropHashKey(picture);
								}
								progress();
								callback(err);
							});
						});
					});
					async.parallelLimit(tasks, 4, callback);
				}
			], callback);
		},

		resize: function(picture, size) {
			var me = this,
				deferreds = {},
				sizes;

			switch (size) {
				case 'thumb':
				case 'preview':
					sizes = ['thumb', 'preview'];
					break;
				case 'original-cropped':
					sizes = ['original-cropped'];
					break;
			}
			if (!sizes) {
				return;
			}

			sizes.forEach(function(size) {
				var deferred = Promise.defer();
				deferreds[size] = deferred;
				me.setFile(picture, size, deferred.promise);
			});

			this.resizeQueue.push({
				picture: picture,
				sizes: sizes,
				deferreds: deferreds
			});
		},

		resizeWorkerCanvas: function(task, callback) {
			var me = this,
				picture = task.picture,
				deferreds = task.deferreds;

			async.waterfall([
				function(callback) {
					me.getFile(picture, 'original').nodeify(callback);
				},
				function(file, callback) {
					loadImage('file://' + file, function(original) {
						if (original instanceof Event && original.type === 'error') {
							callback(new Error('Could not load image:' + file));
						}
						else {
							if (!(picture.get('width') && picture.get('width'))) {
								picture.set({width: original.width, height: original.height});
							}
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
								maxWidth: me.pictureSizes[size].width, 
								maxHeight: me.pictureSizes[size].height,
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
								deferreds[size].resolve(file.name);
							}
							callback(err);
						});
					}, callback);
				}
			], function(err) {
				if (err) {
					Object.keys(deferreds).forEach(function(size) {
						deferreds[size].reject(err);
					});
				}
				callback(err);
			});
		},

		resizeWorkerImageMagick: function(task, callback) {
			var me = this,
				picture = task.picture,
				deferreds = task.deferreds,
				shell = require('shelljs'),
				sizeOf = require('image-size');

			async.waterfall([
				function(callback) {
					me.getFile(picture, 'original').nodeify(callback);
				},
				function(original, callback) {
					if (!(picture.get('width') && picture.get('height'))) {
						sizeOf(original, function(err, dimensions) {
							if (err) {
								// TODO: best way to handle this error? or should the size be determined earlier?
								throw err;
							}
							picture.set({width: dimensions.width, height: dimensions.height});
							callback(null, original);
						});
					}
					else {
						callback(null, original);
					}
				},
				function(original, callback) {
					var file = me.getTmpFile(),
						left = Math.round(picture.get('cropX') * picture.get('width')),
						top = Math.round(picture.get('cropY') * picture.get('height')),
						sourceWidth = Math.round(picture.get('cropWidth') * picture.get('width')),
						sourceHeight = Math.round(picture.get('cropHeight') * picture.get('height'));

					shell.exec([
							'convert',
							'"' + original + '"',
							'-crop ' + sourceWidth + 'x' + sourceHeight + '+' + left + '+' + top,
							'-resize ' + me.pictureSizes.preview.width + 'x' + me.pictureSizes.preview.height +'\\>',
							'-strip',
							'-quality 75',
							file.name
						].join(' '), 
						function(code, output) {
							if (!code) {
								deferreds.preview.resolve(file.name);
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
							'-resize ' + me.pictureSizes.thumb.width + 'x' + me.pictureSizes.thumb.height +'\\>',
							'-quality 85',
							file.name
						].join(' '), 
						function(code, output) {
							if (!code) {
								deferreds.thumb.resolve(file.name);
							}
							callback(code);
						}
					);
				},
			], function(err) {
				if (err) {
					Object.keys(deferreds).forEach(function(size) {
						deferreds[size].reject(err);
					});
				}
				callback(err);
			});
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
		}

	};
});
