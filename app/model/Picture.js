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
		var width = this.get('width'),
			height = this.get('height'),
			maxWidth = maxDimensions[0],
			maxHeight = maxDimensions[1],
			scaleX, scaleY, scale;

		if (!dontCrop) {
			width *= this.get('cropWidth');
			height *= this.get('cropHeight');
		}

		scaleX = maxWidth / width;
		scaleY = maxHeight / height;
		scale = (scaleX < 1 || scaleY < 1) ? Math.min(scaleX, scaleY) : 1;

		width = Math.round(width * scale);
		height = Math.round(height * scale);

		return [width, height];
	},

	isCropped: function() {
		return this.get('cropX') !== 0 || 
			   this.get('cropY') !== 0 || 
			   this.get('cropWidth') !== 1 ||
			   this.get('cropHeight') !== 1;
	}

});
