Ext.define('Get.store.Waypoint', {
	extend: 'Get.data.FeatureStore',
	model: 'Get.model.Waypoint',
	alias: 'store.waypoint',

	pageSize: 0,
	geometryPropertyAssociation: 'tourWaypoints',
});
