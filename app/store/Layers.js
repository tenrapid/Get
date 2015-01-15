Ext.define('Get.store.Layers', {
	extend: 'Ext.data.TreeStore',
	
	model: 'Get.model.LayerTreeRoot',
	rootVisible: true,
	root: {
		expanded: false,
		expandable: false,
		name: 'All Waypoints',
	}

});

