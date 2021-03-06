Ext.define('Get.project.controller.ModificationStateController', {
	extend: 'Ext.app.Controller',

	id: 'projectmodificationstate',

	config: {
		project: null,
		listen: {
			controller: {
				'#projectstoreeventnormalization': {
					add: 'onStoreOperation',
					remove: 'onStoreOperation',
					create: 'onRecordOperation',
					drop: 'onRecordOperation',
					update: 'onRecordUpdate'
				}
			}
		}
	},

	dirtyRecordsMap: null,

	constructor: function() {
		this.callParent(arguments);
		this.dirtyRecordsMap = {};
	},

	destroy: function() {
		this.setProject(null);
		this.callParent();
	},

	onStoreOperation: function(store, records) {
		var me = this;
		records.forEach(function(record) {
			me.onModification(record);
		});
		// console.log('onStoreOperation', records);
	},

	onRecordOperation: function(record) {
		this.onModification(record);
		// console.log('onRecordOperation', arguments);
	},

	onRecordUpdate: function(record, operation, modifiedFieldNames) {
		if (operation === Ext.data.Model.COMMIT) {
			// console.log('commit', arguments);
		}
		this.onModification(record);
		// console.log('onRecordUpdate', arguments);
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
