Ext.define('Get.controller.ProjectStoreConsolidation', {
	extend: 'Ext.app.Controller',

	id: 'projectstoreconsolidation',

	config: {
		project: null,
	},

	constructor: function() {
		this.callParent(arguments);

		var me = this,
			project = this.getProject();
		
		this.listen({
			store: {
				tourWaypoint: {
					add: 'onAssociationStoreAdd',
					remove: 'onAssociationStoreRemove',
					// update: function() { console.log('update', arguments); }
				}
			}
		});

		project.layerStore.on({
			nodeappend: this.onNodeStoreAdd,
			nodeinsert: this.onNodeStoreAdd,
			noderemove: this.onNodeStoreRemove,
			scope: this
		});
	},

	destroy: function() {
		this.setProject(null);
		this.callParent();
	},

	onAssociationStoreAdd: function(store, records) {
		if (store.associatedEntity) {
			var project = this.getProject(),
				storeName = Ext.String.uncapitalize(records[0].entityName),
				consolidationStore = project.getStore(storeName);
			records.forEach(function(record) {
				if (!consolidationStore.contains(record)) {
					consolidationStore.add(record);
				}
			});
		}
	},

	onAssociationStoreRemove: function(store, records) {
		if (store.associatedEntity) {
			console.log('onAssociationStoreRemove', arguments);
			var project = this.getProject(),
				storeName = Ext.String.uncapitalize(records[0].entityName);
			project.getStore(storeName).remove(records);
		}
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
