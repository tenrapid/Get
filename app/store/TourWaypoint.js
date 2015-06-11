Ext.define('Get.store.TourWaypoint', {
	extend: 'Get.data.FeatureStore',
	model: 'Get.model.TourWaypoint',
	alias: 'store.tourWaypoint',

	mixins: [
		'Get.data.PersistentIndexStore'
	],

	pageSize: 0,
	geometryPropertyAssociation: 'waypoint'
});
