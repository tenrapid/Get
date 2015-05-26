Ext.define('Get.view.layers.edit.EditLayerController', {
	extend: 'Ext.app.ViewController',

	alias: 'controller.edit.layer',

	requires: [
	],

	config: {
		listen:{
			store: {
				tour: {
					update: 'onRecordUpdate',
					remove: 'onRecordRemove',
					clear: 'onRecordRemove'
				},
				area: {
					update: 'onRecordUpdate',
					remove: 'onRecordRemove',
					clear: 'onRecordRemove'
				}
			}
		}
	},

	init: function(view) {
		var viewModel = this.getViewModel(),
			session = this.getSession(),
			layer = session.getRecord(view.layer.entityName, view.layer.getId());

		viewModel.set('layer', layer);
	},

	onSave: function() {
		var viewModel = this.getViewModel(),
			project = viewModel.get('project');

		this.eventbus.unlisten(this);
		project.undoManager.beginUndoGroup();
		this.getSession().save();
		project.undoManager.endUndoGroup();
		this.closeView();
	},

	onRecordRemove: function (store, records) {
		var me = this;
		records.some(function(record) {
			if (me.isEditingRecord(record)) {
				me.closeView();
				return true;
			}
		});
	},

	onRecordUpdate: function(store, record, operation, modifiedFieldNames) {
		var editingRecord;

		if (operation === Ext.data.Model.EDIT && modifiedFieldNames && this.isEditingRecord(record)) {
			editingRecord = this.getViewModel().get('layer');
			modifiedFieldNames.forEach(function(fieldName) {
				editingRecord.set(fieldName, record.get(fieldName));
				if (editingRecord.modified) {
					delete editingRecord.modified[fieldName];
				}
			});
		}
	},

	isEditingRecord: function(record) {
		if (record.getId() === this.getViewModel().get('layer').getId()) {
			return true;
		}
		return false;
	}
	
});
