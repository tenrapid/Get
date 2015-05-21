Ext.define('Get.view.waypoints.Waypoints', {
	extend: 'Get.view.StatefulGrid',
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

	id: 'waypoints-panel',
	stateId: 'waypoints-panel',

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
		deselectOnContainerClick: true
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
			stateId: 'waypoint-index',
			width: 35,
			align: 'right',
			menuDisabled: true,
			resizable: false,
			renderer: function(value, meta, record, rowIndex) {
				return rowIndex + 1;
			}
		},
		{
			text: 'Name',
			dataIndex: 'name',
			stateId: 'waypoint-name',
			menuDisabled: true,
			resizable: false,
			flex: 1
		},
		{
			text: 'Name',
			dataIndex: 'name',
			stateId: 'tourwaypoint-name',
			hidden: true,
			menuDisabled: true,
			flex: 3
		},
		{
			text: 'Wegpunkt',
			stateId: 'tourwaypoint-waypoint-name',
			hidden: true,
			menuDisabled: true,
			resizable: false,
			renderer: function(value, meta, record) {
				var waypoint = record.getWaypoint && record.getWaypoint();
				return waypoint ? waypoint.get('name') : '';
			},
			flex: 8
		},
		{
			text: '<i class="fa fa-lg fa-level-up" style="color: #555;"></i>',
			stateId: 'waypoint-used',
			menuDisabled: true,
			resizable: false,
			renderer: function(value, meta, record) {
				var used = record.entityName === 'Waypoint' && record.tourWaypoints().count() ||
						   record.entityName === 'TourWaypoint' && record.get('areaId');
				return used ? '<span style="color: #444;">&#x25CF;</span>' : '';
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
			handler: 'onAddWaypoint',
			reference: 'addWaypointButton'
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
