Ext.define('Get.view.layers.LayersController', {
	extend: 'Ext.app.ViewController',
	alias: 'controller.layers',

	requires: [
		'Ext.data.TreeStore',
		'Ext.data.Session',
		'Ext.tree.Panel',
	],

	id: 'layers', 

	config: {
		listen: {
			controller: {
				'#main': {
					projectLoad: 'onProjectLoad',
					projectUnload: 'onProjectUnload',
				},
			},
			store: {
				'layer': {
					nodebeforeremove: 'onBeforeLayerStoreNodeRemove',
				},
				'waypoint': {
					add: 'onWaypointOperation',
					remove: 'onWaypointOperation',
					clear: 'onWaypointOperation'
				},
				'tourWaypoint': {
					add: 'onWaypointOperation',
					remove: 'onWaypointOperation',
					clear: 'onWaypointOperation'
				}
			},
		},
	},

	isLayerSelectionForced: false,
	selectedLayerItem: null,

	init: function() {
		var treeView = this.getView().getView();
		treeView.on('beforedrop', this.onBeforeDrop, this);
		treeView.on('drop', this.onDrop, this);
	},

	onProjectLoad: function() {
		var view = this.getView();
		this.isLayerSelectionForced = true;
		view.getSelectionModel().select(view.getRootNode());
	},
	
	onProjectUnload: function() {
		this.isLayerSelectionForced = false;
		this.getView().getSelectionModel().deselectAll();
	},

	onLayerSelectionChange: function(selectionModel, items) {
		var viewModel = this.getViewModel(),
			waypointStore,
			item;
		
		if (items.length) {
			item = items[0];
			this.selectedLayerItem = item;
			if (item.get('id') == 'root') {
				waypointStore = Ext.getStore('waypoints');
			}
			else {
				waypointStore = item.tourWaypoints();
			}
			this.fireEvent('beforeLayerItemSelect', item, waypointStore);
			this.fireEvent('layerItemSelect', item, waypointStore);
		}
		else {
			if (this.isLayerSelectionForced) {
				selectionModel.select(this.selectedLayerItem || 0, false /*keepExisting*/, true /*suppressEvent*/);
				item = this.selectedLayerItem;
			}
		}
		viewModel.getParent().set('selectedLayerItem', item);
	},

	onAddLayer: function() {
		var me = this,
			layerItem = me.selectedLayerItem,
			project = me.getView().getViewModel().get('project');
		
		if (layerItem.isRoot()) {
			project.undoManager.beginUndoGroup();
			layerItem.appendChild({
				name: "Tour"
			}).set('loaded', true);
			project.undoManager.endUndoGroup();
		}
		else if (layerItem.entityName === 'Tour') {
			layerItem.expand();
			project.undoManager.beginUndoGroup();
			layerItem.appendChild({
				name: "Gebiet",
				leaf: true
			});
			project.undoManager.endUndoGroup();
		}
	},
		
	onRemoveLayer: function() {
		var me = this,
			layerItem = me.selectedLayerItem,
			project = me.getView().getViewModel().get('project');

		project.undoManager.beginUndoGroup();
		project.undoManager.registerUndoOperation({
			type: 'fn',
			undo: function() {
				me.getView().getSelectionModel().select(layerItem);
			}
		});
		if (layerItem.entityName === 'Area') {
			// drop tour waypoints that are only linked to this area and not to a tour
			// TODO: are tour waypoints always linked to a tour?
			layerItem.tourWaypoints().each(function(tourWaypoint) {
				if (!tourWaypoint.getTour()) {
					tourWaypoint.drop();
				}
			});
		}
		layerItem.drop();
		project.undoManager.endUndoGroup();
	},

	onBeforeLayerStoreNodeRemove: function(parentLayerItem, layerItem) {
		// select a sibling or the parent of the currently selected layer item if it is going to be removed
		if (layerItem === this.selectedLayerItem) {
			this.getView().getSelectionModel().select(layerItem.previousSibling || layerItem.nextSibling || layerItem.parentNode);
		}
	},
		
	onBeforeLayerDoubleClick: function(view, record) {
		if (record.isRoot()) {
			return false;
		}
	},

	onLayerDoubleClick: function(view, record) {
		var config = {layer: record},
			openEditWindows = Ext.WindowManager.getBy(function(comp) {
				return comp.isEditLayerWindow && comp.layer === config.layer;
			});

		if (openEditWindows.length) {
			openEditWindows[0].toFront();
		}
		else {
			Ext.widget('edit.layer', config);
		}
	},
	
	onBeforeLayerItemEdit: function(editor, context) {
		if (context.record.isRoot()) {
			return false;
		}
	},

	onWaypointOperation: function(store, records) {
		// update the number of waypoints counter on the right side of a layer item
		var view = this.getView().getView(),
			treeStore = view.getStore();

		if (store.model.entityName === 'Waypoint') {
			view.onUpdate(treeStore, treeStore.getRoot());
		}
		else if (store.associatedEntity) {
			view.onUpdate(treeStore, store.associatedEntity);
		}
	},

	onNodeDragOver: function(targetNode, position, data, e) {
		var view = this.view.getView(),
			targetRecord = view.getRecord(targetNode),
			record = data.records[0];

		if (record.entityName === 'Tour' || record.entityName === 'Area') {
			if (position === 'append') {
				return false;
			}
			if (record.entityName === 'Area') {
				if (targetRecord.entityName !== 'Area') {
					return false;
				}
				if (record.parentNode !== targetRecord.parentNode) {
					return false;
				}
			}
		}
		else if (record.entityName === 'Waypoint') {
			if (targetRecord.entityName === 'LayerTreeRoot' || targetRecord.entityName === 'Area') {
				return false;
			}
		}
		else if (record.entityName === 'TourWaypoint') {
			if (targetRecord.entityName === 'LayerTreeRoot' || targetRecord.entityName === 'Tour') {
				return false;
			}
			if (record.getTour() !== targetRecord.parentNode) {
				return false;
			}
		}
	},

	onBeforeDrop: function(targetNode, data) {
		var view = this.getView(),
			project = view.getViewModel().get('project'),
			selectionModel = view.getSelectionModel(),
			record = data.records[0];

		if (record.entityName === 'Tour' || record.entityName === 'Area') {
			project.undoManager.beginUndoGroup();
			project.undoManager.registerUndoOperation({
				type: 'fn',
				undo: function() {
					selectionModel.select(record);
				}
			});
			project.undoManager.onStoreOperation('remove', null, data.records);
		}
		else if (record.entityName === 'Waypoint') {
			this.addWaypointsToTour(view.getView().getRecord(targetNode), data.records);
			return false;
		}
		else if (record.entityName === 'TourWaypoint') {
			this.addTourWaypointsToArea(view.getView().getRecord(targetNode), data.records);
			return false;
		}
	},

	onDrop: function(node, data) {
		var view = this.getView(),
			project = view.getViewModel().get('project'),
			selectionModel = view.getSelectionModel(),
			record = data.records[0];

		project.undoManager.registerUndoOperation({
			type: 'fn',
			redo: function() {
				selectionModel.select(record);
			}
		});
		project.undoManager.endUndoGroup();

		selectionModel.select(record);
	},

	addWaypointsToTour: function(tour, waypoints) {
		var view = this.getView(),
			project = view.getViewModel().get('project'),
			waypointsToAdd = waypoints.filter(function(waypoint) {
				return !waypoint.tourWaypoints().getRange().some(function(tourWaypoint) {
					return tourWaypoint.getTour() === tour;
				});
			}),
			tourWaypoints;

		if (waypointsToAdd.length) {
			project.undoManager.beginUndoGroup();
			tourWaypoints = waypointsToAdd.map(function(waypoint) {
				return waypoint.tourWaypoints().add({
					name: waypoint.get('name')
				})[0];
			});
			tour.tourWaypoints().add(tourWaypoints);
			project.undoManager.endUndoGroup();
		}
	},

	addTourWaypointsToArea: function(area, tourWaypoints) {
		var view = this.getView(),
			project = view.getViewModel().get('project'),
			tourWaypointsToAdd = tourWaypoints.filter(function(tourWaypoint) {
				return tourWaypoint.getArea() !== area;
			}),
			tourWaypointsToRemove = tourWaypointsToAdd.filter(function(tourWaypoint) {
				return tourWaypoint.getArea();
			});

		if (tourWaypointsToAdd.length) {
			project.undoManager.beginUndoGroup();
			tourWaypointsToRemove.forEach(function(tourWaypoint) {
				tourWaypoint.setArea(null);
			});
			area.tourWaypoints().add(tourWaypointsToAdd);
			project.undoManager.endUndoGroup();
		}
	}
		
});
