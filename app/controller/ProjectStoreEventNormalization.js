Ext.define('Get.controller.ProjectStoreEventNormalization', {
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

		this.relayEvents(project.session, ['update']);
	},

	destroy: function() {
		this.setProject(null);
		this.callParent();
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
