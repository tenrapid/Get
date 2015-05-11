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
			width *= this.get('cropWidth');
			height *= this.get('cropHeight');
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
			1: '',
			3: 'transform: rotate(180deg);',
			6: 'transform: matrix(0,1,-1,0,' + image[1] + ',0); transform-origin: 0 0;',
			8: 'transform: matrix(0,-1,1,0,0,' + image[0] + '); transform-origin: 0 0;',
		};

		return {
			container: [width, height],
			image: image,
			transformStyle: transformStyle[orientation]
		};
	},

	getCrop: function() {
		return {
			x: this.get('cropX'),
			y: this.get('cropY'),
			width: this.get('cropWidth'),
			height: this.get('cropHeight'),
		};
	},

	setCrop: function(crop) {
		this.set({
			cropX: crop.x,
			cropY: crop.y,
			cropWidth: crop.width,
			cropHeight: crop.height,
		});
	},

	isCropped: function() {
		return this.get('cropX') !== 0 || 
			   this.get('cropY') !== 0 || 
			   this.get('cropWidth') !== 1 ||
			   this.get('cropHeight') !== 1;
	}

});
