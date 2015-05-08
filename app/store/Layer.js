Ext.define('Get.store.Layer', {
	extend: 'Ext.data.TreeStore',
	
	model: 'Get.model.LayerTreeRoot',
	alias: 'store.layer',

	rootVisible: true,
	root: {
		expanded: false,
		expandable: false,
		name: 'Alle Wegpunkte',
	}

});

