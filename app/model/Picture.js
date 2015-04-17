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
		},
		{
			name: 'cropY',
			type: 'float',
		},
		{
			name: 'cropWidth',
			type: 'float',
		},
		{
			name: 'cropHeight',
			type: 'float',
		},
	]
});
