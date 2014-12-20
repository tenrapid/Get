Ext.define('Get.store.TourWaypoints', {
    extend: 'Get.data.FeatureStore',
    model: 'Get.model.TourWaypoint',
    alias: 'store.tourWaypoints',

	geometryPropertyHolderGetter: 'getWaypoint',
});
