Ext.define('Get.controller.ProjectModificationState', {
	extend: 'Ext.app.Controller',

	id: 'projectmodificationstate',

	config: {
		project: null,
	},

	dirtyRecordsMap: null,

	constructor: function() {
		this.callParent(arguments);

		var me = this,
			project = this.getProject();

		project.stores.forEach(function(name) {
			project.getStore(name).on({
				update: me.onRecordUpdate,
				add: me.onRecordOperation,
				remove: me.onRecordOperation,
				scope: me
			});
		});

		this.dirtyRecordsMap = {};
	},

	destroy: function() {
		this.setProject(null);
		this.callParent();
	},

	onRecordOperation: function(store, records) {
		// console.log('onRecordOperation', records);
		var me = this;
		records.forEach(function(record) {
			me.onModification(record);
		});
	},

	onRecordUpdate: function(store, record, operation, modifiedFieldNames, details) {
		if (operation === Ext.data.Model.COMMIT) {
			// console.log('commit', arguments);
		}
		if (operation === Ext.data.Model.EDIT) {
			if (record.entityName === 'Tour' || record.entityName === 'Area') {
				if (modifiedFieldNames && modifiedFieldNames.length === 1) {
					var field = modifiedFieldNames[0];
					if (field == 'loading' || field == 'loaded' || field == 'expanded') {
						return;
					}
				}
			} 
			else if (record.entityName === 'TourWaypoint') {
				if (modifiedFieldNames && modifiedFieldNames.length === 1 && modifiedFieldNames[0] === 'geometry')  {
					return;
				}
			}
		}
		// console.log('onRecordUpdate', store, operation, modifiedFieldNames, details);
		// console.log('onRecordUpdate', arguments);
		this.onModification(record);
	},

	onModification: function(record) {
		var dirty = record.phantom && !record.dropped || !record.phantom && (record.dirty || record.dropped),
			id = record.getId(),
			entity = record.entityName,
			map = this.dirtyRecordsMap,
			recordMap = map[entity] || (map[entity] = {});

		if (dirty) {
			recordMap[id] = record;
		}
		else {
			if (id in recordMap) {
				delete recordMap[id];
			}
		}
		this.update();
	},

	afterSave: function() {
		var map = this.dirtyRecordsMap,
			recordMap,
			record;

		Object.keys(map).forEach(function(entity) {
			recordMap = map[entity];
			Object.keys(recordMap).forEach(function(id) {
				record = recordMap[id];
				if (record.erased) {
					delete recordMap[id];
				}
			});
		});
		this.update();
	},

	update: function() {
		var map = this.dirtyRecordsMap,
			project = this.getProject(),
			isModified = false;

		isModified = Object.keys(map).some(function(entity) {
			return Object.keys(map[entity]).length > 0;
		});

		// Some store listeners are called during Model.set execution while associations are handled.
		// In this case the "_singleProp" property, that is global over all model instances, still holds values 
		// from this execution when project.set('isModified', ...) is executed
		// and pollutes the project instance. By giving an object as the argument for the set method
		// _singleProp is not used.
		project.set({ isModified: isModified });
		// project.set('isModified', isModified);
	}

});
