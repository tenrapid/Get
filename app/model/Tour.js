Ext.define('Get.model.Tour', {
    extend: 'Get.model.TreeBase',

	childType: 'Area',
    
    fields: [
    	{
    		name: 'area',
    		persist: false,
    	},
    ],
    
});

