Ext.define('Get.view.layers.LayersModel', {
	extend: 'Ext.app.ViewModel',
	alias: 'viewmodel.layers',

	formulas: {
		removeLayerButtonDisabled: function(get) {
			var selectedLayerItem = get('selectedLayerItem');
			return selectedLayerItem && selectedLayerItem.isRoot();
		}
	}

});
