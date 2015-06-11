Ext.define('Get.data.PersistentIndexStore', {
	extend: 'Ext.Mixin',

	mixinConfig: {
		after: {
			constructor: 'addIndexSorter',
			loadRecords: 'removeIndexSorter',
			add: 'removeIndexSorter',
			onCollectionAdd: 'updateIndices',
			onCollectionRemove: 'updateIndices'
		}
	},

	config: {
		indexField: null
	},

	addIndexSorter: function() {
		if (this.indexField) {
			this.indexSorter = Ext.create('Ext.util.Sorter', {
				property: this.indexField,
				direction: 'ASC'
			});
			this.getSorters().add(this.indexSorter);
		}
	},

	removeIndexSorter: function() {
		if (this.indexSorter) {
			this.getSorters().remove(this.indexSorter);
			delete this.indexSorter;
		}
	},

	updateIndices: function() {
		var me = this,
			indexField = this.indexField,
			prop = {};

		if (indexField && !this.indexSorter) {
			this.each(function(record) {
				prop[indexField] = me.indexOf(record) + 1;
				record.set(prop);
			});
		}
	}

});
