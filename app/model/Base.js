Ext.define('Get.model.Base', {
    extend: 'Ext.data.Model',
    requires: [
    	'Get.data.field.Geometry',
    	'tenrapid.data.proxy.WebSql'
    ],
    
    identifier: {
    	type: 'sequential',
    },
	
	fields: [
		{
			name: 'name', 
			type: 'string'
		},
	],
	
    schema: {
        namespace: 'Get.model',

        proxy: {
            type: 'websql',
            database: 'get',
            writer: {
            	type: 'json',
            	allowSingle: false,
            }
        }
    }
});