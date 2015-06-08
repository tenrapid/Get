Ext.define('Get.view.main.LeftPane', {
	extend: 'Ext.container.Container',

	xtype: 'get-left-pane',
	
	layout: {
		type: 'border',
	},
	border: false,

	id: 'left-pane',
	stateful: true,

	applyState: function(state) {
		this.callParent(arguments);
		if (this.rendered) {
			this.setWidth(this.width);
		}
	}
});
