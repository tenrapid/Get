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
		},
	},

	isLayerSelectionForced: false,
	selectedLayerItem: null,

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

	onRemoveLayer: function () {
		var me = this,
			layerItem = me.selectedLayerItem;
		me.getView().getSelectionModel().select(layerItem.parentNode);

		layerItem.cascadeBy(function(item) {
			me.fireEvent('layerItemRemove', item, item.tourWaypoints());
		});
		layerItem.drop();
	},
		
	onBeforeLayerItemEdit: function(editor, context) {
		if (context.record.isRoot()) {
			return false;
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
