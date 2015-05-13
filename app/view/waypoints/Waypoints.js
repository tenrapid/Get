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

	title: 'Wegpunkte',
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
			ddGroup: 'ddLayersWaypoints',
			dragZone: {
				animRepair: false,
				repairHighlightColor: '#fff'
			},
			dropZone: {
				onNodeOver: function(node, dragZone, e, data) {
					var record = data.records[0];

					if (record.entityName === 'Tour' || record.entityName === 'Area') {
						this.valid = false;
						return this.dropNotAllowed;
					}
					else {
						return Object.getPrototypeOf(this).onNodeOver.apply(this, arguments);
					}
				},
				onContainerOver : function(dd, e, data) {
					var record = data.records[0];

					if (record.entityName === 'Tour' || record.entityName === 'Area') {
						this.valid = false;
						return this.dropNotAllowed;
					}
					else {
						return Object.getPrototypeOf(this).onContainerOver.apply(this, arguments);
					}
				}
			}
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
			text: 'Wegpunkt',
			hidden: true,
			menuDisabled: true,
			renderer: function(value, meta, record) {
				var waypoint = record.getWaypoint && record.getWaypoint();
				return waypoint ? waypoint.get('name') : '';
			},
			flex: 8
		},
		{
			text: '<i class="fa fa-lg fa-level-up" style="color: #555;"></i>',
			menuDisabled: true,
			renderer: function(value, meta, record) {
				return record.entityName === 'Waypoint' && record.tourWaypoints().count() ||
					   record.entityName === 'TourWaypoint' && record.getArea() ? '<span style="color: #444;">&#x25CF;</span>' : '';
			},
			width: 20
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
		},
		'->',
		{
			html: '<i class="fa fa-lg fa-crosshairs"></i>',
			handler: 'onZoomToWaypoints',
			bind: {
				disabled: '{removeWaypointButtonDisabled}'
			}
		}
	],

});
