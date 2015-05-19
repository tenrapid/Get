Ext.define('Get.view.map.Map', {
	extend: 'GeoExt.panel.Map',
	xtype: 'get-map',

	requires: [
		'Get.view.map.MapController',
		'Get.view.map.MapModel',
	],

	controller: 'map',
	viewModel: 'map',

	id: 'map-panel',
	stateful: true,
	stateId: 'map-panel',
	saveDelay: 1000,
	prettyStateKeys: true,

	title: '<i class="fa fa-lg fa-map-marker"></i> Karte',
	layout: 'fit',
	border: false,
	
	map: {
		allOverlays: false,
	},
	center: (new OpenLayers.LonLat(13.7414258, 51.0504017)).transform(
		new OpenLayers.Projection('EPSG:4326'),
		new OpenLayers.Projection('EPSG:900913')),
	zoom: 14,
	layers: [
		new OpenLayers.Layer.OSM("Streets Gray", [
			"http://a.tiles.mapbox.com/v3/examples.map-20v6611k/${z}/${x}/${y}.png",
			"http://b.tiles.mapbox.com/v3/examples.map-20v6611k/${z}/${x}/${y}.png",
			"http://c.tiles.mapbox.com/v3/examples.map-20v6611k/${z}/${x}/${y}.png",
		]),
		new OpenLayers.Layer.OSM("OpenStreetMap", [
			'http://a.tile.openstreetmap.org/${z}/${x}/${y}.png',
			'http://b.tile.openstreetmap.org/${z}/${x}/${y}.png',
			'http://c.tile.openstreetmap.org/${z}/${x}/${y}.png'
		]),
		new OpenLayers.Layer.OSM("Streets", [
			"http://a.tiles.mapbox.com/v3/examples.c7d2024a/${z}/${x}/${y}.png",
			"http://b.tiles.mapbox.com/v3/examples.c7d2024a/${z}/${x}/${y}.png",
			"http://c.tiles.mapbox.com/v3/examples.c7d2024a/${z}/${x}/${y}.png",
		]),
		new OpenLayers.Layer.OSM("Terrain", [
			"http://a.tiles.mapbox.com/v3/examples.map-9d0r2yso/${z}/${x}/${y}.png",
			"http://b.tiles.mapbox.com/v3/examples.map-9d0r2yso/${z}/${x}/${y}.png",
			"http://c.tiles.mapbox.com/v3/examples.map-9d0r2yso/${z}/${x}/${y}.png",
		]),
		new OpenLayers.Layer.OSM("Terrain 2", [
			"http://a.tiles.mapbox.com/v3/lxbarth.i6fgdd0o/${z}/${x}/${y}.png",
			"http://b.tiles.mapbox.com/v3/lxbarth.i6fgdd0o/${z}/${x}/${y}.png",
			"http://c.tiles.mapbox.com/v3/lxbarth.i6fgdd0o/${z}/${x}/${y}.png",
		]),
		new OpenLayers.Layer.OSM("Pirates", [
			"http://a.tiles.mapbox.com/v3/examples.a3cad6da/${z}/${x}/${y}.png",
			"http://b.tiles.mapbox.com/v3/examples.a3cad6da/${z}/${x}/${y}.png",
			"http://c.tiles.mapbox.com/v3/examples.a3cad6da/${z}/${x}/${y}.png",
		]),
		new OpenLayers.Layer.OSM("Satellite", [
			"http://a.tiles.mapbox.com/v3/examples.map-qfyrx5r8/${z}/${x}/${y}.png",
			"http://b.tiles.mapbox.com/v3/examples.map-qfyrx5r8/${z}/${x}/${y}.png",
			"http://c.tiles.mapbox.com/v3/examples.map-qfyrx5r8/${z}/${x}/${y}.png",
		])
	],
	listeners: {
		afterrender: function() {
			this.body.unselectable();
		}
	},
	
	tbar: [
		'->',
// 		{
// 			xtype: 'tbtext',
// 			text: 'Map type:',
// 			style: 'color: #777'
// 		},
		{
			text: 'Map type',
			menu: {
				xtype: 'menu',
				reference: 'baseLayerMenu'
			},
		}
	],

	applyState: function(state) {
		var me = this,
			map = this.map;

		this.layers.each(function(layerModel) {
			var layer = layerModel.getLayer(),
				visibility = state["visibility_" + layer.name];

			if (visibility !== undefined) {
				if (layer.isBaseLayer) {
					if (visibility) {
						me.baseLayer = layer;
						map.setBaseLayer(layer);
					}
				} 
				else {
					layer.setVisibility(visibility);
				}
			}
		});

		if (this.rendered) {
			this.center = new OpenLayers.LonLat(state.x, state.y);
			this.zoom = state.zoom;
			this.map.setCenter(this.center, this.zoom);
		}
	},

	setInitialExtent: function() {
		this.callParent();
		if (this.baseLayer) {
			this.map.setBaseLayer(this.baseLayer);
		}
	}
	
});
