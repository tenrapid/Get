Ext.define('Get.view.map.MapController', {
	extend: 'Ext.app.ViewController',
	alias: 'controller.map',

	id: 'map', // IMPORTANT if using 'listen', ansonsten wird der Listener von anderem Controller bei destroy gelöscht

	config: {
		listen: {
			controller: {
				'#layers': {
					beforeLayerItemSelect: 'onBeforeLayerItemSelect',
					layerItemSelect: 'onLayerItemSelect',
				},
				'#main': {
					projectUnload: 'onProjectUnload',
				}
			},
			global: {
				zoomToWaypoints: 'zoomToWaypoints'
			}
		}
	},

	visibleVectorLayer: null,
	waypointStores: null,

	init: function() {
		this.mon(this.getView().layers, {
			datachanged: this.updateBaseLayerMenuItems,
			scope: this
		});
		this.waypointStores = {};
	},
	
	onProjectUnload: function() {
		var me = this,
			map = this.getView().map;
		
		Ext.iterate(this.waypointStores, function(key, waypointStore) {
			me.removeLayerFromWaypointStore(waypointStore);
			waypointStore.un('beforeDestroy', me.removeLayerFromWaypointStore, me);
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
			this.addLayerToWaypointStore(waypointStore);
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
			styleMap = this.createLayerStyleMap(waypointStore),
			layer = new OpenLayers.Layer.Vector('', {
				styleMap: styleMap,
				rendererOptions: {yOrdering: true},
			});
			
		map.addLayer(layer);
		waypointStore.bindLayer(layer);
		waypointStore.on({
			beforeDestroy: this.removeLayerFromWaypointStore,
			scope: this
		});
		this.waypointStores[layer.id] = waypointStore;
		
		return layer;
	},
	
	removeLayerFromWaypointStore: function(waypointStore) {
		var layer = waypointStore.layer,
			map = this.getView().map;
			
		if (layer) {
			waypointStore.unbindLayer();
			map.removeLayer(layer);
			delete this.waypointStores[layer.id];
		}
	},
	
	zoomToWaypoints: function(waypoints) {
		var geometries = (Ext.isArray(waypoints) ? waypoints : [waypoints]).map(function(waypoint) {
				return waypoint.get('geometry').geometry.clone();
			}),
			collection = new OpenLayers.Geometry.Collection(geometries),
			map = this.getView().map;

		if (collection.components.length) {
			if (collection.components.length === 1) {
				map.setCenter([geometries[0].getCentroid().x, geometries[0].getCentroid().y]);
			}
			else {
				map.zoomToExtent(collection.getBounds());
			}
		}
	},

	createLayerStyleMap: function(waypointStore) {
		var label;

		if (waypointStore.model.entityName === 'Waypoint') {
			label = '${index}';
		}
		else {
			label = '${' + waypointStore.getIndexField() + '}';
		}

		return new OpenLayers.StyleMap({
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
				label: label, //●⬤
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
		});
	}

});
