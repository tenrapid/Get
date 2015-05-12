Ext.define('Get.view.layers.Layers', {
	extend: 'Ext.tree.Panel',
	xtype: 'get-layers',

	requires: [
		'Get.view.layers.LayersController',
		'Get.view.layers.LayersModel',
		'Ext.tree.*',
	],

	controller: 'layers',
	viewModel: 'layers',

	title: 'Ebenen',
	border: false,
	// reserveScrollbar: true,
	useArrows: true,
	hideHeaders: true,
	viewConfig: {
		overItemCls: null,
		markDirty: false,
		loadMask: false,
		plugins: {
			ptype: 'treeviewdragdrop',
			containerScroll: true,
			nodeHighlightOnDrop: false,
			ddGroup: 'ddLayersWaypoints',
			dropZone: {
				onNodeOver: function(node, dragZone, e, data) {
					var record = data.records[0],
						returnCls = Object.getPrototypeOf(this).onNodeOver.apply(this, arguments);

					if (record.entityName === 'Waypoint' || record.entityName === 'TourWaypoint') {
						if (this.valid) {
							Ext.fly(node).addCls('valid-waypoint-drop-target');
							returnCls = Ext.baseCSSPrefix + 'tree-drop-ok-append';
							this.getIndicator().hide();
							this.currentCls = returnCls;
						}
					}
					return returnCls;
				},
				onNodeOut: function(node, dragZone, e, data) {
					Ext.fly(node).removeCls('valid-waypoint-drop-target');
					Object.getPrototypeOf(this).onNodeOut.apply(this, arguments);
				}
			}
		},
		listeners: {
			nodedragover: 'onNodeDragOver'
		},
	},
	rootVisible: true,
	root: {
		expanded: false,
		expandable: false,
		name: 'Alle Wegpunkte',
	},
	bind: {
		store: '{project.layers}',
		disabled: '{uiDisabled}',
	},
	listeners: {
		selectionchange: 'onLayerSelectionChange',
		beforeedit: 'onBeforeLayerItemEdit'
	},
	plugins: [
		{
			ptype: 'cellediting',
			clicksToEdit: 2,
		},
	],
	columns: [
		{
			xtype: 'treecolumn',
			text: 'Name',
			dataIndex: 'name',
			sortable: false,
			flex: 1,
			editor: {
				xtype: 'textfield',
				allowBlank: false
			}
		},
		{
			text: '',
			align: 'right',
			renderer: function(value, metadata, record) {
				metadata.style = 'font-size: 11px; color: #bbb;';
				var store = record.isRoot() ? Ext.getStore('waypoints') : record.tourWaypoints();
				return store && store.count() || '';
			},
			sortable: false,
			width: 30
		}
	],
	tbar: [
		{
			html: '<b>+</b>',
			handler: 'onAddLayer',
			bind: {
				disabled: '{addLayerButtonDisabled}',
			}
		},
		{
			html: '<b>–</b>',
			handler: 'onRemoveLayer',
			bind: {
				disabled: '{removeLayerButtonDisabled}',
			}
		},
		'->',
		{
			text: 'TestData',
			handler: function() {
				var project = this.lookupViewModel(true).get('project');
				project.undoManager.beginUndoGroup();
				project.createTestData();
				project.undoManager.endUndoGroup();
			}
		}
	],

});
