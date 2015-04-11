Ext.define('Get.model.Waypoint', {
	extend: 'Get.model.Base',
	
	fields: [
		{
			name: 'index',
			type: 'int'
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
