Ext.define('Get.store.Waypoints', {
    extend: 'Get.data.FeatureStore',
    model: 'Get.model.Waypoint',
    alias: 'store.waypoints',

	geometryPropertyUsersGetter: 'tourWaypoints',
});
