Ext.define('Get.model.Base', {
	extend: 'Ext.data.Model',
	requires: [
		'Get.data.field.Geometry'
	],
	
	identifier: {
		type: 'sequential',
	},
	
	fields: [
		{
			name: 'id',
			type: 'int'
		},
		{
			name: 'name', 
			type: 'string'
		},
	],
	
	schema: {
		namespace: 'Get.model',
	}
});