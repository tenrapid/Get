Ext.define('Get.view.waypoints.WaypointsController', {
    extend: 'Ext.app.ViewController',

    requires: [
    	'Ext.data.TreeStore',
    	'Ext.data.Session',
    	'Ext.tree.Panel',
    	'Get.view.waypoints.edit.Waypoint',
    ],

    alias: 'controller.waypoints',
    id: 'waypoints', 

	config: {
		listen: {
			controller: {
				'*': {
					projectLoad: 'onProjectLoad',
					projectUnload: 'onProjectUnload',
				},
			},
		},
	},

	isLayerSelectionForced: false,
	layerTree: null,
	waypointGrid: null,
	selectedLayerItem: null,

	init: function() {
		this.layerTree = this.lookupReference('layerTree');
		this.waypointGrid = this.lookupReference('waypointGrid');
	},

	onProjectLoad: function() {
		this.waypointGrid.getView().scrollRowIntoView(0);
		this.isLayerSelectionForced = true;
		this.layerTree.getSelectionModel().select(this.layerTree.getRootNode());
	},
	
	onProjectUnload: function() {
		var waypointGridSelectionModel = this.waypointGrid.getSelectionModel(),
			layerTreeSelectionModel = this.layerTree.getSelectionModel();
		waypointGridSelectionModel.deselectAll();
		waypointGridSelectionModel.unbindLayer();
		this.isLayerSelectionForced = false;
		layerTreeSelectionModel.deselectAll();
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
			this.fireEvent('layerItemSelect', item, waypointStore);
	 		this.waypointGrid.setStore(waypointStore);
		}
		else {
			if (this.isLayerSelectionForced) {
				selectionModel.select(this.selectedLayerItem || 0, false /*keepExisting*/, true /*suppressEvent*/);
				item = this.selectedLayerItem;
			}
		}
		viewModel.getParent().set('selectedLayerItem', item);
	},

    onRemoveLayer: function () {
    	var layerItem = this.selectedLayerItem,
    		layerItems = [];
    	this.layerTree.getSelectionModel().select(layerItem.parentNode);

    	function walk(node) {
    		layerItems.push(node);
    		node.eachChild(walk);
    	}
    	walk(layerItem);
    	layerItem.erase();
    	Ext.each(layerItems, function(item) {
			this.fireEvent('layerItemRemove', item, item.tourWaypoints());
    	}, this);
    },
		
	onBeforeLayerItemEdit: function(editor, context) {
		if (context.record.isRoot()) {
			return false;
		}
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
	
	onWaypointGridReconfigure: function(grid, store) {
		if (store) {
			var storeId = store.getStoreId(),
				waypointColumn = grid.columns[2];
			waypointColumn.setHidden(storeId === 'waypoints');
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
