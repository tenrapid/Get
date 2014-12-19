/**
 * This class is the main view for the application. It is specified in app.js as the
 * "autoCreateViewport" property. That setting automatically applies the "viewport"
 * plugin to promote that instance of this class to the body element.
 *
 * TODO - Replace this content of this view to suite the needs of your application.
 */
Ext.define('Get.view.main.Main', {
    extend: 'Ext.container.Container',
    requires: [
        'Get.view.main.MainController',
        'Get.view.main.MainModel',
        'GeoExt.panel.Map'
    ],

    xtype: 'app-main',
    
    controller: 'main',
    viewModel: {
        type: 'main'
    },

    layout: {
        type: 'border'
    },

    items: [{
        xtype: 'panel',
        bind: {
            title: '{name}'
        },
        region: 'west',
        html: '<ul><li>This area is commonly used for navigation, for example, using a "tree" component.</li></ul>',
        width: 250,
        split: true,
        tbar: [{
            text: 'Button',
            handler: 'onClickButton'
        }]
    },{
        region: 'center',
        xtype: 'tabpanel',
        items:[{
            title: 'Map',
            layout: 'fit',
            items: [
            	{
	            	xtype: 'gx_mappanel',
					center: (new OpenLayers.LonLat(13.7414258, 51.0504017)).transform(
						new OpenLayers.Projection('EPSG:4326'),
						new OpenLayers.Projection('EPSG:900913')),
					zoom: 14,
					layers: [
						new OpenLayers.Layer.OSM("Terrain", [
							"http://a.tiles.mapbox.com/v3/examples.map-9d0r2yso/${z}/${x}/${y}.png",
							"http://b.tiles.mapbox.com/v3/examples.map-9d0r2yso/${z}/${x}/${y}.png",
							"http://c.tiles.mapbox.com/v3/examples.map-9d0r2yso/${z}/${x}/${y}.png",
						]),
					]
	            }
            ]
//             html: '<h2>Content appropriate for the current navigation.</h2>'
        }]
    }]
});
