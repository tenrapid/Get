Ext.define('Get.view.waypoints.Waypoints', {
    extend: 'Ext.container.Container',
    alias: 'widget.get-waypoints',

    requires: [
        'Get.view.waypoints.WaypointsController',
        'Get.view.waypoints.WaypointsModel',
        'Ext.tree.*'
    ],
    controller: 'waypoints',
	viewModel: 'waypoints',

	layout: {
		type: 'border',
	},
	width: 300,
	split: true,
	items: [
		{
			region: 'north',
			xtype: 'treepanel',
			reference: 'layerTree',
			title: 'Layers',
			split: true,
			height: 200,
			border: false,
// 			reserveScrollbar: true,
			rootVisible: true,
			useArrows: true,
			hideHeaders: true,
			viewConfig: {
				overItemCls: null,
				markDirty: false,
			},
			root: {
				expanded: true,
				expandable: false,
				name: 'All Waypoints',
			},
			bind: {
				store: '{tours}',
				disabled: '{disabled}',
			},
			plugins: [
				{
					ptype: 'cellediting',
					clicksToEdit: 2,
					listeners: {
						beforeedit: 'onBeforeLayerItemEdit'
					},
				},
			],
			columns: [
				{
					xtype: 'treecolumn',
					text: 'Name',
					dataIndex: 'name',
					sortable: false,
					flex: 1,
					editor: {
						xtype: 'textfield',
						allowBlank: false
					}
				},
				{
					text: '',
					align: 'right',
					renderer: function(value, metadata, record) {
						metadata.style = 'font-size: 11px; color: #bbb;';
						var store = record.isRoot() ? Ext.getStore('waypoints') : record.tourWaypoints()
						return store && store.count() || '';
					},
					sortable: false,
					width: 30
				}
			],
    		listeners: {
				selectionchange: 'onLayerSelectionChange',
				scope: 'controller'
			},
			tbar: [
				{
					html: '<b>+</b>',
					handler: 'onClickButton'
				},
				{
					html: '<b>–</b>',
					handler: 'onRemoveLayer',
					bind: {
						disabled: '{removeLayerDisabled}',
					}
				},
				'->',
				{
					text: 'Load',
					handler: function() {
						Get.app.getMainView().controller.load(Ext.create('Get.Project', {
							name: 'Dresden'
						}));
					}
				},
				{
					text: 'Save',
					handler: function() {
						Get.app.getMainView().controller.save();
					}
				}
			],
		},
		{
			region: 'center',
			xtype: 'grid',
			reference: 'waypointGrid',
			title: 'Waypoints',
			border: false,
			reserveScrollbar: true,
			bind: {
				title: '{selectedLayerItem.name}',
				disabled: '{disabled}',
			},
			bufferedRenderer: false,
			selModel: {
				type: 'featuremodel',
				mode: 'MULTI',
			},
			viewConfig: {
				overItemCls: null,
			},
			columns: [
				{
					text: 'Id',
					dataIndex: 'id',
					width: 40,
					align: 'right',
					menuDisabled: true,
				},
				{
					text: 'Name',
					dataIndex: 'name',
					flex: 3
				},
// 						{
// 							text: 'Tour',
// 							renderer: function(value, meta, record) {
// 								return record.getTour().get('name');
// 							},
// 							flex: 1
// 						},
// 						{
// 							text: 'Waypoint',
// 							renderer: function(value, meta, record) {
// 								return record.getWaypoint().get('name');
// 							},
// 							flex: 1
// 						},
			],
			listeners: {
				rowdblclick: 'onWaypointDoubleClick',
				scope: 'controller',
			},
			tbar: [
				{
					html: '<b>+</b>',
					handler: 'onClickButton',
				},
				{
					html: '<b>–</b>',
					handler: 'onClickButton'
				}
			],
		}
	]

});
