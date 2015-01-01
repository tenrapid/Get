Ext.define('Get.view.waypoints.Waypoints', {
	extend: 'Ext.grid.Panel',
	xtype: 'get-waypoints',

	requires: [
		'Get.view.waypoints.WaypointsController',
		'Get.view.waypoints.WaypointsModel',
		'Get.selection.FeatureModel',
	],

	controller: 'waypoints',
	viewModel: 'waypoints',

	title: 'Waypoints',
	border: false,
	reserveScrollbar: true,
	bind: {
		title: '{selectedLayerItem.name}',
		disabled: '{uiDisabled}',
	},
	bufferedRenderer: false,
	selModel: {
		type: 'featuremodel',
		mode: 'MULTI',
	},
	viewConfig: {
		overItemCls: null,
		markDirty: false,
	},
	columns: [
		{
			text: '',
			dataIndex: 'id',
			width: 35,
			align: 'right',
			menuDisabled: true,
		},
		{
			text: 'Name',
			dataIndex: 'name',
			flex: 3
		},
		{
			text: 'Waypoint',
			hidden: true,
			renderer: function(value, meta, record) {
				return record.getWaypoint && record.getWaypoint().get('name');
			},
			flex: 8,
			itemId: 'waypointColumn'
		},
	],
	listeners: {
		rowdblclick: 'onWaypointDoubleClick',
		reconfigure: 'onGridReconfigure',
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

});
