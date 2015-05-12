Ext.define('Get.store.WaypointTourWaypoint', {
	extend: 'Ext.data.Store',
	model: 'Get.model.TourWaypoint',
	alias: 'store.waypointTourWaypoint'

	// Association store that holds all associated tourWaypoints of a waypoint. Used to refresh the 
	// 'waypoint used' column in the waypoints grid.
});
