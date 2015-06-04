Ext.define('Get.view.list.List', {
	extend: 'Get.view.StatefulGrid',
	xtype: 'get-list',

	requires: [
		'Ext.grid.plugin.DragDrop',
		'Ext.grid.plugin.CellEditing',
		'Get.view.list.ListController',
		'Get.view.list.ListModel',
		'Get.selection.FeatureModel',
		'Ext.grid.column.Widget',
		'Get.grid.CellEditor'
	],

	controller: 'list',
	viewModel: 'list',

	reference: 'waypointList',

	id: 'waypoints-list',
	title: '<i class="fa fa-lg fa-list-ul"></i> Liste',
	border: false,
	bufferedRenderer: false,
	sortableColumns: false,
	enableColumnMove: false,
	
	bind: {
		disabled: '{uiDisabled}',
	},
	selModel: {
		type: 'rowmodel',
		mode: 'MULTI',
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
			width: 18,
			resizable: false,
			menuDisabled: true
		},
		{
			width: 42,
			align: 'right',
			menuDisabled: true,
			tdCls: 'index-column',
			renderer: function(value, meta, record, rowIndex) {
				return rowIndex + 1;
			}
		},
		{
			text: 'Name',
			dataIndex: 'name',
			menuDisabled: true,
			tdCls: 'bold-column',
			flex: 1,
			editor: 'celleditor'
		},
		{
			text: 'Beschreibung',
			dataIndex: 'description',
			menuDisabled: true,
			flex: 3,
			cellWrap: true,
			tdCls: 'text-column',
			editor: 'celleditor'
		},
		{
			text: 'Bilder',
			xtype: 'widgetcolumn',
			menuDisabled: true,
			flex: 2,
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
	listeners: {
		reconfigure: 'onGridReconfigure',
		scope: 'controller',
	}

});
