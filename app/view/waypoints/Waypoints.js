Ext.define('Get.view.waypoints.Waypoints', {
	extend: 'Ext.grid.Panel',
	xtype: 'get-waypoints',

	requires: [
		'Ext.grid.plugin.DragDrop',
		'Get.view.waypoints.WaypointsController',
		'Get.view.waypoints.WaypointsModel',
		'Get.selection.FeatureModel',
	],

	controller: 'waypoints',
	viewModel: 'waypoints',

	reference: 'waypointGrid',

	title: 'Waypoints',
	border: false,
	sortableColumns: false,
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
		plugins: {
			ptype: 'gridviewdragdrop',
			dragText: 'Drag and drop to reorganize',
			containerScroll: true,
		}
	},
	columns: [
		{
			text: '',
			width: 35,
			align: 'right',
			menuDisabled: true,
			renderer: function(value, meta, record, rowIndex) {
				return rowIndex + 1;
			}
		},
		{
			text: 'Name',
			dataIndex: 'name',
			menuDisabled: true,
			flex: 1
		},
		{
			text: 'Name',
			dataIndex: 'name',
			hidden: true,
			menuDisabled: true,
			flex: 3
		},
		{
			text: 'Waypoint',
			hidden: true,
			menuDisabled: true,
			renderer: function(value, meta, record) {
				var waypoint = record.getWaypoint && record.getWaypoint();
				return waypoint ? waypoint.get('name') : '';
			},
			flex: 8
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
			handler: 'onRemoveWaypoint',
			bind: {
				disabled: '{removeWaypointButtonDisabled}'
			}
		}
	],

});
