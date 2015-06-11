Ext.define('Ext.patch.data.schema.ManyToOne', {
	override: 'Ext.data.schema.ManyToOne',
	compatibility: '5.1.0.107',
}, function() {
	this.prototype.Left.override({
		/*
			Changes:
			- Left.onDrop checks for ownership before dropping associated records only if an association store 
			  is created. While getting associated records from the session ownership is not checked. This check is added.
		*/
		onDrop: function(rightRecord, session) {
			var me = this,
				store = me.getAssociatedItem(rightRecord),
				leftRecords, len, i, refs, id;

			if (store) {
				// Removing will cause the foreign key to be set to null.
				leftRecords = store.removeAll();
				if (leftRecords && me.inverse.owner) {
					// If we're a child, we need to destroy all the "tickets"
					for (i = 0, len = leftRecords.length; i < len; ++i) {
						leftRecords[i].drop();
					}
				}

				store.destroy();
				rightRecord[me.getStoreName()] = null;
			} else if (session) {
				leftRecords = session.getRefs(rightRecord, me);
				// changed //////////////////////////////////
				// the effect from "leftRecords = store.removeAll()" in the other if-branch is still missing
				if (leftRecords && me.inverse.owner) {
				/////////////////////////////////////////////
					for (id in leftRecords) {
						leftRecords[id].drop();
					}
				}
			}
		},

		/*
			Overwrite the method Role.getAssociatedItem():
			- Almost always create the association store if it is requested. We don't need lazy loading and it is more important
			  that setting foreign keys result in items being added/removed to/from the association store. 
			  Don't create it if:
			  - The record is managed by a child session.
			  - The project's session is marked as loading while loading all records from the database into the project's stores.
			  	This way all records that belong to an association store get added at once which is important for stores where
			  	the record order is persisted.
		*/
		getAssociatedItem: function(rec) {
			var storeName = this.getStoreName();
			if (!rec[storeName] && rec.session && !rec.session.getParent() && !rec.session.loading) {
				rec[this.getterName]();
			}
			return rec[storeName] || null;
		},

		/*
			Changes:
			- Only call findRecords() if the association does not exist yet. If it exists already the found records
			  would be ignored anyway in getAssociatedStore().
		*/
		createGetter: function() {
			var me = this;
			return function (options, scope, leftRecords) {
				// 'this' refers to the Model instance inside this function
				var session = this.session,
					hadRecords = !!leftRecords;

				// changed //////////////////////////////////
				// if (session) {
				if (session && !this[me.getStoreName()]) {
				/////////////////////////////////////////////
					leftRecords = me.findRecords(session, this, leftRecords);
					if (!hadRecords && (!leftRecords || !leftRecords.length)) {
						leftRecords = null;
					}
				}
				return me.getAssociatedStore(this, options, scope, leftRecords, hadRecords);
			};
		}
	});
});
