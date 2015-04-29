Ext.define('Get.project.Project', {
	extend: 'Ext.data.Model',

	requires: [
		'Ext.data.Session',
		'Ext.data.TreeStore',
		'Ext.data.TreeModel',
		'Get.data.Session',
		'Get.store.Waypoint',
		'Get.store.TourWaypoint',
		'Get.store.Picture',
		'Get.store.Tour',
		'Get.store.Area',
		'Get.store.Layer',
		'Get.project.controller.StoreEventNormalizationController',
		'Get.project.controller.ModificationStateController',
		'Get.project.controller.UndoManager',
		'Get.project.controller.WaypointIndexUpdateController',
		'Get.project.controller.PictureManager',
		'tenrapid.data.proxy.Sqlite'
	],

	schema: {
		id: 'project',
		namespace: 'Get.project',
	},

	identifier: {
		type: 'sequential',
	},
	
	fields: [
		{
			name: 'id',
			type: 'int'
		},
		{
			name: 'name',
			defaultValue: 'Unbenannt',
			persist: false
		},
		{
			name: 'filename',
			persist: false,
			convert: function(filename, project) {
				project.getProxy().setFilename(filename);
				project.stores.forEach(function(name) {
					project.getStore(name).getProxy().setFilename(filename);
				});
				return filename;
			}
		},
		{
			name: 'state',
			// TODO: field "state"
		},
		{
			name: 'waypoints',
			persist: false
		},
		{
			name: 'layers',
			persist: false
		},
		{
			name: 'isModified',
			persist: false
		}
	],

	controllers: [
		'StoreEventNormalizationController', 
		'ModificationStateController', 
		'UndoManager', 
		'WaypointIndexUpdateController',
		'PictureManager'
	],

	stores: [
		'tour', 'area', 'waypoint', 'tourWaypoint', 'picture' 
	],

	constructor: function(data) {
		window.p = this;
		var me = this,
			session = Ext.create('Get.data.Session'),
			proxyConfig = {
				type: 'sqlite',
				uniqueIdStrategy: true,
				debug: false,
				writer: {
					type: 'json',
					allowSingle: false,
				}
			},
			storeConfig = {
				session: session,
				proxy: proxyConfig
			};

		// Don't use this model's default proxy instance.
		this.proxy = Ext.Factory.proxy(proxyConfig);
		this.proxy.setModel(this.self);

		// Create stores.
		this.stores.forEach(function(name) {
			me.setStore(name, Ext.Factory.store(Ext.apply({type: name}, storeConfig)));
		});
		this.layerStore = Ext.create('Get.store.Layer', storeConfig);
		this.layerStore.getRoot().phantom = false;

		data = Ext.apply(data, {id: 1});
		this.callParent([data, session]);
	},

	destroy: function() {
		var me = this;
		this.layerStore.destroy();
		this.layerStore = null;
		this.stores.forEach(function(name) {
			me.getStore(name).destroy();
			me.setStore(name, null);
		});
		this.session.destroy();
		this.session = null;
		this.getProxy().destroy();
		this.destroyControllers();
		this.callParent();
	},
	
	load: function(callback, scope) {
		var me = this,
			fs = require('fs'),
			filename = this.get('filename'),
			errors = [],
			onLoadCount = filename ? this.stores.length + 1 : 1,
			onLoad = function(records, operation, success) {
				onLoadCount--;

				if (!success) {
					errors.push(operation.getError());
				}
				if (onLoadCount === 0) {
					if (!errors.length) {
						me.updateName();
						me.buildLayerTree();
						me.adjustIdentifierSeeds();
						me.sortWaypoints();

						me.createControllers();

						me.set('layers', me.layerStore);
						me.set('waypoints', me.waypointStore);

						me.pictureManager.on('progress', me.updateSaveProgress);
					}
					Ext.callback(callback, scope, [me, errors.length ? errors : null]);
				} 
			};

		if (filename) {
			if (!fs.existsSync(filename)) {
				Ext.callback(callback, scope, [me, new Error('"' + filename + '" existiert nicht.')]);
				return;
			}

			this.callParent([{
				callback: onLoad
			}]);
			this.stores.forEach(function(name) {
				me.getStore(name).load(onLoad);
			});
		}
		else {
			var root = this.layerStore.getRoot();
			root.set('loaded', true);
			root.expand(false, function() {
				onLoad(null, null, true);
			});
		}
	},
	
	save: function(callback, scope) {
		var me = this,
			async = require('async'),
			saveBatch = this.session.getSaveBatch();

		if (saveBatch) {
			Ext.Msg.show({
				progress: true,
				closable: false,
				title: 'Speichern', 
				message: me.get('name') + '.get wird gespeichert…', 
				progressText: '0 %'
			});
			async.waterfall([
				function(callback) {
					me.pictureManager.save(callback);
				},
				function(callback) {
					// Ext.data.session.BatchVisitor configures the operations with the model's default proxy.
					// We need the proxies of this project's stores.
					saveBatch.operations.forEach(function(operation) {
						var entityName = operation.getProxy().getModel().entityName;

						if (entityName === 'Project') {
							operation.setProxy(me.getProxy());
						}
						else {
							operation.setProxy(me.getStore(Ext.String.uncapitalize(entityName)).getProxy());
						}
					});
					saveBatch.on('complete', function() {
						var errors;
						if (saveBatch.hasException()) {
							errors = saveBatch.getExceptions().map(function(operation) {
								return operation.getError();
							});
						}
						if (!errors) {
							me.updateName();
						}
						me.modificationStateController.afterSave();
						callback(errors);
					});
					Ext.Msg.updateProgress(0.9, '90 %');
					saveBatch.start();
				}
			], function(err) {
				Ext.Msg.updateProgress(1, '100 %');
				Ext.Msg.close();
				Ext.callback(callback, scope, [me, err]);
			});
		}
		else {
			// no changes but filename may be changed due to save as
			me.updateName();
			Ext.callback(callback, scope, [me, null]);
		}
	},

	updateSaveProgress: function(progress) {
		Ext.Msg.updateProgress(0.9 * progress, Math.round(90 * progress) + ' %');
	},

	close: function(callback, scope) {
		this.getProxy().closeDatabase(function(err) {
			Ext.callback(callback, scope, [err]);
		});
	},

	createControllers: function() {
		var me = this;
		this.controllers.forEach(function (controller) {
			me[Ext.String.uncapitalize(controller)] = Ext.create('Get.project.controller.' + controller, {
				project: me
			});
		});
	},

	destroyControllers: function() {
		var me = this;
		this.controllers.forEach(function (controller) {
			if (me[Ext.String.uncapitalize(controller)]) {
				me[Ext.String.uncapitalize(controller)].destroy();	
			}
		});
	},

	updateName: function() {
		var filename = this.get('filename'),
			path = require('path'),
			name;
		if (filename) {
			name = path.basename(filename, '.get');
			this.set('name', name);
		}
	},

	buildLayerTree: function() {
		var root = this.layerStore.getRoot(),
			tourStore = this.tourStore,
			areaStore = this.areaStore;

		areaStore.sort([
			{
				property: 'parentId',
				direction: 'ASC'
			},
			{
				property: 'index',
				direction: 'ASC'
			}
		]);
		areaStore.each(function(record) {
			tourStore.getById(record.get('parentId')).appendChild(record);
		});
		tourStore.sort([
			{
				property: 'index',
				direction: 'ASC'
			}
		]);
		tourStore.each(function(record) {
			record.set('loaded', true);
			root.appendChild(record);
			// Commit because of loading this node with a regular store the "parentId" field got reset to null.
			record.commit(true);
		});
		root.set('loaded', true);
		root.expand();
	},

	adjustIdentifierSeeds: function() {
		var me = this, 
			stores = Ext.Array.clone(this.stores),
			seed;

		// areaStore is sharing an identifier with tourStore
		Ext.Array.remove(stores, 'area');

		stores.forEach(function(name) {
			var store = me.getStore(name),
				model = store.getModel(),
				maxId;

			if (model.entityName === 'Tour') {
				maxId = Math.max(store.max('id'), me.areaStore.max('id'));
			}
			else {
				maxId = store.max('id');
			}
			seed = (maxId || 0) + 1;
			model.identifier.setSeed(seed);
			if (!model.prototype.isNode) {
				// Session uses an identifier cache which holds cloned model identifiers. Models that are 
				// not nodes are created in Model.constructor which uses the session to generate an id.
				me.session.getIdentifier(model).setSeed(seed);
			}
		});
	},

	sortWaypoints: function() {
		// sort the waypoints and tour waypoints and remove the sorter afterwards
		this.waypointStore.sort('index', 'ASC');
		this.waypointStore.data.getSorters().removeAll();
		this.tourStore.getRange().concat(this.areaStore.getRange()).forEach(function(layer) {
			var store = layer.tourWaypoints();
			store.sort(store.getIndexField(), 'ASC');
			store.data.getSorters().removeAll();
		});
	},
	
	set: function(fieldName) {
		this.callParent(arguments);
		if (fieldName != 'isModified') {
			// TODO: project.set
			// this.onStoreModification(this);
			// this.set('isModified', this.dirty);
		}
	},

	getProxy: function() {
		return this.proxy;
	},

	getStore: function(name) {
		return this[name + 'Store'];
	},

	setStore: function(name, store) {
		this[name + 'Store'] = store;
	},

	createTestData: function() {
		var waypoints = [],
			waypoint,
			tourWaypoint;

		for (var i = 1; i <= 20; i++) {
			waypoint = {
				name: 'WP' + i,
				geometry: {
					type: 'Point',
					coordinates: [
						13.71 + 0.06 * Math.random(),
						51.03 + 0.04 * Math.random(),
					]
				}
			};
			waypoints.push(waypoint);
		}
		waypoints = this.waypointStore.add(waypoints);

		var root = this.layerStore.getRoot();
		var tour1 = root.appendChild({
			"name": "Tour 1",
			"leaf": false,
			"loaded": true
		});
		var tour2 = root.appendChild({
			"name": "Tour 2",
			"leaf": false,
			"loaded": true
		});
		var area1 = tour1.appendChild({
			"name": "Area 1",
			"leaf": true,
		});
		var area2 = tour1.appendChild({
			"name": "Area 2",
			"leaf": true,
		});
		
		tourWaypoint = waypoints[0].tourWaypoints().add({ name: 'TWP1' })[0];
		tour1.tourWaypoints().add(tourWaypoint);

		tourWaypoint = waypoints[1].tourWaypoints().add({ name: 'TWP2' })[0];
		tour1.tourWaypoints().add(tourWaypoint);

		tourWaypoint = waypoints[2].tourWaypoints().add({ name: 'TWP3' })[0];
		tour1.tourWaypoints().add(tourWaypoint);
		area1.tourWaypoints().add(tourWaypoint);

		tourWaypoint = waypoints[2].tourWaypoints().add({ name: 'TWP4' })[0];
		tour2.tourWaypoints().add(tourWaypoint);

		tourWaypoint = waypoints[3].tourWaypoints().add({ name: 'TWP5' })[0];
		tour2.tourWaypoints().add(tourWaypoint);
	},

	createTestData_: function() {
		var waypoints = [],
			waypoint,
			tourWaypoint;

		for (var i = 1; i <= 5; i++) {
			waypoint = {
				name: 'WP' + i,
				geometry: {
					type: 'Point',
					coordinates: [
						13.71 + 0.06 * Math.random(),
						51.03 + 0.04 * Math.random(),
					]
				}
			};
			waypoints.push(waypoint);
		}
		waypoints = this.waypointStore.add(waypoints);

		var root = this.layerStore.getRoot();
		var tour1 = root.appendChild({
			"name": "Tour 1",
			"leaf": false,
			"loaded": true
		});
		var tour2 = root.appendChild({
			"name": "Tour 2",
			"leaf": false,
			"loaded": true
		});
		var area1 = tour1.appendChild({
			"name": "Area 1",
			"leaf": true,
		});
		var area2 = tour1.appendChild({
			"name": "Area 2",
			"leaf": true,
		});
		
		tourWaypoint = this.session.createRecord('TourWaypoint', {name: 'TWP1'});
		waypoints[0].tourWaypoints().add(tourWaypoint);
		tour1.tourWaypoints().add(tourWaypoint);

		tourWaypoint = this.session.createRecord('TourWaypoint', {name: 'TWP2'});
		waypoints[1].tourWaypoints().add(tourWaypoint);
		tour1.tourWaypoints().add(tourWaypoint);
		area1.tourWaypoints().add(tourWaypoint);

		tourWaypoint = this.session.createRecord('TourWaypoint', {name: 'TWP3'});
		waypoints[2].tourWaypoints().add(tourWaypoint);
		tour2.tourWaypoints().add(tourWaypoint);
	},


});
