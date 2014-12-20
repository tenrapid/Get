Ext.define('Get.model.Tour', {
    extend: 'Get.model.TreeBase',

	childType: 'Area',
    
    fields: [
    	{
    		name: 'area',
    		persist: false,
    	},
    	{
    		name: 'layer',
    		persist: false,
    	},
    ],
    
    proxy: {
		reader: {
			rootProperty: 'area'
		},
		writer: {
			rootProperty: 'area'
		}
	},
});

