Ext.define('Get.model.Tour', {
	extend: 'Get.model.TreeBase',

	childType: 'Area',
	
	addWaypoints: function(waypoints) {
		var me = this, 
			waypointsToAdd = waypoints.filter(function(waypoint) {
				return !waypoint.tourWaypoints().getRange().some(function(tourWaypoint) {
					return tourWaypoint.getTour() === me;
				});
			}),
			tourWaypoints;

		if (waypointsToAdd.length) {
			tourWaypoints = waypointsToAdd.map(function(waypoint) {
				return waypoint.tourWaypoints().add({
					name: waypoint.get('name')
				})[0];
			});
			me.tourWaypoints().add(tourWaypoints);
		}
	}
	
});

