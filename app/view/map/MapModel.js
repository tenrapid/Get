Ext.define('Get.view.map.MapModel', {
	extend: 'Ext.app.ViewModel',
	alias: 'viewmodel.map',
	
	formulas: {
		panelTitle: function (get) {
			var item = get('selectedLayerItem');
			var name = get('selectedLayerItem.name');
			if (!item) {
				return 'Map';
			}
			if (item.parentNode && !item.parentNode.isRoot()) {
				name = item.parentNode.get('name') + '&ensp;–&ensp;' + name; // ›
			}
			return '<i class="fa fa-lg fa-map-marker"></i> Karte<span style="font-weight: normal;">&ensp;–&ensp;' + name + '</span>';
		}
	}

});