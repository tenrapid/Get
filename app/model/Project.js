Ext.define('Get.model.Project', {
	extend: 'Get.model.Base',

	requires: [
		'Ext.data.Session',
		'Ext.data.TreeStore',
		'Ext.data.TreeModel',
		'Get.store.Waypoints',
		'Get.store.TourWaypoints',
		'Get.store.Tours',
		'Get.store.Areas',
		'Get.store.Layers',
		'Get.controller.ProjectModificationState'
	],

	fields: [
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
					project[name + 'Store'].getProxy().setFilename(filename);
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

	stores: [
		'tour', 'area', 'waypoint', 'tourWaypoint' 
	],

	layerStore: null,

	constructor: function(data) {
		// window.p = this;
		var me = this,
			session = Ext.create('Ext.data.Session'),
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
			me[name + 'Store'] = Ext.create('Get.store.' + Ext.String.capitalize(name) + 's', storeConfig);
		});
		this.layerStore = Ext.create('Get.store.Layers', storeConfig);
		this.layerStore.getRoot().phantom = false;

		data = Ext.apply(data, {id: 1});
		this.callParent([data, session]);
	},

	destroy: function() {
		var me = this;
		this.layerStore.destroy();
		this.layerStore = null;
		this.stores.forEach(function(name) {
			me[name + 'Store'].destroy();
			me[name + 'Store'] = null;
		});
		this.session.destroy();
		this.session = null;
		this.getProxy().destroy();
		this.projectModificationController.destroy();
		this.callParent();
	},
	
	load: function(callback, scope) {
		var me = this,
			filename = this.get('filename'),
			onLoad = Ext.Function.createBarrier(filename ? this.stores.length + 1 : 1, function() {
				me.updateName();

				me.buildLayerTree();
				me.adjustIdentifierSeeds();

				me.projectModificationController = Ext.create('Get.controller.ProjectModificationState', {
					project: me
				});

				me.set('layers', me.layerStore);
				me.set('waypoints', me.waypointStore);

				Ext.callback(callback, scope, [me]);
			});

		if (filename) {
			this.callParent([{
				callback: onLoad
			}]);
			this.stores.forEach(function(name) {
				me[name + 'Store'].load(onLoad);
			});
		}
		else {
			var root = this.layerStore.getRoot();
			root.set('loaded', true);
			root.expand(false, onLoad);
		}
	},
	
	save: function(callback, scope) {
		var me = this,
			saveBatch = this.session.getSaveBatch();
		if (saveBatch) {
			saveBatch.on('complete', function() {
				console.log('saveBatch complete');
				if (!saveBatch.hasException()) {
					me.updateName();
				}
				me.projectModificationController.afterSave();
				Ext.callback(callback, scope, [me, saveBatch.getExceptions()]);
			});
			// Ext.data.session.BatchVisitor configures the operations with the model's default proxy.
			// We need the proxies of this project's stores.
			saveBatch.operations.forEach(function(operation) {
				var entityName = operation.getProxy().getModel().entityName;

				if (entityName === 'Project') {
					operation.setProxy(me.getProxy());
				}
				else {
					operation.setProxy(me[Ext.String.uncapitalize(entityName) + 'Store'].getProxy());
				}
			});
			saveBatch.start();
		}
		else {
			// no changes but filename may be changed due to save as
			me.updateName();
			Ext.callback(callback, scope, [me, null]);
		}
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

		areaStore.each(function(record) {
			tourStore.getById(record.get('parentId')).appendChild(record);
		});
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
			stores = Ext.Array.clone(this.stores);

		// areaStore is sharing an identifier with tourStore
		Ext.Array.remove(stores, 'area');

		stores.forEach(function(name) {
			var store = me[name + 'Store'],
				model = store.getModel(),
				maxId;

			if (model.entityName === 'Tour') {
				maxId = Math.max(store.max('id'), me.areaStore.max('id'));
			}
			else {
				maxId = store.max('id');
			}
			model.identifier.setSeed((maxId || 0) + 1);
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

	createTestData: function() {
		var waypoints = [],
			waypoint;
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
		this.waypointStore.add(waypoints);

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
		
		tour1.tourWaypoints().add({
			name: 'TWP1',
			waypointId: this.waypointStore.getAt(0).getId(),
		});
		tour1.tourWaypoints().add({
			name: 'TWP2',
			waypointId: this.waypointStore.getAt(1).getId(),
		});
		tour1.tourWaypoints().add({
			name: 'TWP3',
			waypointId: this.waypointStore.getAt(2).getId(),
		});
		tour2.tourWaypoints().add({
			name: 'TWP4',
			waypointId: this.waypointStore.getAt(2).getId(),
		});
		tour2.tourWaypoints().add({
			name: 'TWP5',
			waypointId: this.waypointStore.getAt(3).getId(),
		});
		// tour1.tourWaypoints().getAt(2).setArea(area1);
		area1.tourWaypoints().add(tour1.tourWaypoints().getAt(2));
	},

});

