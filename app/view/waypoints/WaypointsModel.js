/**
 * This class is the view model for the Main view of the application.
 */
Ext.define('Get.view.waypoints.WaypointsModel', {
	extend: 'Ext.app.ViewModel',
	alias: 'viewmodel.waypoints',

	requires: [
		'Get.view.waypoints.WaypointsController',
		'Ext.data.TreeStore',
	],
	
	data: {
	}, 
	
	stores: {
	},

	formulas: {
		disabled: function (get) {
			return get('project') ? false : true;
		},
		removeLayerDisabled: function(get) {
			var selectedLayerItem = get('selectedLayerItem');
			return selectedLayerItem && selectedLayerItem.isRoot();
		}
	}

});