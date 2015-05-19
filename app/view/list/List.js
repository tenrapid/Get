Ext.define('Get.view.list.List', {
	extend: 'Get.view.StatefulGrid',
	xtype: 'get-list',

	requires: [
		'Ext.grid.plugin.DragDrop',
		'Get.view.list.ListController',
		'Get.view.list.ListModel',
		'Get.selection.FeatureModel',
	],

	controller: 'list',
	viewModel: 'list',

	reference: 'waypointList',

	title: '<i class="fa fa-lg fa-list-ul"></i> Liste',
	border: false,
	sortableColumns: false,
	reserveScrollbar: true,
	bind: {
		disabled: '{uiDisabled}',
	},
	bufferedRenderer: false,
	selModel: {
		type: 'rowmodel',
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
			text: 'Beschreibung',
			dataIndex: 'description',
			menuDisabled: true,
			flex: 3,
			cellWrap: true
		},
		// {
		// 	text: 'Bilder',
		// 	xtype: 'widgetcolumn',
		// 	menuDisabled: true,
		// 	flex: 3,
		// 	cellWrap: true,
		// 	widget: {
		// 		xtype: 'edit.waypoint.pictures'
		// 	},
		// 	onWidgetAttach: function(column, widget, record) {
		// 		widget && record && widget.setConfig(widget.defaultBindProperty, record.pictures());
		// 	}
		// },
	]

});
