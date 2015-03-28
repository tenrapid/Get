Ext.define('Get.view.waypoints.WaypointsController', {
	extend: 'Ext.app.ViewController',
	alias: 'controller.waypoints',

	requires: [
		'Get.view.waypoints.edit.Waypoint',
	],

	id: 'waypoints', 

	config: {
		listen: {
			controller: {
				'#layers': {
					layerItemSelect: 'onLayerItemSelect',
				},
				'#main': {
					projectLoad: 'onProjectLoad',
					projectUnload: 'onProjectUnload',
				},
			},
			store: {
				'waypoint': {
					update: 'onWaypointUpdate'
				}
			}
		},
	},

	onProjectLoad: function() {
		this.getView().getView().scrollRowIntoView(0);
	},
	
	onProjectUnload: function() {
		var selectionModel = this.getView().getSelectionModel();
		selectionModel.deselectAll();
		selectionModel.unbindLayer();
	},

	onLayerItemSelect: function(item, waypointStore) {
		this.getView().setStore(waypointStore);
	},

	onWaypointDoubleClick: function(view, record) {
		Ext.widget('edit.waypoint', {
			viewModel: {
				data: {
					waypoint: record,
				},
			},
		});
	},
	
	onGridReconfigure: function(grid, store) {
		if (store) {
			var storeId = store.getStoreId(),
				waypointColumn = grid.columns[2];
			waypointColumn.setHidden(storeId === 'waypoints');
		}
	},

	onRemoveWaypoint: function() {
		var me = this,
			waypoints = this.getView().getSelection(),
			project = this.getView().getViewModel().get('project');

		Ext.suspendLayouts();
		project.undoManager.beginUndoGroup();
		project.undoManager.registerUndoOperation({
			type: 'fn',
			undo: function() {
				me.getView().getSelectionModel().select(waypoints);
			}
		});
		waypoints.forEach(function(waypoint) {
			waypoint.drop();
		});
		project.undoManager.endUndoGroup();
		Ext.resumeLayouts(true);
	},

	onWaypointUpdate: function(store, waypoint, operation, modifiedFieldNames) {
		var view = this.getView().getView(),
			gridStore = view.getStore();

		// update the waypoint cell of a tourwaypoint if the waypoint was updated
		if (gridStore.getModel().entityName === 'TourWaypoint' && operation === Ext.data.Model.EDIT && modifiedFieldNames) {
			waypoint.tourWaypoints().each(function(tourWaypoint) {
				if (gridStore.contains(tourWaypoint)) {
					// calling private method of Ext.view.Table
					view.onUpdate(gridStore, tourWaypoint);
				}
			});
		}
	},
	
	onClickButton: function () {
		Ext.Msg.confirm('Confirm', 'Are you sure?', 'onConfirm', this);
	},

	onConfirm: function (choice) {
		if (choice === 'yes') {
			//
		}
	},
	
});
