Ext.define('Get.store.Waypoint', {
	extend: 'Get.data.FeatureStore',
	model: 'Get.model.Waypoint',
	alias: 'store.waypoint',

	mixins: [
		'Get.data.PersistentIndexStore'
	],

	config: {
		indexField: 'index'
	},
	
	pageSize: 0,
	geometryPropertyAssociation: 'tourWaypoints',
});
