Ext.define('Get.project.controller.StoreEventNormalizationController', {
	extend: 'Ext.app.Controller',

	id: 'projectstoreeventnormalization',

	config: {
		project: null,
		listen: {
			store: {
				tourWaypoint: {
					add: 'onAssociationStoreAdd',
					remove: 'onAssociationStoreRemove',
					clear: 'onAssociationStoreClear',
				}
			}
		}
	},

	constructor: function() {
		this.callParent(arguments);

		var me = this,
			project = this.getProject();
		
		project.layerStore.on({
			nodeappend: this.onNodeStoreAdd,
			nodeinsert: this.onNodeStoreAdd,
			noderemove: this.onNodeStoreRemove,
			scope: this
		});

		[project.waypointStore, project.tourStore, project.areaStore].forEach(function(store) {
			store.on({
				add: me.onStoreAdd,
				remove: me.onStoreRemove,
				clear: me.onStoreClear,
				scope: me
			});
		});

		project.session.on({
			update: this.onUpdate,
			add: this.onCreate,
			remove: this.onDrop,
			scope: this
		});
	},

	destroy: function() {
		this.setProject(null);
		this.callParent();
	},

	onCreate: function(record) {
		this.fireEvent('create', record);
	},

	onDrop: function(record) {
		this.fireEvent('drop', record);
	},

	onUpdate: function(record, operation, modifiedFieldNames) {
		if (operation === Ext.data.Model.EDIT) {
			if (!modifiedFieldNames) {
				return;
			}
			else if (record.entityName === 'Tour' || record.entityName === 'Area') {
				if (modifiedFieldNames.length === 1) {
					var field = modifiedFieldNames[0];
					if (field == 'loading' || field == 'loaded' || field == 'expanded') {
						return;
					}
				}
			} 
			else if (record.entityName === 'TourWaypoint') {
				if (modifiedFieldNames.length === 1 && modifiedFieldNames[0] === 'geometry')  {
					return;
				}
			}
			else if (record.entityName === 'Project') {
				return;
			}
		}
		this.fireEvent('update', record, operation, modifiedFieldNames);
	},

	onAssociationStoreAdd: function(store, records, index) {
		if (store.associatedEntity) {
			// console.log('onAssociationStoreAdd', arguments);
			this.fireEvent('add', store, records, index);
		}
	},

	onAssociationStoreRemove: function(store, records, index) {
		if (store.associatedEntity) {
			// console.log('onAssociationStoreRemove', arguments);
			this.fireEvent('remove', store, records, index);
		}
	},

	onAssociationStoreClear: function(store, records) {
		if (store.associatedEntity) {
			// console.log('onAssociationStoreClear', arguments);
			this.fireEvent('remove', store, records, 0);
		}
	},

	onStoreAdd: function(store, records, index) {
		// console.log('onStoreAdd', arguments);
		this.fireEvent('add', store, records, index);
	},

	onStoreRemove: function(store, records, index) {
		// console.log('onStoreRemove', arguments);
		this.fireEvent('remove', store, records, index);
	},

	onStoreClear: function(store, records) {
		// console.log('onStoreClear', arguments);
		this.fireEvent('remove', store, records, 0);
	},

	onNodeStoreAdd: function(store, record) {
		// console.log('onNodeAdd', record);
		var project = this.getProject(),
			storeName = Ext.String.uncapitalize(record.entityName);
		project.getStore(storeName).add(record);
	},

	onNodeStoreRemove: function(store, record) {
		// console.log('onNodeRemove', record);
		var project = this.getProject(),
			storeName = Ext.String.uncapitalize(record.entityName);
		project.getStore(storeName).remove(record);
	},

});
