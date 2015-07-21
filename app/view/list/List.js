Ext.define('Get.view.list.List', {
	extend: 'Get.view.StatefulGrid',
	xtype: 'get-list',

	requires: [
		'Ext.grid.plugin.DragDrop',
		'Ext.grid.plugin.CellEditing',
		'Get.view.list.ListController',
		'Get.view.list.ListModel',
		'Get.view.list.TourWaypointForm',
		'Get.selection.FeatureModel',
		'Ext.grid.column.Widget',
		'Get.grid.CellEditor'
	],

	controller: 'list',

	id: 'waypoints-list',

	title: '<i class="fa fa-lg fa-list-ul"></i> Liste',
	border: false,
	bufferedRenderer: false,
	sortableColumns: false,
	enableColumnMove: false,
	
	bind: {
		disabled: '{uiDisabled}',
		selection: '{selectedWaypoint}'
	},
	selModel: {
		type: 'rowmodel',
		mode: 'SINGLE',
		deselectOnContainerClick: true
	},
	viewConfig: {
		overItemCls: null,
		markDirty: false,
		preserveScrollOnRefresh: false,
		plugins: {
			ptype: 'gridviewdragdrop',
			dragText: 'Drag and drop to reorganize',
			containerScroll: true,
			dragZone: {
				animRepair: false,
				repairHighlightColor: '#fff'
			}
		}
	},
	plugins: {
		ptype: 'cellediting',
		clicksToEdit: 1
	},

	columns: [
		{
			id: 'border-left',
			width: 18,
			resizable: false,
			menuDisabled: true
		},
		{
			id: 'waypoint-index',
			width: 42,
			align: 'right',
			menuDisabled: true,
			resizable: false,
			tdCls: 'index-column',
			renderer: function(value, meta, record, rowIndex) {
				return rowIndex + 1;
			}
		},
		{
			id: 'waypoint-name',
			text: 'Name',
			dataIndex: 'name',
			menuDisabled: true,
			tdCls: 'bold-column',
			width: 170,
			editor: 'celleditor'
		},
		{
			id: 'waypoint-description',
			text: 'Beschreibung',
			dataIndex: 'description',
			menuDisabled: true,
			flex: 1,
			cellWrap: true,
			tdCls: 'text-column',
			editor: 'celleditor'
		},
		{
			id: 'waypoint-pictures',
			text: 'Bilder',
			xtype: 'widgetcolumn',
			menuDisabled: true,
			resizable: false,
			width: 230,
			cellWrap: true,
			widget: {
				xtype: 'edit.waypoint.pictures'
			},
			onWidgetAttach: function(column, widget, record) {
				widget.bindStore(record.entityName === 'Waypoint' ? record.pictures() : null);
			},
			onWidgetDetach: function(column, widget, record) {
				widget.bindStore(null);
			}
		},
		{
			id: 'tourwaypoint-name',
			text: 'Name',
			dataIndex: 'name',
			menuDisabled: true,
			tdCls: 'bold-column',
			width: 170,
			editor: 'celleditor'
		},
		{
			id: 'tourwaypoint-form',
			text: 'Beschreibung',
			xtype: 'widgetcolumn',
			menuDisabled: true,
			resizable: false,
			flex: 1,
			cellWrap: true,
			widget: {
				xtype: 'list.tourwaypoint-form'
			},
			onWidgetAttach: function(column, widget, record) {
				widget.bindTourWaypoint(record.entityName === 'TourWaypoint' ? record : null);
			},
			onWidgetDetach: function(column, widget, record) {
				widget.bindTourWaypoint(null);
			}
		},
		{
			id: 'border-right',
			width: 18,
			resizable: false,
			menuDisabled: true
		},
	],
	tbar: [
		{
			text: '+'
		},
		{
			text: '–'
		},
		'->',
		{
			xtype: 'textfield',
			width: 200,
			fieldStyle: 'font-size: 11px;',
			emptyText: 'Suchen…'
		}
	],

	// onHeaderHide: function(headerCt, header) {
	// 	if (this.view.refreshCounter && !this.reconfiguring) {
	// 		this.view.refreshView();
	// 	}
	// },

	// onHeaderShow: function(headerCt, header) {
	// 	if (this.view.refreshCounter && !this.reconfiguring) {
	// 		this.view.refreshView();
	// 	}
	// }

});
