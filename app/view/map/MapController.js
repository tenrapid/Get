Ext.define('Get.view.map.MapController', {
	extend: 'Ext.app.ViewController',
	alias: 'controller.map',

	requires: [
	],

	id: 'map', // IMPORTANT if using 'listen', ansonsten wird der Listener von anderem Controller bei destroy gelöscht

	config: {
		listen: {
			controller: {
				'#layers': {
					beforeLayerItemSelect: 'onBeforeLayerItemSelect',
					layerItemSelect: 'onLayerItemSelect',
					layerItemRemove: 'onLayerItemRemove',
				},
				'*': {
// 					projectLoad: Ext.emptyFn,
					projectUnload: 'onProjectUnload',
				}
			},
		},
	},

	visibleVectorLayer: null,
	waypointStores: {},

	init: function() {
		this.mon(this.getView().layers, {
			datachanged: this.updateBaseLayerMenuItems,
			scope: this
		});
	},
	
	onProjectUnload: function() {
		var map = this.getView().map;
		
		Ext.iterate(this.waypointStores, function(key, store) {
			var layer = store.layer;
			store.unbindLayer();
			map.removeLayer(layer);
		});
		this.waypointStores = {};
		this.visibleVectorLayer = null;
	},
	
	updateBaseLayerMenuItems: function() {
		var menu = this.lookupReference('baseLayerMenu'),
			button = menu.up(),
			mapPane = this.getView(),
			visibleLayer;
			
		menu.removeAll();
		
		mapPane.layers.each(function(record, i) {
			var layer = record.raw;
			if (layer.isBaseLayer) {
				menu.add({
					text: layer.name,
					checked: layer.visibility,
					group: 'baseLayer',
					checkHandler: function(item, checked) {
						if (checked) {
							mapPane.map.setBaseLayer(layer);
							button.setText(layer.name);
						}
					}
				});
				if (layer.visibility) {
					visibleLayer = layer;
				}
			}
		});
		button.setText(visibleLayer.name);
	},
	
	onBeforeLayerItemSelect: function(item, waypointStore) {
		var layer = waypointStore && waypointStore.layer;
		if (!layer && waypointStore) {
			layer = this.addLayerToWaypointStore(waypointStore);
		}
	},

	onLayerItemSelect: function(item, waypointStore) {
		var layer = waypointStore && waypointStore.layer;
		if (this.visibleVectorLayer) {
			this.visibleVectorLayer.setVisibility(false);
		}
		if (layer) {
			layer.setVisibility(true);
		}
		this.visibleVectorLayer = layer;
	},
	
	addLayerToWaypointStore: function(waypointStore) {
		var map = this.getView().map,
			layer;
			
		layer = new OpenLayers.Layer.Vector('', {
			styleMap: this.styleMap,
			rendererOptions: {yOrdering: true},
		});
		map.addLayer(layer);
		waypointStore.bindLayer(layer);
		this.waypointStores[layer.id] = waypointStore;
		
		return layer;
	},
	
	onLayerItemRemove: function(item, waypointStore) {
		var layer = waypointStore.layer,
			map = this.getView().map;
			
		if (layer) {
			waypointStore.unbindLayer();
			map.removeLayer(layer);
			delete this.waypointStores[layer.id];
		}
	},
	
	styleMap: new OpenLayers.StyleMap({
		'default': new OpenLayers.Style(Ext.applyIf({
// 			fillColor: 'red',
// 			strokeColor: 'red',
			cursor: "inherit",
			fill: false,
			stroke: false,
			fillOpacity: 0.6,
			pointRadius: 9,
			strokeOpacity: 1,
			strokeWidth: 2,
// 			externalGraphic: 'resources/images/pin-edgy_.png',
// 			graphicWidth: 25,
// 			graphicHeight: 39,
// 			graphicYOffset: -30,
			externalGraphic: 'resources/images/pin-square.png',
			graphicWidth: 26,
			graphicHeight: 37,
			graphicYOffset: -30,
			graphicOpacity: 1,
// 			backgroundGraphic: 'resources/images/markerShadow.png',
// 			backgroundYOffset: 2,
// 			backgroundWidth: 26,
// 			backgroundHeight: 15,
			label: '${id}', //●⬤
			labelYOffset: 17,
			fontColor: 'white',
			fontWeight: 'bold',
			fontFamily: 'Tahoma',
			fontSize: 11,
			labelOutlineWidth: 0,
		}, OpenLayers.Feature.Vector.style['default'])),
		'select': new OpenLayers.Style(Ext.applyIf({
			cursor: "inherit",
			pointRadius: 9,
			fillOpacity: 0.6,
			fontColor: 'white',
			labelOutlineWidth: 0,
			externalGraphic: 'resources/images/pin-square-selected.png',
// 			graphicWidth: 30,
// 			graphicHeight: 70,
// 			graphicOpacity: 1,
		}, OpenLayers.Feature.Vector.style['select']))
	}),

});
