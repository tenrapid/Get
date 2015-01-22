Ext.define('Get.Application', {
	extend: 'Ext.app.Application',
	
	name: 'Get',

	models: [ 
		'Tour', 'Area', 'Waypoint', 'TourWaypoint', 'Feature'
	],

	controllers: [
		'MenuBar'
	],

	requires: [
	],

	init: function() {
	},

	launch: function () {
		var mainController = this.getMainView().getController(),
			project = Ext.create('Get.model.Project');
		mainController.load(project);
	},
	
});
