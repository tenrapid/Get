Ext.define('Get.view.waypoints.WaypointsModel', {
	extend: 'Ext.app.ViewModel',
	alias: 'viewmodel.waypoints',

	data: {
	}, 
	
	stores: {
	},

	formulas: {
		removeWaypointButtonDisabled: function(get) {
			return !get('waypointGrid.selection');
		},
	}
});
