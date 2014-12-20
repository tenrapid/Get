Ext.define('Get.model.LayerTreeRoot', {
	extend: 'Ext.data.TreeModel',
	
	childType: 'Get.model.Tour',
	
	fields: [
		{
			name: 'layer',
			persist: false,
		}
	],
	
	proxy: {
		reader: {
			rootProperty: 'children'
		},
		writer: {
			rootProperty: 'tour'
		}
	},
});

