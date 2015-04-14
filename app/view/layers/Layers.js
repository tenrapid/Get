Ext.define('Get.view.layers.Layers', {
	extend: 'Ext.tree.Panel',
	xtype: 'get-layers',

	requires: [
		'Get.view.layers.LayersController',
		'Get.view.layers.LayersModel',
		'Get.model.Project',
		'Ext.tree.*',
	],

	controller: 'layers',
	viewModel: 'layers',

	title: 'Layers',
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
			dropZone: {
				isValidDropPoint: function(node, position, dragZone, e, data) {
					var view = this.view,
            			targetRecord = view.getRecord(node),
            			record = data.records[0];

            		if (position === 'append') {
            			return false;
            		}
            		if (record.entityName === 'Area') {
            			if (targetRecord.entityName !== 'Area') {
            				return false;
            			}
            			if (record.parentNode != targetRecord.parentNode) {
            				return false;
            			}
            		}
					return Object.getPrototypeOf(this).isValidDropPoint.apply(this, arguments);
				}
			}
		}
	},
	rootVisible: true,
	root: {
		expanded: false,
		expandable: false,
		name: 'All Waypoints',
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
