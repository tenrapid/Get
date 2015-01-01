Ext.define('Get.view.main.Main', {
	extend: 'Ext.container.Container',
	requires: [
		'Get.view.main.MainController',
		'Get.view.main.MainModel',
		'Get.view.layers.Layers',
		'Get.view.waypoints.Waypoints',
		'Get.view.map.Map',
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
			layout: {
				type: 'border',
			},
			width: 300,
			split: true,
			border: false,
			items: [
				{
					region: 'north',
					xtype: 'get-layers',
					height: 200,
					split: true
				},
				{
					region: 'center',
					xtype: 'get-waypoints'
				}
			]
		},
		{
			region: 'center',
			xtype: 'get-mappanel',
		}
	],
});
