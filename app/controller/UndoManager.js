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
			},
		}
	},

	undoStack: null,
	redoStack: null,
	groupStack: null,
	currentGroup: null,

	constructor: function() {
		this.callParent(arguments);

		var me = this,
			project = this.getProject();

		project.stores.forEach(function(name) {
			project.getStore(name).on({
				update: me.onRecordUpdate,
				add: {
					fn: me.onRecordOperation,
					args: ['add']
				},
				remove: {
					fn: me.onRecordOperation,
					args: ['remove']
				},
				scope: me
			});
		});

		this.undoStack = [];
		this.redoStack = [];
		this.groupStack = [];
		this.currentGroup = this.undoStack;
		window.u = this;
	},

	destroy: function() {
		this.setProject(null);
		this.callParent();
	},

	onRecordOperation: function(type, store, records) {
		var me = this,
			operation;

		if (this.listenersSuspended) {
			return;
		}

		// console.log('onRecordOperation', arguments);
		records.forEach(function(record) {
			operation = {
				type: type,
				record: record,
				store: store,
				dirty: record.dirty
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

	onRecordUpdate: function(store, record, operation, modifiedFieldNames, details) {
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
				// operation.store.remove(operation.record);
				// if (operation.record.isNode) {
				// 	operation.parentNode.removeChild(operation.record);
				// }
				break;
			case 'remove':
				record.dropped = false;
				if (record.erased) {
					record.erased = false;
					// clear the session attribute of a phantom record, so that the record can be adopted again
					// in store.add(record)
					record.session = null;
				}
				if (record.isNode && operation.parentNode) {
					if (operation.nextSibling) {
						operation.parentNode.insertBefore(record, operation.nextSibling);
					}
					else {
						operation.parentNode.appendChild(record);
						// operation.parentNode.insertChild(operation.previousSibling.get('index') + 1, operation.record);
					}
				}
				else {
					operation.store.add(record);
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
			case 'edit':
				operation.record.set(operation.newValues);
				break;
			case 'add': 
				break;
			case 'remove': 
				break;
		}
	},

});
