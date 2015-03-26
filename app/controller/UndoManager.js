Ext.define('Get.controller.UndoManager', {
	extend: 'Ext.app.Controller',

	id: 'undomanager',

	config: {
		project: null,
		listen: {
			controller: {
				'#menubar': {
					undoMenuItem: 'undo',
					redoMenuItem: 'redo'
				},
				'#projectstoreeventnormalization': {
					add: {
						fn: 'onRecordOperation',
						args: ['add']
					},
					remove: {
						fn: 'onRecordOperation',
						args: ['remove']
					},
					update: 'onRecordUpdate'
				}
			},
		}
	},

	undoStack: null,
	redoStack: null,
	groupStack: null,
	currentGroup: null,

	constructor: function() {
		this.callParent(arguments);

		/* 
			TODO: Undo-Szenarien
			create testdata -> select Tour 1 -> delete WP1 -> undo   ok
			create testdata -> delete WP1 -> select Tour 1 -> undo   ok
			load -> delete WP1 -> select Tour 1 -> undo   ok
			load -> select Area 1 -> delete -> undo   ok
			create testdata/load -> delete Tour 1 -> undo -> expand Tour 1 -> delete Area 1 -> Area 2 disappears ???

			TODO: enable/disable undo/redo menu items 
			TODO: use system undo/redo if textfield is focused
		*/

		this.undoStack = [];
		this.redoStack = [];
		this.groupStack = [];
		this.currentGroup = this.undoStack;

		// Debugging
		window.u = this;
	},

	destroy: function() {
		this.setProject(null);
		this.callParent();
	},

	onRecordOperation: function(type, store, records, index) {
		var me = this,
			len = records.length,
			operation;

		if (this.listenersSuspended) {
			return;
		}

		// console.log('onRecordOperation', arguments);
		records.forEach(function(record, i) {
			operation = {
				type: type,
				record: record,
				store: store,
				dirty: record.dirty,
				addIndex: index + i,
				removeIndex: index
			};
			if (record.isNode) {
				Ext.merge(operation, {
					parentNode: record.parentNode,
					previousSibling: record.previousSibling,
					nextSibling: record.nextSibling
				});
			}
			me.registerUndoOperation(operation);
		});
	},

	onRecordUpdate: function(record, operation, modifiedFieldNames) {
		var previousValues,
			newValues;

		if (this.listenersSuspended) {
			return;
		}

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

			previousValues = {};
			newValues = {};
			modifiedFieldNames.forEach(function(field) {
				previousValues[field] = record.previousValues[field];
				newValues[field] = record.data[field];
			});

			this.registerUndoOperation({
				type: 'edit',
				record: record,
				modifiedFieldNames: modifiedFieldNames,
				previousValues: previousValues,
				newValues: newValues
			});
		}
		// console.log('onRecordUpdate', store, operation, modifiedFieldNames, details);
		// console.log('onRecordUpdate', arguments);
	},

	beginUndoGroup: function() {
		this.groupStack.push(this.currentGroup);
		this.currentGroup = [];
		if (this.redoStack.length) {
			this.redoStack = [];
		}
	},
	
	endUndoGroup: function() {
		var operation;
		if (this.groupStack.length === 0) {
			Ext.Error.raise('No undo group to end');
		}
		operation = {
			type: 'group',
			group: this.currentGroup
		};
		this.currentGroup = this.groupStack.pop();
		this.registerUndoOperation(operation);
	},

	registerUndoOperation: function(operation) {
		this.currentGroup.push(operation);
		if (this.groupStack.length === 0 && this.redoStack.length) {
			this.redoStack = [];
		}
	},

	undo: function() {
		var operation = this.undoStack.pop();
		if (!operation) {
			return;
		}

		this.listenersSuspended = true;
		this.undoOperation(operation);
		this.listenersSuspended = false;
		
		this.redoStack.push(operation);
	},

	redo: function() {
		var operation = this.redoStack.pop();
		if (!operation) {
			return;
		}

		this.listenersSuspended = true;
		this.redoOperation(operation);
		this.listenersSuspended = false;

		this.undoStack.push(operation);
	},

	undoOperation: function(operation) {
		var me = this,
			record = operation.record,
			project = this.getProject(),
			store,
			i;

		switch (operation.type) {
			case 'group':
				for (i = operation.group.length; --i >= 0;) {
					me.undoOperation(operation.group[i]);
				}
				break;
			case 'edit':
				record.set(operation.previousValues);
				break;
			case 'add':
				record.drop();
				break;
			case 'remove':
				this.undoRecordDrop(operation);
				break;
		}
	},

	redoOperation: function(operation) {
		var me = this,
			record = operation.record,
			project = this.getProject(),
			store,
			i,
			len;

		switch (operation.type) {
			case 'group':
				for (i = 0, len = operation.group.length; i < len; i++) {
					me.redoOperation(operation.group[i]);
				}
				break;
			case 'edit':
				operation.record.set(operation.newValues);
				break;
			case 'add': 
				this.undoRecordDrop(operation);
				break;
			case 'remove':
				record.drop();
				break;
		}
	},

	undoRecordDrop: function(operation) {
		var record = operation.record,
			store = operation.store;

		if (record.dropped) {
			record.dropped = false;
			if (record.erased) {
				record.erased = false;
				// clear the session attribute of a phantom record, so that the record can be adopted again
				// in store.add(record)
				record.session = null;
			}
			else {
				// evict the record from the session and clear it's session attribute, so that an 'add' event
				// is fired when the record is adopted again by the session in store.add(record)
				record.session.evict(record);
				record.session = null;
			}
			record.dirty = operation.dirty;
		}
	
		if (record.isNode && operation.parentNode) {
			// Why (record.isNode && operation.parentNode):
			// The parent node is dropped first, then the child nodes are dropped. While undoing child nodes
			// are recreated first and they don't have a reference to their parent. Theirfore they have 
			// to be added to the corresponding project's store and cannot be appended to their parent.

			// set the 'parentNode' attribute of all child nodes because it was cleared during the drop
			// of this node
			record.childNodes.forEach(function(childNode) {
				childNode.parentNode = record;
			});
			// undo the modification of 'lastParentId' because it leads to a dirty record during the
			// call of appendChild/insertBefore in updateInfo()
			record.set('lastParentId', record.modified.lastParentId, {silent: true});

			if (operation.nextSibling) {
				operation.parentNode.insertBefore(record, operation.nextSibling);
			}
			else {
				operation.parentNode.appendChild(record);
			}
		}
		else {
			if (store.associatedEntity && !store.session) {
				// association store is already destroyed, need to get the current one
				store = operation.store = store.associatedEntity[store.role.getterName]();
			}
			store.insert(operation.type == 'add' ? operation.addIndex : operation.removeIndex, record);
		}

		// Ext.iterate(record.associations, function(roleName, role) {
		// 	if (role.isMany) {
		// 		// Create the association stores with this call because they were deleted during drop and 
		// 		// only setting the foreign key of an associated record does not create them.
		// 		role.getAssociatedStore(record);
		// 	}
		// });
	}

});
