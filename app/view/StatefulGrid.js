Ext.define('Get.view.StatefulGrid', {
	extend: 'Ext.grid.Panel',

	stateful: true,

	applyState: function(state) {
		var columns = state.columns,
			columnHash;

		this.callParent(arguments);

		if (this.rendered) {
			columnHash = {};
			columns.forEach(function(column) {
				columnHash[column.id] = column;
			});
	
			this.columns.forEach(function(column) {
				var id = column.getStateId();
	
				if (columnHash[id] && columnHash[id].width) {
					column.setWidth(this.width);
				}
			});
		}
	}
	
});
