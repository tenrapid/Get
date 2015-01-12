Ext.define('Get.model.Project', {
	extend: 'Get.model.Base',

	requires: [
		'Ext.data.Session',
		'Ext.data.TreeStore',
		'Ext.data.TreeModel',
		'Get.store.Waypoints',
		'Get.store.TourWaypoints',
		'Get.store.Tours'
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
				project.tourStore.getProxy().setFilename(filename);
				project.waypointStore.getProxy().setFilename(filename);
				project.tourWaypointStore.getProxy().setFilename(filename);
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
			name: 'tours',
			persist: false
		},
		{
			name: 'isModified',
			persist: false
		}
	],

	tourStore: null,
	waypointStore: null,
	tourWaypointStore: null,

	dirtyRecordsMap: null,

	constructor: function(data) {
		var session = Ext.create('Ext.data.Session'),
			proxyConfig = {
				type: 'sqlite',
				debug: false,
				writer: {
					type: 'json',
					allowSingle: false,
				}
			};

		data = Ext.apply(data, {id: 1});

		this.dirtyRecordsMap = new Map();

		// Don't use this model's default proxy instance.
		this.proxy = Ext.Factory.proxy(proxyConfig);
		this.proxy.setModel(this.self);

		// Create stores.
		this.tourStore = Ext.create('Get.store.Tours', {
			session: session,
			proxy: proxyConfig
		});
		this.tourStore.getRoot().phantom = false;
		this.waypointStore = Ext.create('Get.store.Waypoints', {
			session: session,
			proxy: proxyConfig
		});
		this.tourWaypointStore = Ext.create('Get.store.TourWaypoints', {
			session: session,
			proxy: proxyConfig
		});

		this.callParent([data, session]);
	},

	destroy: function() {
		this.tourStore.destroy();
		this.tourStore = null;
		this.waypointStore.destroy();
		this.waypointStore = null;
		this.tourWaypointStore.destroy();
		this.tourWaypointStore = null;
		this.session.destroy();
		this.session = null;
		this.getProxy().destroy();
		this.callParent();
	},
	
	load: function(callback, scope) {
		var me = this,
			filename = this.get('filename'),
			onLoad = Ext.Function.createBarrier(filename ? 4 : 1, function() {
				me.updateName();
				me.tourStore.on({
					update: me.onStoreRecordUpdate,
					nodeappend: me.onStoreNodeOperation,
					nodeinsert: me.onStoreNodeOperation,
					noderemove: me.onStoreNodeOperation,
					scope: me
				});
				me.waypointStore.on({
					update: me.onStoreRecordUpdate,
					add: me.onStoreRecordOperation,
					remove: me.onStoreRecordOperation,
					scope: me
				});
				me.tourWaypointStore.on({
					update: me.onStoreRecordUpdate,
					add: me.onStoreRecordOperation,
					remove: me.onStoreRecordOperation,
					scope: me
				});
				me.set('tours', me.tourStore);
				me.set('waypoints', me.waypointStore);
				me.adjustIdentifierSeed(me.waypointStore);
				me.adjustIdentifierSeed(me.tourWaypointStore);
				Ext.callback(callback, scope, [me]);
			});

// 		this.createTestData(); this.tourStore.getRoot().expand(); setTimeout(function() {onLoad(); onLoad(); onLoad();}, 1000);

		if (filename) {
			this.callParent([{
				callback: onLoad
			}]);
			this.tourStore.getRoot().expand(false, onLoad);
			this.waypointStore.load(onLoad);
			this.tourWaypointStore.load(onLoad);
		}
		else {
			var root = this.tourStore.getRoot();
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
				Ext.callback(callback, scope, [me, saveBatch.getExceptions()]);
			});
			// Ext.data.session.BatchVisitor configures the operations with the model's default proxy.
			// We need the proxies of this project's stores.
			saveBatch.operations.forEach(function(operation) {
				var model = operation.getProxy().getModel(),
					entityName = model.schema.getEntityName(model);
				switch (entityName) {
					case 'Area':
						operation.setProxy(me.tourStore.getProxy());
						break;
					default:
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
		// TODO: set isModified = false and clear dirtyRecordsMap after successful save
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

	adjustIdentifierSeed: function(store) {
		var maxId = store.max('id');
		store.getModel().identifier.setSeed(maxId + 1);
	},

	onStoreNodeOperation: function(store, record) {
		// console.log('onStoreNodeOperation', record);
		this.onStoreModification(record);
	},

	onStoreRecordOperation: function(store, records) {
		var me = this;
		// console.log('onStoreRecordOperation', records);
		records.forEach(function(record) {
			me.onStoreModification(record);
		});
	},

	onStoreRecordUpdate: function(store, record, operation, modifiedFieldNames, details) {
		if (operation === Ext.data.Model.COMMIT) {
			// TODO: ignore commit operations
			// return;
		}
		if (store == this.tourStore) {
			if (operation === Ext.data.Model.EDIT && modifiedFieldNames && modifiedFieldNames.length === 1) {
				var field = modifiedFieldNames[0];
				if (field == 'loading' || field == 'loaded' || field == 'expanded') {
					return;
				}
			}
		} 
		else if (store == this.tourWaypointStore) {
			if (modifiedFieldNames.length === 1 && modifiedFieldNames[0] == 'geometry')  {
				return;
			}
		}
		// console.log('onStoreRecordUpdate', store, operation, modifiedFieldNames, details);
		// console.log('onStoreRecordUpdate', arguments);
		this.onStoreModification(record);
	},

	onStoreModification: function(record) {
		var dirty = record.phantom && !record.dropped || !record.phantom && (record.dirty || record.dropped),
			id = record.getId(),
			entity = record.entityName,
			map = this.dirtyRecordsMap,
			entityMap = map.get(entity) || (map.set(entity, new Map()) && map.get(entity)),
			isModified = false;

		if (dirty) {
			entityMap.set(id, record);
		}
		else {
			if (entityMap.has(id)) {
				entityMap.delete(id);
			}
		}

		for (entityMap of map.values()) {
			if (entityMap.size) {
				isModified = true;
				break;
			}
		}

		this.set('isModified', isModified);
		// console.log('onModification', isModified);
	},
	
	set: function(fieldName) {
		this.callParent(arguments);
		if (fieldName != 'isModified') {
			this.set('isModified', this.dirty);
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

		var root = this.tourStore.getRoot();
		var tour1 = root.appendChild({
			"name": "Tour 1",
			"leaf": false,
		});
		var tour2 = root.appendChild({
			"name": "Tour 2",
			"leaf": false,
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
		tour1.tourWaypoints().getAt(2).setArea(area1);
	},

});

