Ext.define('Get.model.Waypoint', {
    extend: 'Get.model.Base',
    
    fields: [
    	{
    		name: 'geometry',
    		type: 'geometry'
    	},
    	{
    		name: 'description',
    	},
    ]
});
