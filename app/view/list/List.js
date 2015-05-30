Ext.define('Get.view.list.List', {
	extend: 'Get.view.StatefulGrid',
	xtype: 'get-list',

	requires: [
		'Ext.grid.plugin.DragDrop',
		'Ext.grid.plugin.CellEditing',
		'Get.view.list.ListController',
		'Get.view.list.ListModel',
		'Get.selection.FeatureModel',
		'Ext.grid.column.Widget'
	],

	controller: 'list',
	viewModel: 'list',

	reference: 'waypointList',

	id: 'waypoints-list',
	title: '<i class="fa fa-lg fa-list-ul"></i> Liste',
	border: false,
	sortableColumns: false,
	bind: {
		disabled: '{uiDisabled}',
	},
	bufferedRenderer: false,
	selModel: {
		type: 'rowmodel',
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
			menuDisabled: true,
			tdCls: 'list-border-column'
		},
		{
			text: '',
			width: 37,
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
			tdCls: 'bold-column',
			flex: 1
		},
		{
			text: 'Beschreibung',
			dataIndex: 'description',
			menuDisabled: true,
			flex: 3,
			cellWrap: true,
			editor: {
				xclass: 'Ext.grid.CellEditor',
				field: {
					xtype: 'textarea',
					// grow: true,
					fieldStyle: 'padding: 10px 5px 8px; height: calc(100% - -30px);'
				},
				autoSize: {
					width: 'field',
					height: 'boundEl'
				},
				alignment: 'tl-tl'
			}
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
			width: 17,
			resizable: false,
			focusable: false,
			menuDisabled: true,
			tdCls: 'list-border-column'
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
