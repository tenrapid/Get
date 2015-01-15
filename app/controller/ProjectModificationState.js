Ext.define('Get.controller.ProjectModificationState', {
	extend: 'Ext.app.Controller',

	id: 'projectmodificationstate',

	config: {
		project: null,
		listen: {
			store: {
				tourWaypoints: {
					update: 'onRecordUpdate',
					add: 'onRecordOperation',
					remove: 'onRecordOperation'
				},
			}
		}
	},

	areaStore: null,
	dirtyRecordsMap: null,

	constructor: function() {
		this.callParent(arguments);

		var project = this.getProject(),
			session = project.session;

		this.areaStore = Ext.create('Ext.data.Store', {
			model: 'Get.model.Area',
			session: session,
			listeners: {
				update: this.onRecordUpdate,
				// add: this.onRecordOperation,
				// remove: this.onRecordOperation,
				scope: this
			}
		});
		// TODO: Are area records removed from this store if they are removed from tourStore?

		project.tourStore.on({
			update: this.onRecordUpdate,
			nodeappend: this.onNodeOperation,
			nodeinsert: this.onNodeOperation,
			noderemove: this.onNodeOperation,
			scope: this
		});
		project.waypointStore.on({
			update: this.onRecordUpdate,
			add: this.onRecordOperation,
			remove: this.onRecordOperation,
			scope: this
		});

		this.dirtyRecordsMap = {};
	},

	destroy: function() {
		this.areaStore.destroy();
		this.setProject(null);
		this.callParent();
	},

	onAssociationStoreAdd: function(store, records) {
		console.log('onAssociationStoreAdd', records);
	},

	onNodeOperation: function(store, record) {
		// console.log('onNodeOperation', record);
		if (record.entityName === 'Area' && !this.areaStore.contains(record)) {
			// A TreeStore only adds visible nodes to its connected session. Therefore nodes are added manually
			// to this controller's store to ensure that all of them are tracked for modifications.
			this.areaStore.add(record);
		}
		this.onModification(record);
	},

	onRecordOperation: function(store, records) {
		var me = this;
		// console.log('onRecordOperation', records);
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
