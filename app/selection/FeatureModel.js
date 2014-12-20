/*
 * Copyright (c) 2008-2014 The Open Source Geospatial Foundation
 *
 * Published under the BSD license.
 * See https://github.com/geoext/geoext2/blob/master/license.txt for the full
 * text of the license.
 */

/*
 * @include OpenLayers/Control/SelectFeature.js
 * @include OpenLayers/Layer/Vector.js
 * @include OpenLayers/Util.js
 * @include OpenLayers/BaseTypes/Class.js
 * @requires GeoExt/Version.js
 */

/**
 * A row selection model which enables automatic selection of features
 * in the map when rows are selected in the grid and vice-versa.
 *
 * Sample code to create a feature grid with a feature selection model:
 *
 * Example:
 *
 *     var gridPanel = Ext.create('Ext.grid.GridPanel', {
 *         title: "Feature Grid",
 *         region: "east",
 *         store: store,
 *         width: 320,
 *         columns: [{
 *             header: "Name",
 *             width: 200,
 *             dataIndex: "name"
 *         }, {
 *             header: "Elevation",
 *             width: 100,
 *             dataIndex: "elevation"
 *         }],
 *         selType: 'featuremodel'
 *     });
 *
 * @class GeoExt.selection.FeatureModel
 */
Ext.define('Get.selection.FeatureModel', {
    extend: 'Ext.selection.RowModel',
    alias: 'selection.featuremodel',
    requires: [
        'GeoExt.Version'
    ],

    /**
     * If true the select feature control is activated and deactivated when
     * binding and unbinding.
     *
     * @cfg {Boolean}
     */
    autoActivateControl: true,

    /**
     * If true, and if the constructor is passed neither a layer nor a select
     * feature control, a select feature control is created using the layer
     * found in the grid's store. Set it to false if you want to manually bind
     * the selection model to a layer.
     *
     * @cfg {Boolean}
     */
    layerFromStore: true,

    /**
     * The select feature control instance. If not provided one will be created.
     *
     * If provided any "layer" config option will be ignored, and its "multiple"
     * option will be used to configure the selectionModel.  If an `Object`
     * is provided here, it will be passed as config to the SelectFeature
     * constructor, and the "layer" config option will be used for the layer.
     *
     * @cfg {OpenLayers.Control.SelectFeature}
     */
    selectControl: null,

    /**
     * The vector layer used for the creation of the select feature control, it
     * must already be added to the map. If not provided, the layer bound to the
     * grid's store, if any, will be used.
     *
     * @cfg {OpenLayers.Layer.Vector} layer
     */

    /**
     * Flag indicating if the selection model is bound.
     *
     * @property {Boolean}
     * @private
     */
    isLayerBound: false,

    /**
     * An array to store the selected features.
     *
     * @property {OpenLayers.Feature.Vector[]}
     * @private
     */
    selectedFeatures: [],

    /**
     * If true the map will recenter on feature selection so that the selected
     * features are visible.
     *
     * @cfg {Boolean}
     */
    autoPanMapOnSelection: false,

    /**
     * @private
     */
    constructor: function(config) {
        config = config || {};
        if (config.selectControl instanceof OpenLayers.Control.SelectFeature) {
            if (!config.singleSelect) {
                var ctrl = config.selectControl;
                config.singleSelect = !(ctrl.multiple || !!ctrl.multipleKey);
            }
        } else if (config.layer instanceof OpenLayers.Layer.Vector) {
            this.selectControl = this.createSelectControl(config.layer, config.selectControl);
            delete config.layer;
            delete config.selectControl;
        }
        if (config.autoPanMapOnSelection) {
            this.autoPanMapOnSelection = true;
            delete config.autoPanMapOnSelection;
        }
        this.callParent(arguments);
    },

    /**
     * Called after this.grid is defined.
     *
     * @private
     */
    bindComponent: function(view) {
        this.callParent(arguments);

        if (!view) {
        	if (this.isLayerBound) {
				this.unbindLayer();
        	}
        	return;
        }
        if (this.layerFromStore) {
            var store = view.getStore(),
            	layer = store && store.layer;
            if (layer) {
				if (this.selectControl instanceof OpenLayers.Control.SelectFeature) {
					this.selectControl.setLayer(layer);
				}
				else {
					this.selectControl = this.createSelectControl(layer, this.selectControl);
				}
	            this.bindLayer(this.selectControl);
            }
        }
        else if (this.selectControl) {
            this.bindLayer(this.selectControl);
        }
    },
    

    /**
     * Create the select feature control.
     *
     * @param {OpenLayers.Layer.Vector} layer The vector layer.
     * @param {Object} config The select feature control config.
     * @private
     */
    createSelectControl: function(layer, config) {
        config = config || {};
        var singleSelect = config.singleSelect !== undefined ? config.singleSelect : this.singleSelect;
        config = OpenLayers.Util.extend({
            toggle: true,
            multipleKey: singleSelect ? null : (Ext.isMac ? "metaKey" : "ctrlKey"),
        }, config);
        
        // Handle double clicks on features and relay them to the grid view
        var view = this.view;
        config.callbacks = {
        	dblclick: function(feature) {
				this.select(feature);
				var record = view.store.getByFeature(feature);
				view.fireEvent('rowdblclick', view, record, null, null, null);
			}, 
		};

        var selectControl = new OpenLayers.Control.SelectFeature(layer, config);
        layer.map.addControl(selectControl);
        return selectControl;
    },

    /**
     * Bind the selection model to a layer or a SelectFeature control.
     *
     * @param {OpenLayers.Layer.Vector/OpenLayers.Control.SelectFeature} obj
     *     The object this selection model should be bound to, either a vector
     *     layer or a select feature control.
     * @param {Object} options An object with a "controlConfig" property
     *     referencing the configuration object to pass to the
     *     `OpenLayers.Control.SelectFeature` constructor.
     * @return {OpenLayers.Control.SelectFeature} The select feature control
     *     this selection model uses.
     */
    bindLayer: function(obj, options) {
        if (!this.isLayerBound) {
            options = options || {};
            if (obj instanceof OpenLayers.Control.SelectFeature) {
	            this.selectControl = obj;
	        }
            else if (obj instanceof OpenLayers.Layer.Vector) {
            	if (this.selectControl instanceof OpenLayers.Control.SelectFeature) {
            		if (!options.controlConfig) {
	            		this.selectControl.setLayer(obj);
            		}
            		else {
            			this.selectControl.layer.map.removeControl(this.selectControl);
            			this.selectControl = null;
            		}
            	}
            	if (!this.selectControl) {
	                this.selectControl = this.createSelectControl(obj, options.controlConfig);
	            }
            }
            else {
            	Ext.Error.raise('Neither SelectControl nor Layer given.');
            }
    		this.deselectAll();
            if (this.autoActivateControl) {
                this.selectControl.activate();
            }
            var layers = this.getLayers();
            for (var i = 0, len = layers.length; i < len; i++) {
                layers[i].events.on({
                    featureselected: this.featureSelected,
                    featureunselected: this.featureUnselected,
                    scope: this
                });
            }
            this.isLayerBound = true;
        }
        return this.selectControl;
    },

    /**
     * Unbind the selection model from the layer or SelectFeature control.
     *
     * @return {OpenLayers.Control.SelectFeature} The select feature control
     *     this selection model used.
     */
    unbindLayer: function() {
        var selectControl = this.selectControl;
        if (this.isLayerBound) {
            var layers = this.getLayers();
            for (var i = 0, len = layers.length; i < len; i++) {
                layers[i].events.un({
                    featureselected: this.featureSelected,
                    featureunselected: this.featureUnselected,
                    scope: this
                });
            }
            if (this.autoActivateControl) {
            	selectControl.unselectAll();
                selectControl.deactivate();
            }
            this.isLayerBound = false;
        }
        return selectControl;
    },

    /**
     * Handler for when a feature is selected.
     *
     * @param {Object} evt An object with a `feature` property referencing the
     *     selected feature.
     * @private
     */
    featureSelected: function(evt) {
        if (!this._selecting) {
            var record = this.view.store.getByFeature(evt.feature);
            if (record && !this.isSelected(record)) {
//         console.log('featureSelected', this.getSelection(), this._selecting);//return;
                this._selecting = true;
                this.select(record, !this.singleSelect);
                this._selecting = false;
                // focus the row in the grid to ensure it is visible
                this.view.focusRow(record);
            }
        }
    },

    /**
     * Handler for when a feature is unselected.
     *
     * @param {Object} evt An object with a `feature` property referencing the
     *     unselected feature.
     * @private
     */
    featureUnselected: function(evt) {
        if (!this._selecting) {
            var record = this.view.store.getByFeature(evt.feature);
            if (record && this.isSelected(record)) {
//         console.log('featureUnselected', this.getSelection(), this._selecting);//return;
                this._selecting = true;
                this.deselect(record);
                // war ein Hack für vermutlich einen Bug in extjs5.0.1
// 	            this.view.getNavigationModel().setPosition(record, null, null, false, true);
                this._selecting = false;
	            this.view.focusRow(record);
            }
        }
    },

    /**
     * Synchronizes selection on the layer with selection in the grid.
     *
     * @param {Ext.data.Record} record The record.
     * @param {Boolean} isSelected.
     * @private
     */
    onSelectChange: function(record, isSelected) {
        this.callParent(arguments);
        
        if (!this.view) {
        	return;
        }

//         console.log('onSelectChange', this.getSelection(), '_selecting', this._selecting, 'isSelected', isSelected); //return;
        var feature = this.view.store.getFeature(record);
        if (this.isLayerBound && !this._selecting && feature) {
            var layers = this.getLayers();
            if (isSelected) {
                for (var i = 0, len = layers.length; i < len; i++) {
                    if (Ext.Array.indexOf(layers[i].selectedFeatures, feature) == -1) {
                        this._selecting = true;
                        this.selectControl.select(feature);
                        this._selecting = false;
                        this.selectedFeatures.push(feature);
                        break;
                    }
                }
                if (this.autoPanMapOnSelection) {
                    this.recenterToSelectionExtent();
                }
            }
            else {
                for (var i = 0, len = layers.length; i < len; i++) {
                    if (Ext.Array.indexOf(layers[i].selectedFeatures, feature) != -1) {
                        this._selecting = true;
                        this.selectControl.unselect(feature);
                        this._selecting = false;
                        OpenLayers.Util.removeItem(this.selectedFeatures, feature);
                        break;
                    }
                }
                if (this.autoPanMapOnSelection && this.selectedFeatures.length > 0) {
                    this.recenterToSelectionExtent();
                }
            }
        }
    },

    /**
     * Gets the layers attached to the select feature control.
     *
     * @return the layers attached to the select feature control.
     * @private
     */
    getLayers: function() {
        return this.selectControl.layers || [this.selectControl.layer];
    },

    /**
     * Centers the map in order to display all selected features.
     *
     * @private
     */
    recenterToSelectionExtent: function() {
        var map = this.selectControl.map;
        var selectionExtent = this.getSelectionExtent();
        var selectionExtentZoom = map.getZoomForExtent(selectionExtent, false);
        if (selectionExtentZoom > map.getZoom()) {
            map.setCenter(selectionExtent.getCenterLonLat());
        }
        else {
            map.zoomToExtent(selectionExtent);
        }
    },

    /**
     * Calculates the max extent which includes all selected features.
     *
     * @return {OpenLayers.Bounds} Returns null if the layer has no features
     *     with geometries.
     */
    getSelectionExtent: function () {
        var maxExtent = null;
        var features = this.selectedFeatures;
        if (features && (features.length > 0)) {
            var geometry = null;
            for (var i = 0, len = features.length; i < len; i++) {
                geometry = features[i].geometry;
                if (geometry) {
                    if (maxExtent === null) {
                        maxExtent = new OpenLayers.Bounds();
                    }
                    maxExtent.extend(geometry.getBounds());
                }
            }
        }
        return maxExtent;
    }
});
