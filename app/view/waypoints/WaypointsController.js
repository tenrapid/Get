Ext.define('Get.view.waypoints.WaypointsController', {
	extend: 'Ext.app.ViewController',

	alias: 'controller.waypoints',

	requires: [
		'Get.view.waypoints.edit.EditWaypoint',
		'Get.store.WaypointTourWaypoint',
		'Ext.data.Model'
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
				},
				'waypointTourWaypoint': {
					datachanged: 'onWaypointTourWaypointsDataChanged'
				}
			}
		},
	},

	init: function() {
		var gridView = this.getView().getView();
		gridView.on('beforedrop', this.onBeforeDrop, this);
		gridView.on('drop', this.onDrop, this);
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

	onGridReconfigure: function(grid, store) {
		if (store) {
			var storeId = store.getStoreId();

			// waypoint.name
			grid.columns[1].setHidden(storeId !== 'waypoints');
			// tourWaypoint.name
			grid.columns[2].setHidden(storeId === 'waypoints');
			// tourWaypoint.waypoint.name
			grid.columns[3].setHidden(storeId === 'waypoints');
			// waypoint/tourWaypoint used
			grid.columns[4].setHidden(storeId !== 'waypoints' && store.associatedEntity.entityName === 'Area');

			this.lookupReference('addWaypointButton').setDisabled(storeId !== 'waypoints');
		}
	},

	onWaypointDoubleClick: function(view, record) {
		var config = record.entityName === 'Waypoint' ?
				{waypoint: record} :
				{waypoint: record.getWaypoint(), tourWaypoint: record},
			openEditWindows = Ext.WindowManager.getBy(function(comp) {
				return comp.isEditWaypointWindow && comp.waypoint === config.waypoint && comp.tourWaypoint === config.tourWaypoint;
			});

		if (openEditWindows.length) {
			openEditWindows[0].toFront();
		}
		else {
			Ext.widget('edit.waypoint', config);
		}
	},
	
	onAddWaypoint: function() {
		Ext.widget('edit.waypoint');
	},

	onRemoveWaypoint: function() {
		var me = this,
			view = this.getView(),
			waypoints = view.getSelection(),
			store = view.getStore(),
			project = view.getViewModel().get('project');

		Ext.suspendLayouts();
		project.undoManager.beginUndoGroup();
		project.undoManager.registerUndoOperation({
			type: 'fn',
			undo: function() {
				// TODO: only select waypoints that are visible in grid
				view.getSelectionModel().select(waypoints);
			}
		});
		waypoints.forEach(function(waypoint) {
			if (store.associatedEntity && store.associatedEntity.entityName === 'Area') {
				waypoint.setArea(null);
			}
			else {
				waypoint.drop();
			}
		});
		project.undoManager.endUndoGroup();
		Ext.resumeLayouts(true);
	},

	onZoomToWaypoints: function() {
		Ext.GlobalEvents.fireEvent('zoomToWaypoints', this.getView().getSelection());
	},

	onWaypointUpdate: function(store, waypoint, operation, modifiedFieldNames) {
		var view = this.getView().getView(),
			gridStore = view.getStore();

		// update the waypoint cell of a tourwaypoint if the waypoint was updated
		if (gridStore.getModel().entityName === 'TourWaypoint' && operation === Ext.data.Model.EDIT && modifiedFieldNames) {
			waypoint.tourWaypoints().each(function(tourWaypoint) {
				if (gridStore.contains(tourWaypoint)) {
					view.refreshNode(tourWaypoint);
				}
			});
		}
	},

	onWaypointTourWaypointsDataChanged: function(store) {
		var view = this.getView().getView(),
			gridStore = view.getStore(),
			waypoint = store.associatedEntity;

		// update the 'waypoint used' cell of a waypoint if tour waypoints were added/removed
		if (gridStore.getModel().entityName === 'Waypoint') {
			view.refreshNode(waypoint);
		}
	},

	onBeforeDrop: function(node, data) {
		var view = this.getView(),
			project = view.getViewModel().get('project'),
			selectionModel = view.getSelectionModel();

		project.undoManager.beginUndoGroup();
		// TODO: maintain selection of waypoints after drag and drop
		// project.undoManager.registerUndoOperation({
		// 	type: 'fn',
		// 	undo: function() {
		// 		selectionModel.select(data.records);
		// 	}
		// });
		// selectionModel.deselectAll();
	},
	
	onDrop: function(node, data) {
		var view = this.getView(),
			project = view.getViewModel().get('project'),
			selectionModel = view.getSelectionModel();

		// project.undoManager.registerUndoOperation({
		// 	type: 'fn',
		// 	redo: function() {
		// 		selectionModel.select(data.records);
		// 	}
		// });
		project.undoManager.endUndoGroup();

		// selectionModel.select(data.records);
	}

});
