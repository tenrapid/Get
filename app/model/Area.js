Ext.define('Get.model.Area', {
	extend: 'Get.model.TreeBase',

	addTourWaypoints: function(tourWaypoints) {
		var me = this,
			tourWaypointsToAdd = tourWaypoints.filter(function(tourWaypoint) {
				return tourWaypoint.getArea() !== me;
			}),
			tourWaypointsToRemove = tourWaypointsToAdd.filter(function(tourWaypoint) {
				return tourWaypoint.getArea();
			});

		if (tourWaypointsToAdd.length) {
			tourWaypointsToRemove.forEach(function(tourWaypoint) {
				tourWaypoint.setArea(null);
			});
			me.tourWaypoints().add(tourWaypointsToAdd);
		}
	}
	
});
