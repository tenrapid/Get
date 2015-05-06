Ext.define('Get.view.list.ListController', {
	extend: 'Ext.app.ViewController',

	alias: 'controller.list',

	requires: [
		'Ext.data.Model'
	],

	id: 'list', 

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
			var storeId = store.getStoreId();

			grid.columns[1].setHidden(storeId !== 'waypoints');
			grid.columns[2].setHidden(storeId === 'waypoints');
			grid.columns[3].setHidden(storeId === 'waypoints');
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
				// TODO: only select waypoints that are visible in grid
				me.getView().getSelectionModel().select(waypoints);
			}
		});
		waypoints.forEach(function(waypoint) {
			waypoint.drop();
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
					// calling private method of Ext.view.Table
					view.onUpdate(gridStore, tourWaypoint);
				}
			});
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
