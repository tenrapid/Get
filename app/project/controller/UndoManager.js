Ext.define('Get.project.controller.UndoManager', {
	extend: 'Ext.app.Controller',

	id: 'undomanager',

	config: {
		project: null,
		listen: {
			global: {
				undoMenuItem: 'undo',
				redoMenuItem: 'redo'
			},
			controller: {
				'#projectstoreeventnormalization': {
					add: {
						fn: 'onStoreOperation',
						args: ['add']
					},
					remove: {
						fn: 'onStoreOperation',
						args: ['remove']
					},
					create: {
						fn: 'onRecordOperation',
						args: ['create']
					},
					drop: {
						fn: 'onRecordOperation',
						args: ['drop']
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

	canUndo: false,
	canRedo: false,

	constructor: function() {
		this.callParent(arguments);

		/* 
			TEST: Undo-Szenarien
			create testdata -> select Tour 1 -> delete WP1 -> undo   ok
			create testdata -> delete WP1 -> select Tour 1 -> undo   ok
			load -> delete WP1 -> select Tour 1 -> undo   ok
			load -> select Area 1 -> delete -> undo   ok
			create testdata/load -> delete Tour 1 -> undo -> expand Tour 1 -> delete Area 1 -> Area 2 disappears   ok
			load -> delete Tour 1 -> save -> undo -> select Area 1 -> TPW3 not shown   ok
			load -> delete Area 1 -> undo -> redo -> undo -> project still modified   ok
		*/

		this.undoStack = [];
		this.redoStack = [];
		this.groupStack = [];
		this.currentGroup = this.undoStack;

		this.fireEvent('canUndoChanged', this.canUndo);
		this.fireEvent('canRedoChanged', this.canRedo);

		// Debugging
		window.u = this;
	},

	destroy: function() {
		this.setProject(null);
		this.callParent();
	},

	onStoreOperation: function(type, store, records, index) {
		var me = this,
			len = records.length,
			operation;

		// console.log('onStoreOperation', arguments);
		records.forEach(function(record, i) {
			operation = {
				type: type,
				record: record,
				store: store,
				addIndex: index + i,
				removeIndex: index
			};
			if (record.isNode) {
				Ext.merge(operation, {
					parentNode: record.parentNode,
					previousSibling: record.previousSibling,
					nextSibling: record.nextSibling
				});
				if (record.childNodes.length) {
					operation.childNodeSiblings = record.childNodes.map(function(childNode) {
						return {
							previousSibling: childNode.previousSibling,
							nextSibling: childNode.nextSibling
						};
					});
				}
			}
			me.registerUndoOperation(operation);
		});
	},

	onRecordOperation: function(type, record) {
		this.registerUndoOperation({
			type: type,
			record: record
		});	
	},

	onRecordUpdate: function(record, operation, modifiedFieldNames) {
		var previousValues,
			newValues;

		if (operation === Ext.data.Model.EDIT) {
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
	},
	
	endUndoGroup: function() {
		var group = this.currentGroup,
			operation;

		if (this.groupStack.length === 0) {
			Ext.Error.raise('No undo group to end');
		}

		this.currentGroup = this.groupStack.pop();
		if (group.length) {
			operation = {
				type: 'group',
				group: group
			};
			this.registerUndoOperation(operation);
		}
	},

	registerUndoOperation: function(operation) {
		this.currentGroup.push(operation);
		this.updateCanUndo();
		if (this.groupStack.length === 0 && this.redoStack.length) {
			this.redoStack = [];
			this.updateCanRedo();
		}
	},

	updateCanUndo: function() {
		var newCanUndo = this.undoStack.length ? true : false;
		if (this.canUndo !== newCanUndo) {
			this.canUndo = newCanUndo;
			this.fireEvent('canUndoChanged', this.canUndo);
		}
	},

	updateCanRedo: function() {
		var newCanRedo = this.redoStack.length ? true : false;
		if (this.canRedo !== newCanRedo) {
			this.canRedo = newCanRedo;
			this.fireEvent('canRedoChanged', this.canRedo);
		}
	},

	undo: function() {
		var operation = this.undoStack.pop();
		if (!operation) {
			return;
		}

		Ext.suspendLayouts();
		this.deactivate();
		this.undoOperation(operation);
		this.activate();
		Ext.resumeLayouts(true);
		
		this.redoStack.push(operation);
		this.updateCanUndo();
		this.updateCanRedo();
	},

	redo: function() {
		var operation = this.redoStack.pop();
		if (!operation) {
			return;
		}

		Ext.suspendLayouts();
		this.deactivate();
		this.redoOperation(operation);
		this.activate();
		Ext.resumeLayouts(true);

		this.undoStack.push(operation);
		this.updateCanUndo();
		this.updateCanRedo();
	},

	undoOperation: function(operation) {
		var me = this,
			i;

		switch (operation.type) {
			case 'group':
				for (i = operation.group.length; --i >= 0;) {
					me.undoOperation(operation.group[i]);
				}
				break;
			case 'create':
				operation.record.drop();
				break;
			case 'drop':
				this.undoDropOperation(operation);
				break;
			case 'edit':
				operation.record.set(operation.previousValues);
				break;
			case 'add':
				this.undoAddOperation(operation);
				break;
			case 'remove':
				this.undoRemoveOperation(operation);
				break;
			case 'fn':
				if (typeof operation.undo === 'function') {
					operation.undo();
				}
				break;
		}
	},

	redoOperation: function(operation) {
		var me = this,
			i,
			len;

		switch (operation.type) {
			case 'group':
				for (i = 0, len = operation.group.length; i < len; i++) {
					me.redoOperation(operation.group[i]);
				}
				break;
			case 'create':
				this.undoDropOperation(operation);
				break;
			case 'drop':
				operation.record.drop();
				break;
			case 'edit':
				operation.record.set(operation.newValues);
				break;
			case 'add': 
				this.undoRemoveOperation(operation);
				break;
			case 'remove':
				this.undoAddOperation(operation);
				break;
			case 'fn':
				if (typeof operation.redo === 'function') {
					operation.redo();
				}
				break;
		}
	},

	undoDropOperation: function(operation) {
		var record = operation.record,
			store = operation.store;

		record.dropped = false;
		if (record.erased) {
			record.erased = false;
			// an erased record that is not phantom must be set to phantom because it was already dropped
			// from the database
			record.phantom = true;
			record.session.add(record);
		}

		Ext.iterate(record.associations, function(roleName, role) {
			if (role.isMany) {
				// Create the association stores with this call because they were deleted during drop and 
				// only setting the foreign key of an associated record does not create them.
				role.getAssociatedStore(record);
			}
		});
	},

	undoRemoveOperation: function(operation) {
		var record = operation.record,
			store = operation.store;
	
		if (record.isNode && operation.parentNode) {
			// Why (record.isNode && operation.parentNode):
			// The parent node is dropped first, then the child nodes are dropped. While undoing child nodes
			// are recreated first and they don't have a reference to their parent. Theirfore they have 
			// to be added to the corresponding project's store and cannot be appended to their parent.

			// restore the 'parentNode', 'previousSibling' and 'nextSibling' attributes of all child nodes 
			// because they were cleared during the drop of this node
			record.childNodes.forEach(function(childNode, i) {
				childNode.parentNode = record;
				childNode.previousSibling = operation.childNodeSiblings[i].previousSibling;
				childNode.nextSibling = operation.childNodeSiblings[i].nextSibling;
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
	},

	undoAddOperation: function(operation) {
		var record = operation.record,
			store = operation.store;

		if (record.isNode && operation.parentNode) {
			operation.parentNode.removeChild(record);
		}
		else {
			if (store.associatedEntity && !store.session) {
				// association store was destroyed, need to get the current one
				store = operation.store = store.associatedEntity[store.role.getterName]();
			}
			store.remove(record);
		}
	}

});
