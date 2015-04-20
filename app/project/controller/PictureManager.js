Ext.define('Get.project.controller.PictureManager', {
	extend: 'Ext.Base',

	config: {
		project: null,
	},

	projectDb: null,
	projectDbTableExists: false,
	tmpDb: null,
	tmpDbTableExists: false,

	pictures: null,

	shemaString: 'id INTEGER PRIMARY KEY NOT NULL, original BLOB, regular BLOB, thumb BLOB',
	pictureSizes: {
		'original': [1200, 1200],
		'regular': [400, 400],
		'thumb': [100, 100],
	},

	constructor: function(config) {
		this.initConfig(config);
		this.pictures = {};
		Get.model.Picture.prototype.pictureManager = this;
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

	createTmpDatabase: function(callback) {
		var me = this,
			tmp = require('tmp'),
			sqlite3 = require('sqlite3'),
			async = require('async'),
			tmpDbFilename = '/Users/tenrapid/Desktop/tmpdb';
			// tmpDbFilename = tmp.tmpNameSync();

		if (!this.tmpDb) {
			async.waterfall([
				function(callback) {
					me.tmpDb = new sqlite3.Database(tmpDbFilename, callback);
				},
				function(callback) {
					me.createPictureDataTable(me.tmpDb, callback);
				}
			], callback);
		}
		else {
			callback();
		}
	},

	createPictureDataTable: function(db, callback) {
		var me = this;

		if (db == this.tmpDb && this.tmpDbTableExists || this.projectDbTableExists) {
			callback();
		}
		else {
			db.run('CREATE TABLE IF NOT EXISTS pictureData (' + this.shemaString + ')', function(err) {
				if (!err) {
					me[db == me.tmpDb ? 'tmpDbTableExists' : 'projectDbTableExists'] = true;
				}
				callback(err);
			});
		}
	},

	savePictureData: function(pictureData, callback) {
		var me = this,
			async = require('async');

		async.waterfall([
			function(callback) {
				me.createTmpDatabase(callback);
			},
			function(callback) {
				if (me.pictures[pictureData.id]) {
					me.tmpDb.run('UPDATE pictureData SET regular = ?, thumb = ? WHERE id = ?', [
							pictureData.regular,
							pictureData.thumb,
							pictureData.id
						], callback);
				}
				else {
					me.tmpDb.run('INSERT INTO pictureData (id, original, regular, thumb) VALUES (?, ?, ?, ?)', [
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
			db;

		if (this.pictures[id]) {
			db = this.tmpDb;
		}
		else {
			if (!this.projectDb) {
				this.projectDb = this.project.getProxy().getDatabaseObject();
			}
			db = this.projectDb;
		}

		db.get('SELECT ' + size + ' FROM pictureData WHERE id = ?', id, function(err, row) {
			var buffer = row[size],
				pictureData = {
					id: id
				};

			pictureData[size] = buffer;
			callback(err, pictureData);
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

	beforeProjectSave: function() {
		// save image data of dropped pictures in temDb
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
	}

});
