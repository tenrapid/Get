Ext.define('Get.view.list.ListModel', {
	extend: 'Ext.app.ViewModel',
	alias: 'viewmodel.list',

	data: {
	}, 
	
	stores: {
	},

	formulas: {
		removeWaypointButtonDisabled: function(get) {
			return !get('waypointList.selection');
		},
	}
});
