Ext.define('Get.data.PersistentIndexStore', {
	extend: 'Ext.Mixin',

	mixinConfig: {
		id: 'persistentindex',
		after: {
			constructor: 'addIndexSorter',
			onCollectionAdd: 'updateIndices',
			onCollectionRemove: 'updateIndices'
		},
	},

	config: {
		/*
		 * The name of the model field that holds a record's index.
		 */
		indexProperty: null
	},

	onClassMixedIn: function(targetClass) {
		targetClass.override({
			/*
			 * If a record has an already set index, insert it at the correct position. This will keep the order
			 * of newly inserted records when saving a child session to its parent session.
			 */
			add: function(record) {
				var indexSet = false,
					index,
					defaultValue;

				if (this.indexProperty && arguments.length === 1 && record.isModel) {
					index = record.get(this.indexProperty);
					defaultValue = this.getModel().getField(this.indexProperty).getDefaultValue();
					indexSet = index !== defaultValue;
				}

				if (indexSet) {
					return this.insert(index - 1, record);
				}
				else {
					return this.callParent(arguments);
				}
			}
		});
	},

	addIndexSorter: function() {
		if (this.indexProperty) {
			this.indexSorter = Ext.create('Ext.util.Sorter', {
				property: this.indexProperty,
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
			indexProperty = this.indexProperty,
			prop = {};

		if (this.indexSorter) {
			this.removeIndexSorter();
		}

		// When coming from loadRecords "ignoreCollectionAdd" is set to true and we don't need to update indices.
		if (this.ignoreCollectionAdd) {
			return;
		}

		if (indexProperty) {
			this.each(function(record) {
				prop[indexProperty] = me.indexOf(record) + 1;
				record.set(prop);
			});
		}
	}

});
