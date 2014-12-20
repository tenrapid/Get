Ext.define('Get.Application', {
    extend: 'Ext.app.Application',
    
    name: 'Get',

	models: [ 
		'Tour', 'Area', 'Waypoint', 'TourWaypoint', 'Feature'
	],

    requires: [
    	'Get.data.FeatureStore',
    	'GeoExt.panel.Map',
    	'Ext.data.TreeStore',
    	'Ext.data.TreeModel',
    ],

	init: function() {
	},

    launch: function () {
//     	this.featureStoreTest();
//     	this.treeStoreTest();
    },
    
    treeStoreTest: function() {
    	var me = this,
    		store;

		store = Ext.create('Ext.data.TreeStore', {
			model: new Ext.Class({
				extend: 'Ext.data.TreeModel',
				childType: 'Get.model.Tour',
				proxy: {
					reader: {
						rootProperty: 'children'
					}
				}
			}),
			root: {
				expanded: true,
				expandable: false,
				text: 'All Waypoints',
				children: testData.tour,
			},
			rootVisible: false,
		}),
		
		this.storeToJson(store);
		root = store.getRoot();
	    
// 		Ext.define('myApp.TerritoryRoot', {
// 			extend: 'Ext.data.TreeModel',
// 			childType: 'myApp.Territory',
// 			fields: [{
// 				name: 'text',
// 				mapping: 'name'
// 			}],
// 		});
// 		Ext.define('myApp.Territory', {
// 			extend: 'Ext.data.TreeModel',
// 			childType: 'myApp.Country',
// 			fields: [{
// 				name: 'text',
// 				mapping: 'name'
// 			}],
// 		});
// 		Ext.define('myApp.Country', {
// 			extend: 'Ext.data.TreeModel',
// 			childType: 'myApp.City',
// 			fields: [{
// 				name: 'text',
// 				mapping: 'name'
// 			}],
// 		});
// 		Ext.define('myApp.City', {
// 			extend: 'Ext.data.TreeModel',
// 			fields: [{
// 				name: 'text',
// 				mapping: 'name'
// 			}],
// 		});
// 		console.log(Ext.create('Ext.tree.Panel', {
// 			renderTo: document.body,
// 			height: 200,
// 			width: 400,
// 			title: 'Sales Areas',
// 			rootVisible: false,
// 			store: {
// 				model: 'myApp.TerritoryRoot', // Needs to be this so it knows to create 'Country' child nodes
// 				root: {
// 					expanded: true,
// 					children: 
// 			
// 					[{
// 						name: 'Europe, ME, Africa',
// 						children: [{
// 							name: 'UK of GB & NI',
// 							children: [{
// 								name: 'London',
// 								leaf: true
// 							}]
// 						}]
// 					}, {
// 						name: 'North America',
// 						children: [{
// 							name: 'USA',
// 							children: [{
// 								name: 'Redwood City',
// 								leaf: true
// 							}]
// 						}]
// 					}]
// 				},
// 				proxy: {
// 					type: 'memory',
// 					reader: {
// 						type: 'json',
// 						rootProperty: 'children'
// 					}
// 				}
// 			}
// 		}));
		
		console.log('treeStore', store);    	
    },
    
    featureStoreTest: function() {
    	var me = this,
    		store = Ext.create('Get.data.FeatureStore', {
	    		model: 'Get.model.Feature'
	    	});
	    	
    	store.add({
    		geometry: {
    			type: 'Point',
    			coordinates: [13.73, 51.05]
    		}
    	});
    	console.log('Feature', store.first());
    	

		setTimeout(function() {
			store.add({
				geometry: {
					type: 'Point',
					coordinates: [13.76, 51.04]
				}
			});
			store.add({
				geometry: {
					type: 'Point',
					coordinates: [13.75, 51.06]
				}
			});
			me.storeToJson(store);
		}, 2000);
    }
});
