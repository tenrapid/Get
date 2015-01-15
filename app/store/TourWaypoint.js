Ext.define('Get.store.TourWaypoint', {
	extend: 'Get.data.FeatureStore',
	model: 'Get.model.TourWaypoint',
	alias: 'store.tourWaypoint',

	pageSize: 0,
	geometryPropertyHolderGetter: 'getWaypoint',
});
