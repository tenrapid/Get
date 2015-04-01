Ext.define('Get.Application', {
	extend: 'Ext.app.Application',
	
	name: 'Get',

	models: [ 
		'Tour', 'Area', 'Waypoint', 'TourWaypoint', 'Feature'
	],

	controllers: [
		'MenuBar'
	],

	// TODO: Copy/Paste-Controller

	requires: [
		'Ext.state.LocalStorageProvider'
	],

	init: function() {
		Ext.state.Manager.setProvider(new Ext.state.LocalStorageProvider());
	},

	launch: function () {
		var mainController = this.getMainView().getController(),
			project = Ext.create('Get.model.Project');
		mainController.load(project);
	},
	
});
