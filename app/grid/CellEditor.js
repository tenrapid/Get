Ext.define('Get.grid.CellEditor', {
	extend: 'Ext.grid.CellEditor',

	xtype: 'celleditor',

	field: {
		xtype: 'textarea',
		grow: true,
		fieldStyle: 'padding: 10px 5px 14px; height: calc(100% + 24px);'
	},
	autoSize: {
		width: 'field',
		height: 'boundEl'
	},
	alignment: 'tl-tl'

});
