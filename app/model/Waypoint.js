Ext.define('Get.model.Waypoint', {
	extend: 'Get.model.Base',
	
	fields: [
		{
			name: 'index',
			type: 'int',
			defaultValue: -1
		},
		{
			name: 'geometry',
			type: 'geometry'
		},
		{
			name: 'description',
		},
	]
});
