Ext.define('Get.store.TourWaypoint', {
	extend: 'Get.data.FeatureStore',
	model: 'Get.model.TourWaypoint',
	alias: 'store.tourWaypoint',

	pageSize: 0,
	geometryPropertyAssociation: 'waypoint',

	getIndexField: function() {
		return this.associatedEntity ? Ext.String.uncapitalize(this.associatedEntity.entityName) + 'Index' : null;
	}
});
