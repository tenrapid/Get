Ext.define('Get.model.Picture', {
	extend: 'Get.model.Base',
	
	fields: [
		{
			name: 'waypointId', 
			reference: {
				parent: 'Waypoint',
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
		},
		{
			name: 'db',
			type: 'boolean',
			defaultValue: true,
			persist: false
		},
	],

	getImageUrl: function(size, callback) {
		var me = this;

		callback(null, encodeURI('file://' + me.get('filename')));
		// setTimeout(function() {
		// 	callback(null, encodeURI('file://' + me.get('filename')));
		// }, 0);
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
		scale = (scaleX < 1 || scaleY < 1) ? Math.min(scaleX, scaleY) : Math.max(scaleX, scaleY);

		width = Math.round(width * scale);
		height = Math.round(height * scale);

		return [width, height];
	}

});
