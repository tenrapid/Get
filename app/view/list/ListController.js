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
			}
		},
	},

	init: function() {
		var view = this.getView(),
			gridView = view.getView();

		view.on('show', this.onShow, this);
		gridView.on('beforedrop', this.onBeforeDrop, this);
		gridView.on('drop', this.onDrop, this);
	},

	onProjectLoad: function() {
		this.getView().getView().scrollRowIntoView(0);
	},
	
	onProjectUnload: function() {
		var selectionModel = this.getView().getSelectionModel();
		selectionModel.deselectAll();
	},

	onLayerItemSelect: function(item, waypointStore) {
		var view = this.getView();

		this.waypointStore = waypointStore;
		if (view.isVisible()) {
			Ext.suspendLayouts();
			view.setStore(waypointStore);
			Ext.resumeLayouts(true);
		}
	},

	onShow: function(view) {
		if (this.waypointStore && view.getStore() !== this.waypointStore) {
			Ext.suspendLayouts();
			view.setStore(this.waypointStore);
			Ext.resumeLayouts(true);
		}
	},

	onGridReconfigure: function(grid, store) {
		if (store) {
			var storeId = store.getStoreId();

			// grid.columns[1].setHidden(storeId !== 'waypoints');
			// grid.columns[2].setHidden(storeId === 'waypoints');
			grid.columns[4].setHidden(storeId !== 'waypoints');
		}
	},

	onBeforeDrop: function(node, data) {
		var view = this.getView(),
			project = this.getViewModel().get('project'),
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
			project = this.getViewModel().get('project'),
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
	
});
