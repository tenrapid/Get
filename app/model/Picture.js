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
			type: 'string',
			persist: false
		},
	]
});
