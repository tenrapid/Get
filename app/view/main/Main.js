Ext.define('Get.view.main.Main', {
	extend: 'Ext.container.Container',
	requires: [
		'Get.view.main.MainController',
		'Get.view.main.MainModel',
		'Get.view.main.LeftPane',
		'Get.view.layers.Layers',
		'Get.view.waypoints.Waypoints',
		'Get.view.list.List',
		'Get.view.map.Map',
		'Ext.tab.Panel'
	],

	xtype: 'app-main',
	
	controller: 'main',
	viewModel: 'main',
	
	layout: {
		type: 'border'
	},
	
	items: [
		{
			region: 'west',
			xtype: 'get-left-pane',
			width: 300,
			split: true,

			items: [
				{
					region: 'north',
					xtype: 'get-layers',
					height: 200,
					split: true
				},
				{
					region: 'center',
					xtype: 'get-waypoints',
				}
			],
		},
		{
			region: 'center',
			xtype: 'tabpanel',
			plain: true,
			items: [
				{
					xtype: 'get-map',
				},
				{
					xtype: 'get-list'
				}
			]
		}
	],
});
