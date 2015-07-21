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

		view.on('beforereconfigure', this.onGridBeforeReconfigure, this);
		view.on('show', this.onShow, this);
		gridView.on('beforedrop', this.onBeforeDrop, this);
		gridView.on('drop', this.onDrop, this);
	},

	onProjectLoad: function() {
		this.getView().getView().scrollRowIntoView(0);
	},
	
	onProjectUnload: function() {
		var view = this.getView(),
			selectionModel = view.getSelectionModel();

		selectionModel.deselectAll();
		view.setStore(Ext.StoreManager.get('ext-empty-store'));
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

	onGridBeforeReconfigure: function(grid, store, columns) {
		if (store) {
			var storeId = store.getStoreId();

			grid.down('#waypoint-name').setVisible(storeId === 'waypoints');
			grid.down('#waypoint-description').setVisible(storeId === 'waypoints');
			grid.down('#waypoint-pictures').setVisible(storeId === 'waypoints');
			grid.down('#tourwaypoint-name').setVisible(storeId !== 'waypoints');
			grid.down('#tourwaypoint-form').setVisible(storeId !== 'waypoints');
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
