Ext.define('Get.view.main.Main', {
    extend: 'Ext.container.Container',
    requires: [
        'Get.view.main.MainController',
        'Get.view.main.MainModel',
        'Get.view.map.Map',
        'Get.view.waypoints.Waypoints',
        'Get.selection.FeatureModel',
    ],

    xtype: 'app-main',
    
    controller: 'main',
	viewModel: 'main',
    
    layout: {
        type: 'border'
    },
    
    items: [
//     	{
// 			region: 'north',
//     		xtype: 'box',
// 			dock: 'top',
// 			baseCls: 'get-header',
// 			html: 'GET',
// 			bind: {
// 				html: 'GET <span style="font-weight: normal;">{projectName}</span>',
// 			}
// 		},
		{
			region: 'west',
			xtype: 'get-waypoints',
		},
		{
			region: 'center',
			xtype: 'get-mappanel',
		}
	],
});
