Ext.define('Get.Application', {
	extend: 'Ext.app.Application',
	
	name: 'Get',

	models: [ 
		'Tour', 'Area', 'Waypoint', 'TourWaypoint', 'Feature'
	],

	requires: [
	],

	init: function() {
	},

	launch: function () {
	},
	
});
