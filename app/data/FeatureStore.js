Ext.define('Get.data.FeatureStore', {
	extend: 'Ext.data.Store',
	
	alias: 'store.featureStore',
	
	config: {
		layer: null,
		geometryProperty: 'geometry',
		geometryPropertyAssociation: null,
	},

	geometryPropertyUsersGetter: null,
	geometryPropertyHolderGetter: null,
	geometryPropertyHolderForeignKey: null,

	isLayerBound: false,
	
	featureMap: null,
	
	constructor: function(config) {
		this.callParent([config]);

		if (this.geometryPropertyAssociation) {
			var role = this.model.associations[this.geometryPropertyAssociation];
			if (role.isMany) {
				this.geometryPropertyUsersGetter = role.getterName;
			}
			else {
				this.geometryPropertyHolderGetter = role.getterName;
				this.geometryPropertyHolderForeignKey = role.association.getFieldName();
			}
		}

		if (config.layer) {
			this.bindLayer(config.layer);
		}
	},

	destroy: function() {
		this.fireEvent('beforeDestroy', this);
		this.unbindLayer();
		this.callParent();
	},

	bindLayer: function(layer) {
		if (this.isLayerBound) {
			// already bound
			return;
		}
		this.layer = layer;
		this.isLayerBound = true;
		this.featureMap = {};
		
		this.addFeaturesToLayer(this.getRange());

		this.layer.events.on({
			'featuresadded': this.onFeaturesAdded,
			'featuresremoved': this.onFeaturesRemoved,
			'featuremodified': this.onFeatureModified,
			scope: this
		});
		this.on({
			'load': this.onLoad,
			'clear': this.onClear,
			'add': this.onAdd,
			'remove': this.onRemove,
			'update': this.onStoreUpdate,
			scope: this
		});

		this.fireEvent("bind", this, this.layer);
	},

	unbindLayer: function() {
		if (this.isLayerBound) {
			this.layer.events.un({
				'featuresadded': this.onFeaturesAdded,
				'featuresremoved': this.onFeaturesRemoved,
				'featuremodified': this.onFeatureModified,
				scope: this
			});
			this.un({
				'load': this.onLoad,
				'clear': this.onClear,
				'add': this.onAdd,
				'remove': this.onRemove,
				'update': this.onStoreUpdate,
				scope: this
			});
			this.layer = null;
			this.isLayerBound = false;
			this.featureMap = null;
		}
	},

	addFeatureToRecord: function(record) {
		var geometry,
			geometryPropertyHolder,
			olGeometry,
			feature;

		if (this.geometryPropertyHolderGetter) {
			geometryPropertyHolder = record[this.geometryPropertyHolderGetter]();
			if (geometryPropertyHolder) {
				record.set(this.geometryProperty, geometryPropertyHolder.get(this.geometryProperty));
			}
		}
		geometry = record.get(this.geometryProperty);
		if (geometry.geometry) {
			geometry.transform(this.layer.map.getProjectionObject());
			olGeometry = geometry.geometry.clone();
		}
		feature = new OpenLayers.Feature.Vector(olGeometry, Ext.apply({}, record.getData()));
		this.featureMap[record.getId()] = feature;
		return feature;
	},
	
	getFeature: function(record) {
		return this.featureMap[record.getId()];
	},
	
	
	/**
	 * Returns the record corresponding to a feature.
	 *
	 * @param {OpenLayers.Feature} feature An OpenLayers.Feature.Vector object.
	 * @return {String} The model instance corresponding to a feature.
	 */
	getByFeature: function(feature) {
		var id = Ext.Object.getKey(this.featureMap, feature),
			rec = this.getById(id);
		return rec;
	},

	/**
	 * Returns the record corresponding to a feature id.
	 *
	 * @param {String} id An OpenLayers.Feature.Vector id string.
	 * @return {String} The model instance corresponding to the given id.
	 */
	getByFeatureId: function(id) {
		return (this.snapshot || this.data).findBy(function(record) {
			var feature = this.featureMap[record.getId()];
			return feature && feature.id === id;
		}, this);
	},

	/**
	 * Adds the given records to the associated layer.
	 *
	 * @param {Ext.data.Model[]} records
	 * @private
	 */
	addFeaturesToLayer: function(records) {
		var me = this,
			features = [];
			
		Ext.each(records, function(record) {
			var id = record.getId(),
				feature = me.featureMap[id];
			if (!feature) {
				feature = me.addFeatureToRecord(record);
			}
			features.push(feature);
		});
		this._adding = true;
		this.layer.addFeatures(features);
		delete this._adding;
	},

	/**
	 * Handler for layer featuresadded event.
	 *
	 * @param {Object} evt
	 * @private
	 */
	onFeaturesAdded: function(evt) {
		if (!this._adding) {
			var features = evt.features,
				toAdd = features;
			if (this.featureFilter) {
				toAdd = [];
				for (var i = 0, len = features.length; i < len; i++) {
					var feature = features[i];
					if (this.featureFilter.evaluate(feature) !== false) {
						toAdd.push(feature);
					}
				}
			}
			toAdd = this.proxy.reader.read(toAdd).records;
			// TODO:
			// add features to featureMap
			this._adding = true;
			this.add(toAdd);
			delete this._adding;
		}
	},

	/**
	 * Handler for layer featuresremoved event.
	 *
	 * @param {Object} evt
	 * @private
	 */
	onFeaturesRemoved: function(evt) {
		if (!this._removing) {
			var features = evt.features;
			for (var i = features.length - 1; i >= 0; i--) {
				var record = this.getByFeature(features[i]);
				if (record) {
					this._removing = true;
					delete me.featureMap[record.getId()];
					this.remove(record);
					delete this._removing;
				}
			}
		}
	},

	/**
	 * Handler for layer featuremodified event.
	 *
	 * @param {Object} evt
	 * @private
	 */
	onFeatureModified: function(evt) {
		if (!this._updating) {
			var record = this.getByFeature(evt.feature);
			if (record) {
				this._updating = true;
				record.set(evt.feature.attributes);
				record.dirty = true;
				delete this._updating;
			}
		}
	},

	/**
	 * Handler for a store's load event.
	 *
	 * @param {Ext.data.Store} store
	 * @param {Ext.data.Model[]} records
	 * @param {Boolean} successful
	 * @private
	 */
	onLoad: function(store, records, successful) {
		if (successful) {
			this._removing = true;
			this.layer.removeAllFeatures();
			this.featureMap = {};
			delete this._removing;

			this.addFeaturesToLayer(records);
		}
	},

	/**
	 * Handler for a store's clear event.
	 *
	 * @param {Ext.data.Store} store
	 * @private
	 */
	onClear: function(store) {
		this._removing = true;
		this.layer.removeFeatures(this.layer.features);
		this.featureMap = {};
		delete this._removing;
	},

	/**
	 * Handler for a store's add event.
	 *
	 * @param {Ext.data.Store} store
	 * @param {Ext.data.Model[]} records
	 * @param {Number} index
	 * @private
	 */
	onAdd: function(store, records, index) {
		if (!this._adding) {
			// addFeaturesToLayer takes care of setting
			// this._adding to true and deleting it
			this.addFeaturesToLayer(records);
		}
	},

	/**
	 * Handler for a store's remove event. Depending on the ExtJS version this
	 * method will either receive a single record or an array of records.
	 *
	 * @param {Ext.data.Store} store The FeatureStore.
	 * @param {Ext.data.Model/Ext.data.Model[]} records A single record in
	 *     ExtJS 4 and an array of records in ExtJS 5.
	 * @param {Number} index The index at which the record(s) were removed.
	 * @private
	 */
	onRemove: function(store, records, index) {
		var me = this,
			layer = me.layer,
			removeFeatures = [];

		if (!Ext.isArray(records)) {
			records = [records];
		}
		if (!me._removing) {
			Ext.each(records, function(record){
				var id = record.getId();
				var feature = me.featureMap[id];
				if (layer.getFeatureById(feature.id) !== null) {
					removeFeatures.push(feature);
				}
				delete me.featureMap[id];
			});
			if (removeFeatures.length > 0) {
				me._removing = true;
				layer.removeFeatures(removeFeatures);
				delete me._removing;
			}
		}
	},

	/**
	 * Handler for a store's update event.
	 *
	 * @param {Ext.data.Store} store
	 * @param {Ext.data.Model} record
	 * @param {Number} operation
	 * @param {Array} modifiedFieldNames
	 *
	 * @private
	 */
	onStoreUpdate: function(store, record, operation, modifiedFieldNames) {
		var me = this,
			feature,
			cont,
			geometryPropertyHolder,
			geometryModified = false,
			geometryPropertyHolderModified = false;

		if (!me._updating) {
			feature = me.getFeature(record);
			if (!feature) {
				return;
			}
			if (feature.state !== OpenLayers.State.INSERT) {
				feature.state = OpenLayers.State.UPDATE;
			}
			cont = me.layer.events.triggerEvent('beforefeaturemodified', {
				feature: feature
			});
			if (cont !== false) {
				Ext.each(modifiedFieldNames, function(field) {
					feature.attributes[field] = record.get(field);
					if (field === me.geometryProperty) {
						geometryModified = true;
					}
					else if (field === me.geometryPropertyHolderForeignKey) {
						geometryPropertyHolderModified = true;
					}
				});
				if (geometryPropertyHolderModified) {
					geometryPropertyHolder = record[me.geometryPropertyHolderGetter]();
					if (geometryPropertyHolder) {
						record.set(me.geometryProperty, geometryPropertyHolder.get(me.geometryProperty));
					}
				}
				if (geometryModified) {
					var geometry = record.get(me.geometryProperty),
						featureGeometryId = feature.geometry && feature.geometry.id;
						
					geometry.transform(me.layer.map.getProjectionObject());
					feature.geometry = geometry.geometry.clone();
					if (featureGeometryId) {
						feature.geometry.id = featureGeometryId;
					}
					
					// update geometry in tourWaypoints if this record is a waypoint
					if (me.geometryPropertyUsersGetter) {
						var records = record[me.geometryPropertyUsersGetter]();
						records.each(function(record) {
							record.set(me.geometryProperty, geometry);
						});
					}
				}
				me.layer.drawFeature(feature);

				me._updating = true;
				me.layer.events.triggerEvent('featuremodified', {
					feature: feature
				});
				delete me._updating;
			}
		}
	},

});
