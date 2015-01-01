Ext.define('Get.store.Tours', {
	extend: 'Ext.data.TreeStore',
	
	model: 'Get.model.LayerTreeRoot',
	rootVisible: true,
	root: {
		expanded: false,
		expandable: false,
		name: 'All Waypoints',
	}

});

