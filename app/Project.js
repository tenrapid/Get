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
	data: null,
	
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
		delete this.data;
		this.data = null;
	},
	
	load: function(callback, scope) {
		var me = this;
		
		this.data = this.getTestData();

		this.tourStore.setRoot({
			expanded: true,
			expandable: false,
			name: 'All Waypoints',
			children: this.data.tour
		});
// 		this.tourStore.setRoot({
// 			expanded: true,
// 			expandable: false,
// 			name: 'All Waypoints',
// 		});
// 		this.tourStore.getProxy().setData(this.data.tour);
// 		this.tourStore.load();
		this.adjustIdentifierSeed(this.tourStore);
		
		this.waypointStore.getProxy().setData(this.data);
		this.waypointStore.load();
		this.adjustIdentifierSeed(this.waypointStore);
		
		this.tourWaypointStore.getProxy().setData(this.data);
		this.tourWaypointStore.load();
		this.adjustIdentifierSeed(this.tourWaypointStore);

		setTimeout(function() {
			callback.call(scope, me);
		}, 1000);
	},
	
	save: function() {
		var json = {};
		Ext.apply(json, this.storeToJson(this.waypointStore));
		Ext.apply(json, this.storeToJson(this.tourWaypointStore));
		Ext.apply(json, this.storeToJson(this.tourStore));
		var jsonString = JSON.stringify(json, undefined, '\t');
		return jsonString;
	},
	
    adjustIdentifierSeed: function(store) {
		var maxId = 0;
    	if (store instanceof Ext.data.TreeStore) {
			var	root = store.getRoot();
			function walk(node) {
				var id = node.getId();
				if (id > maxId) {
					maxId = id;
				}
				// damit Touren ohne Gebiete bereits ohne Aufklapppfeil angezeigt werden
				if (!node.isExpanded()) {
					node.expand();
					node.collapse();
				}
				node.eachChild(walk);
			}
			root.eachChild(walk);
    	}
    	else {
    		maxId = store.max('id');
		}
		store.getModel().identifier.setSeed(maxId + 1);
// 		console.log('maxId', store.id, maxId);
    },
    
    storeToJson: function(store) {
    	var records,
    		jsonData;
    	if (store.isTreeStore) {
			records = [];
			var root = store.getRoot();
			function walk(node) {
				records.push(node);
				node.eachChild(walk);
			}
			root.eachChild(walk);
    	}
    	else {
    		records = store.getRange();
    	}
		var request = Ext.create('Ext.data.Request',{
			operation: Ext.create('Ext.data.operation.Operation', {
				records: records
			})
		});
		store.getProxy().getWriter().write(request);
		// commit all records?
		jsonData = request.getJsonData();
		
		if (store.isTreeStore && jsonData) {
			var nodes = jsonData.tour,
				node,
				nodeMap = {},
				tour = [],
				len = nodes.length,
				parentNode;

			for (var i = 0; i < len; i++) {
				node = nodes[i];
				nodeMap[node.id] = node;
			}

			for (var i = 0; i < len; i++) {
				node = nodes[i];
				if (node.parentId == 'root') {
					tour.push(node);
				}
				else {
					parentNode = nodeMap[node.parentId];
					if (!parentNode.area) {
						parentNode.area = [];
					}
					parentNode.area.push(node);
				}
				delete node.parentId;
			}
			jsonData.tour = tour;
		}
		return jsonData;
    },

    getTestData: function() {
		return {
			waypoint: (function() {
				var waypoints = [],
					waypoint;
				for (var i = 1; i <= 20; i++) {
					waypoint = {
						id: i,
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
				return waypoints;
			})(),
			tourWaypoint: [
				{
					id: 1,
					name: 'TWP1',
					tourId: 1,
					waypointId: 1
				},
				{
					id: 2,
					name: 'TWP2',
					tourId: 1,
					waypointId: 2
				},
				{
					id: 5,
					name: 'TWP5',
					tourId: 1,
					areaId: 3,
					waypointId: 5
				},
				{
					id: 3,
					name: 'TWP3',
					tourId: 2,
					waypointId: 2
				},
				{
					id: 4,
					name: 'TWP4',
					tourId: 2,
					waypointId: 3
				},
			],
// 			"tour": [
// 				{
// 					"id": 1,
// 					"name": "Tour 1",
// 					"parentId": "root",
// 					"leaf": false
// 				},
// 				{
// 					"id": 3,
// 					"name": "Area 1",
// 					"parentId": 1,
// 					"leaf": true
// 				},
// 				{
// 					"id": 4,
// 					"name": "Area 2",
// 					"parentId": 1,
// 					"leaf": true
// 				},
// 				{
// 					"id": 2,
// 					"name": "T2",
// 					"parentId": "root",
// 					"leaf": false
// 				}
// 			]
			tour: [
				{
					"id": 1,
					"name": "Tour 1",
					"leaf": false,
					"area": [
						{
							"id": 3,
							"name": "Area 1",
							"leaf": true
						},
						{
							"id": 4,
							"name": "Area 2",
							"leaf": true
						}
					]
				},
				{
					"id": 2,
					"name": "T2",
					"leaf": false
				}
			]
		};
	},
});

