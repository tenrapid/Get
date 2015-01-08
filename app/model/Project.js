Ext.define('Get.model.Project', {
	extend: 'Get.model.Base',

	requires: [
		'Ext.data.Session',
		'Ext.data.TreeStore',
		'Ext.data.TreeModel',
		'Get.store.Waypoints',
		'Get.store.TourWaypoints',
		'Get.store.Tours',
	],

	fields: [
		{
			name: 'name',
			defaultValue: 'Unbenannt'
		},
		{
			name: 'filename',
			persist: false
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

	destroy: function() {
		this.tourStore.destroy();
		this.tourStore = null;
		this.waypointStore.destroy();
		this.waypointStore = null;
		this.tourWaypointStore.destroy();
		this.tourWaypointStore = null;
		this.session.destroy();
		this.session = null;
		this.callParent();
	},
	
	load: function(callback, scope) {
		var me = this,
			path = require('path'),
			filename = this.get('filename'),
			name = filename ? path.basename(filename, '.get') : 'Unbenannt',
			session = Ext.create('Ext.data.Session');

		this.setId(1);
		this.setSession(session);

		// Create stores.
		this.tourStore = Ext.create('Get.store.Tours', {
			session: session,
			listeners: {
				update: this.onStoreRecordUpdate,
				// TODO: datachanged
				// nodeappend: this.onStoreRecordUpdate,
				// nodeinsert: this.onStoreRecordUpdate,
				// noderemove: this.onStoreRecordUpdate,
				scope: this
			}
		});
		this.tourStore.getRoot().phantom = false;
		this.waypointStore = Ext.create('Get.store.Waypoints', {
			session: session,
			listeners: {
				update: this.onStoreRecordUpdate,
				// TODO: datachanged
				// datachanged: this.onStoreDataChanged,
				scope: this
			}
		});
		this.tourWaypointStore = Ext.create('Get.store.TourWaypoints', {
			session: session,
			listeners: {
				update: this.onStoreRecordUpdate,
				// TODO: datachanged
				// datachanged: this.onStoreDataChanged,
				scope: this
			}
		});

 		// Set "filename" config of sqlite proxy.
		this.getProxy().setFilename(filename);
		this.tourStore.getProxy().setFilename(filename);
		this.waypointStore.getProxy().setFilename(filename);
		this.tourWaypointStore.getProxy().setFilename(filename);


		// Load stores
		var onLoad = Ext.Function.createBarrier(filename ? 4 : 1, function() {
				// me.set('name', name);
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
			// onLoad();
		}
	},
	
	save: function() {
		var saveBatch = this.session.getSaveBatch();
		if (saveBatch) {
			saveBatch.start();
		}
	},
	
	adjustIdentifierSeed: function(store) {
		var maxId = store.max('id');
		store.getModel().identifier.setSeed(maxId + 1);
	},

	onStoreDataChanged: function() {
		this.set('isModified', !!this.session.getChanges());
		console.log('onStoreUpdate', this.get('isModified'), arguments);
	},

	onStoreRecordUpdate: function(store, record, operation, modifiedFieldNames, details) {
		if (operation === Ext.data.Model.COMMIT) {
			return;
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
		this.onStoreModification();
	},

	onStoreModification: function() {
		console.log('tourStore', this.tourStore.needsSync);
		console.log('waypointStore', this.waypointStore.needsSync);
		console.log('tourWaypointStore', this.tourWaypointStore.needsSync);
		var isModified = !!this.session.getChanges();
		this.set('isModified', isModified);
		console.log('onModification', isModified);
	},
	
	set: function(fieldName) {
		this.callParent(arguments);
		if (fieldName != 'isModified') {
			this.set('isModified', this.dirty);
		}
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

