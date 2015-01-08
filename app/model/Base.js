Ext.define('Get.model.Base', {
	extend: 'Ext.data.Model',
	requires: [
		'Get.data.field.Geometry',
		'tenrapid.data.proxy.Sqlite'
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
			type: 'sqlite',
			debug: false,
			writer: {
				type: 'json',
				allowSingle: false,
			}
		}
	}
});