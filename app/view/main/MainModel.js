Ext.define('Get.view.main.MainModel', {
	extend: 'Ext.app.ViewModel',
	alias: 'viewmodel.main',
	requires: [
		'Get.store.Waypoints',
		'Get.store.TourWaypoints',
		'Get.store.Tours',
		'Ext.data.TreeModel',
		'Ext.data.TreeStore',
		'Ext.data.Store'
	],
	
	data: {
		name: 'Get',
		project: null,
		isProjectLoading: false,
	}, 
	
	formulas: {
		projectName: function (get) {
			var project = get('project');
			return project && project.name || '';
		},
		tours: function (get) {
			var project = get('project');
			return project && project.tourStore;
		},
		waypoints: function (get) {
			var project = get('project');
			return project && project.waypointStore;
		},
		tourWaypoints: function (get) {
			var project = get('project');
			return project && project.tourWaypointStore;
		},
		uiDisabled: function (get) {
			return get('project') ? false : true;
		}
	},
	
	stores: {
// 		tours: {
// 			xclass: 'Ext.data.TreeStore',
// 			model: new Ext.Class({
// 				extend: 'Ext.data.TreeModel',
// 				childType: 'Get.model.Tour',
// 				proxy: {
// 					reader: {
// 						rootProperty: 'children'
// 					}
// 				}
// 			}),
// //     		session: '{session}',
// 			root: {
// 				expanded: true,
// 				expandable: false,
// 				name: 'All Waypoints',
// 			},
// 			rootVisible: true,
// 		},
//     	waypoints: {
// //     		model: 'Waypoint',
//     		type: 'waypoints',
// //     		session: '{session}',
//     		listeners: {
//     			load: 'adjustIdentifierSeed'
//     		}
//     	},
//     	tourWaypoints: {
// //     		model: 'TourWaypoint',
//     		type: 'tourWaypoints',
// //     		session: '{session}',
//     		listeners: {
//     			load: 'adjustIdentifierSeed'
//     		}
//     	},
	},    

});