Ext.define('Ext.patch.data.schema.ManyToOne', {
	override: 'Ext.data.schema.ManyToOne',
	compatibility: '5.1.0.107',
}, function() {
	this.prototype.Left.override({
		/*
			Modifications:
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
				//////  MODIFIED:  ///////////////////////////////////////////////
				// the effect from "leftRecords = store.removeAll()" in the other if-branch is still missing
				if (leftRecords && me.inverse.owner) {
				//////////////////////////////////////////////////////////////////
					for (id in leftRecords) {
						leftRecords[id].drop();
					}
				}
			}
		},

		/*
			Modifications:
			- Always look for left records in the session regardless of the phantom state of the right record.
		 */
		findRecords: function(session, rightRecord, leftRecords) {
			var ret = leftRecords,
				refs = session.getRefs(rightRecord, this, true),
				leftRecord, id, i, len, seen;
			//////  MODIFIED:  ///////////////////////////////////////////////
			// if (!rightRecord.phantom) {
			//////////////////////////////////////////////////////////////////
			ret = [];
			if (refs) {
				if (leftRecords) {
					seen = {};
					
					
					for (i = 0 , len = leftRecords.length; i < len; ++i) {
						leftRecord = leftRecords[i];
						id = leftRecord.id;
						if (refs[id]) {
							ret.push(leftRecord);
						}
						seen[id] = true;
					}
				}
				
				for (id in refs) {
					if (!seen || !seen[id]) {
						ret.push(refs[id]);
					}
				}
			}
			//////  MODIFIED:  ///////////////////////////////////////////////
			// }
			//////////////////////////////////////////////////////////////////
			return ret;
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
			Modifications:
			- Only call findRecords() if the association does not exist yet. If it exists already the found records
			  would be ignored anyway in getAssociatedStore().
		*/
		createGetter: function() {
			var me = this;
			return function (options, scope, leftRecords) {
				// 'this' refers to the Model instance inside this function
				var session = this.session,
					hadRecords = !!leftRecords;

				//////  MODIFIED:  ///////////////////////////////////////////////
				// if (session) {
				if (session && !this[me.getStoreName()]) {
				//////////////////////////////////////////////////////////////////
					leftRecords = me.findRecords(session, this, leftRecords);
					if (!hadRecords && (!leftRecords || !leftRecords.length)) {
						leftRecords = null;
					}
				}
				return me.getAssociatedStore(this, options, scope, leftRecords, hadRecords);
			};
		}
	});

	this.prototype.Right.override({

		/*
			Modifications:
			- Only add the left record to the association store if the store does not contain the record yet.
			  This prevents firing of events that will "iritate" the UndoManager.
		 */
		onValueChange: function(leftRecord, session, newValue, oldValue) {
			// If we have a session, we may be able to find the new store this belongs to
			// If not, the best we can do is to remove the record from the associated store/s.
			var me = this,
				instanceName = me.getInstanceName(),
				cls = me.cls,
				hasNewValue,
				joined, store, i, len, associated, rightRecord;

			if (!leftRecord.changingKey) {
				hasNewValue = newValue || newValue === 0;
				if (!hasNewValue) {
					leftRecord[instanceName] = null;
				}
				if (session) {
					// Find the store that holds this record and remove it if possible.
					store = me.getSessionStore(session, oldValue);
					if (store) {
						store.remove(leftRecord);
					}
					// If we have a new value, try and find it and push it into the new store.
					if (hasNewValue) {
						store = me.getSessionStore(session, newValue);
						//////  MODIFIED:  ///////////////////////////////////////////////
						// if (store && !store.isLoading()) {
						if (store && !store.isLoading() && !store.contains(leftRecord)) {
						//////////////////////////////////////////////////////////////////
							store.add(leftRecord);
						}
						if (cls) {
							rightRecord = session.peekRecord(cls, newValue);
						}
						// Setting to undefined is important so that we can load the record later.
						leftRecord[instanceName] = rightRecord || undefined;
					}
				} else {
					joined = leftRecord.joined;
					if (joined) {
						for (i = 0, len = joined.length; i < len; ++i) {
							store = joined[i];
							if (store.isStore) {
								associated = store.getAssociatedEntity();
								if (associated && associated.self === me.cls && associated.getId() === oldValue) {
									store.remove(leftRecord);
								}
							}
						}
					}
				}
			}

			if (me.owner && newValue === null) {
				me.association.schema.queueKeyCheck(leftRecord, me);
			}
		}
	});
});
