Ext.define('Get.model.Picture', {
	extend: 'Get.model.Base',
	
	fields: [
		{
			name: 'waypointId', 
			reference: {
				parent: 'Waypoint',
				inverse: {
					storeConfig: {
						// required to be able to listen to association store events
						type: 'picture',
					}
				}
			}
		},
		{
			name: 'index',
			type: 'int',
			defaultValue: -1
		},
		{
			name: 'width',
			type: 'int',
		},
		{
			name: 'height',
			type: 'int',
		},
		{
			name: 'orientation',
			type: 'int',
			defaultValue: 1
		},
		{
			name: 'cropX',
			type: 'float',
			defaultValue: 0
		},
		{
			name: 'cropY',
			type: 'float',
			defaultValue: 0
		},
		{
			name: 'cropWidth',
			type: 'float',
			defaultValue: 1
		},
		{
			name: 'cropHeight',
			type: 'float',
			defaultValue: 1
		},
		{
			name: 'filename',
			type: 'string'
		}
	],

	constructor: function(data) {
		this.callParent(arguments);
		if (this.pictureManager && this.phantom && data[this.clientIdProperty] === undefined) {
			// Let the PictureManager manage this instance. Only phantom records need to be added, so that
			// the PictureManager knows where to look for the original image file. The last condition
			// prevents instances to be added, that got created in Ext.data.Reader while executing a 
			// destroy operation.
			this.pictureManager.add(this);
		}
	},

	getImageUrl: function(size, callback) {
		this.pictureManager.getImageUrl(this, size, callback);
	},

	sizeWithin: function(maxDimensions, dontCrop) {
		var orientation = this.get('orientation'),
			maxWidth = maxDimensions[0],
			maxHeight = maxDimensions[1],
			rotate90deg = {
				5: true,
				6: true,
				7: true,
				8: true
			},
			crop = this.getCrop(),
			width, height,
			scaleX, scaleY, scale,
			transformStyle,
			image;

		if (orientation in rotate90deg) {
			width = this.get('height');
			height = this.get('width');
		}
		else {
			width = this.get('width');
			height = this.get('height');
		}

		if (!dontCrop) {
			width *= crop.width;
			height *= crop.height;
		}

		scaleX = maxWidth / width;
		scaleY = maxHeight / height;
		scale = (scaleX < 1 || scaleY < 1) ? Math.min(scaleX, scaleY) : 1;

		width = Math.round(width * scale);
		height = Math.round(height * scale);

		if (orientation in rotate90deg) {
			image = [height, width];
		}
		else {
			image = [width, height];
		}

		transformStyle = {
			1: 'transform: none; transform-origin: center center;',
			2: 'transform: scaleX(-1); transform-origin: center center;',
			3: 'transform: rotate(180deg); transform-origin: center center;',
			4: 'transform: rotate(180deg) scaleX(-1); transform-origin: center center;',
			5: 'transform: matrix(0,-1,-1,0,' + image[1] + ',' + image[0] + '); transform-origin: 0 0;',
			6: 'transform: matrix(0,1,-1,0,' + image[1] + ',0); transform-origin: 0 0;',
			7: 'transform: matrix(0,1,1,0,0,0); transform-origin: 0 0;',
			8: 'transform: matrix(0,-1,1,0,0,' + image[0] + '); transform-origin: 0 0;',
		};

		return {
			container: [width, height],
			image: image,
			transformStyle: transformStyle[orientation]
		};
	},

	getTransformCenteredStyle: function() {
		return {
			1: '',
			2: 'transform: scaleX(-1);',
			3: 'transform: rotate(180deg);', 
			4: 'transform: scaleY(-1);',
			5: 'transform: rotate(90deg) scaleX(-1);', 
			6: 'transform: rotate(90deg);', 
			7: 'transform: rotate(-90deg) scaleX(-1);', 
			8: 'transform: rotate(-90deg);', 
		}[this.get('orientation')];
	},

	getCrop: function() {
		var transformationMatrix = this.self.transformationMatrix[this.get('orientation')],
			crop = {
				x: this.get('cropX'),
				y: this.get('cropY'),
				width: this.get('cropWidth'),
				height: this.get('cropHeight')
			};

		return this.transformCrop(crop, transformationMatrix);
	},

	setCrop: function(crop) {
		var transformationMatrix = this.self.inverseTransformationMatrix[this.get('orientation')],
			cropTransformed = this.transformCrop(crop, transformationMatrix);

		this.set({
			cropX: cropTransformed.x,
			cropY: cropTransformed.y,
			cropWidth: cropTransformed.width,
			cropHeight: cropTransformed.height,
		});
	},

	transformCrop: function(crop, transformationMatrix) {
		var M = require('matrixmath').Matrix,
			x1 = crop.x,
			x2 = x1 + crop.width,
			y1 = crop.y,
			y2 = y1 + crop.height,
			v1 = new M().setData([x1, y1, 1], 3, 1),
			v2 = new M().setData([x2, y2, 1], 3, 1),
			v1t = M.multiply(transformationMatrix, v1).toArray(),
			v2t = M.multiply(transformationMatrix, v2).toArray(),
			x = v1t[0],
			y = v1t[1],
			width = v2t[0] - v1t[0],
			height = v2t[1] - v1t[1];

		if (width < 0) {
			x += width;
			width *= -1;
		}
		if (height < 0) {
			y += height;
			height *= -1;
		}

		return {
			x: x,
			y: y,
			width: width,
			height: height
		};
	},

	isCropped: function() {
		return this.get('cropX') !== 0 || 
			   this.get('cropY') !== 0 || 
			   this.get('cropWidth') !== 1 ||
			   this.get('cropHeight') !== 1;
	}

}, function() {
	var me = this,
		M = require('matrixmath').Matrix;

	this.transformationMatrix = {
		1: new M().setIdentityData(),
		2: new M().setData([-1,0,1,0,1,0,0,0,1], 3, 3),
		3: new M().setData([-1,0,1,0,-1,1,0,0,1], 3, 3),
		4: new M().setData([1,0,0,0,-1,1,0,0,1], 3, 3),
		5: new M().setData([0,-1,1,-1,0,1,0,0,1], 3, 3),
		6: new M().setData([0,-1,1,1,0,0,0,0,1], 3, 3),
		7: new M().setData([0,1,0,1,0,0,0,0,1], 3, 3),
		8: new M().setData([0,1,0,-1,0,1,0,0,1], 3, 3)
	};
	this.inverseTransformationMatrix = {};
	Object.keys(this.transformationMatrix).forEach(function(orientation) {
		me.inverseTransformationMatrix[orientation] = me.transformationMatrix[orientation].clone().invert();
	});
});
