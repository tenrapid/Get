Ext.define('Get.view.map.Map', {
    extend: 'GeoExt.panel.Map',
    alias: 'widget.get-mappanel',

    requires: [
        'Get.view.map.MapController',
        'Get.view.map.MapModel',
    ],
    controller: 'map',
	viewModel: 'map',

	title: 'Map',
	layout: 'fit',
	border: false,
	
	bind: {
		title: '{panelTitle}',
	},
	
	map: {
		allOverlays: false,
	},
	center: (new OpenLayers.LonLat(13.7414258, 51.0504017)).transform(
		new OpenLayers.Projection('EPSG:4326'),
		new OpenLayers.Projection('EPSG:900913')),
	zoom: 14,
	layers: [
		new OpenLayers.Layer.OSM("OpenStreetMap", [
			'http://a.tile.openstreetmap.org/${z}/${x}/${y}.png',
			'http://b.tile.openstreetmap.org/${z}/${x}/${y}.png',
			'http://c.tile.openstreetmap.org/${z}/${x}/${y}.png'
		]),
		new OpenLayers.Layer.OSM("Streets Gray", [
			"http://a.tiles.mapbox.com/v3/examples.map-20v6611k/${z}/${x}/${y}.png",
			"http://b.tiles.mapbox.com/v3/examples.map-20v6611k/${z}/${x}/${y}.png",
			"http://c.tiles.mapbox.com/v3/examples.map-20v6611k/${z}/${x}/${y}.png",
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
		new OpenLayers.Layer.OSM("Satellite", [
			"http://a.tiles.mapbox.com/v3/examples.map-qfyrx5r8/${z}/${x}/${y}.png",
			"http://b.tiles.mapbox.com/v3/examples.map-qfyrx5r8/${z}/${x}/${y}.png",
			"http://c.tiles.mapbox.com/v3/examples.map-qfyrx5r8/${z}/${x}/${y}.png",
		]),
		new OpenLayers.Layer.OSM("lxbarth.i6fgdd0o", [
			"http://a.tiles.mapbox.com/v3/lxbarth.i6fgdd0o/${z}/${x}/${y}.png",
			"http://b.tiles.mapbox.com/v3/lxbarth.i6fgdd0o/${z}/${x}/${y}.png",
			"http://c.tiles.mapbox.com/v3/lxbarth.i6fgdd0o/${z}/${x}/${y}.png",
		]),
		new OpenLayers.Layer.OSM("Pirates", [
			"http://a.tiles.mapbox.com/v3/examples.a3cad6da/${z}/${x}/${y}.png",
			"http://b.tiles.mapbox.com/v3/examples.a3cad6da/${z}/${x}/${y}.png",
			"http://c.tiles.mapbox.com/v3/examples.a3cad6da/${z}/${x}/${y}.png",
		]),
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
	
});
