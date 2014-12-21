Ext.define('Get.Project', {
	requires: [
		'Ext.data.Session',
		'Ext.data.TreeStore',
		'Ext.data.TreeModel',
		'Get.store.Waypoints',
		'Get.store.TourWaypoints',
		'Get.store.Tours',
	],

	name: null,
	
	session: null,
	
	tourStore: null,
	waypointStore: null,
	tourWaypointStore: null,
	
	constructor: function(config) {
		if (!config.name) {
			Ext.error.raise('No name for project given.');
		}
		this.name = config.name;
		
		this.session = Ext.create('Ext.data.Session');
		
		this.tourStore = Ext.create('Get.store.Tours', {
			session: this.session,
		});
		this.tourStore.getRoot().phantom = false;
		this.waypointStore = Ext.create('Get.store.Waypoints', {
			session: this.session,
		});
		this.tourWaypointStore = Ext.create('Get.store.TourWaypoints', {
			session: this.session,
		});
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
	},
	
	load: function(callback, scope) {
		var me = this,
			onLoad = Ext.Function.createBarrier(3, function() {
				me.adjustIdentifierSeed(me.waypointStore);
				me.adjustIdentifierSeed(me.tourWaypointStore);
				Ext.callback(callback, scope, [me]);
			});
		

// 		this.createTestData(); this.tourStore.getRoot().expand(); setTimeout(function() {onLoad(); onLoad(); onLoad();}, 1000);

		this.tourStore.getRoot().expand(false, onLoad);
		this.waypointStore.load(onLoad);
		this.tourWaypointStore.load(onLoad);
	},
	
	save: function() {
		var saveBatch = this.session.getSaveBatch();
		saveBatch && saveBatch.start();
	},
	
    adjustIdentifierSeed: function(store) {
   		var maxId = store.max('id');
		store.getModel().identifier.setSeed(maxId + 1);
// 		console.log('maxId', store.id, maxId);
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

