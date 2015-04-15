Ext.define('Get.project.controller.WaypointIndexUpdate', {
	extend: 'Ext.app.Controller',

	id: 'projectwaypointindexupdate',

	config: {
		project: null,
		listen: {
			store: {
				tourWaypoint: {
					add: 'onAssociationStoreOperation',
					remove: 'onAssociationStoreOperation',
				}
			}
		}
	},

	constructor: function() {
		this.callParent(arguments);

		var me = this,
			project = this.getProject();
		
		project.waypointStore.on({
			add: me.onStoreOperation,
			remove: me.onStoreOperation,
			scope: me
		});

	},

	destroy: function() {
		this.setProject(null);
		this.callParent();
	},


	onStoreOperation: function(store, records) {
		this.updateIndices(store);
	},

	onAssociationStoreOperation: function(store, records, index) {
		if (store.associatedEntity) {
			this.updateIndices(store);
		}
	},

	updateIndices: function(store) {
		var prop = {},
			indexField = store.associatedEntity ? store.getIndexField() : 'index';

		store.each(function(record) {
			prop[indexField] = store.indexOf(record);
			record.set(prop);
		});
	}

});
