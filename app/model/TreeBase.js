Ext.define('Get.model.TreeBase', {
	extend: 'Get.model.Base',
	requires: [
		'Ext.data.NodeInterface',
		'Ext.data.identifier.Uuid'
	],
	mixins: [
		'Ext.mixin.Queryable'
	],
	
	identifier: {
		type: 'sequential',
		id: 'tree'
	},
	
	fields: [
		{
			name: 'id',
			type: 'int'
		},
		{
			name: 'index',
			type: 'int',
			defaultValue : -1,
			convert: null,
			persist: true
		}
	],

	getRefItems: function() {
		return this.childNodes;
	},

	getRefOwner: function() {
		return this.parentNode;
	}
},
function () {
	Ext.data.NodeInterface.decorate(this);
	this.override({
		// Override of updateInfo because moving a node to a new position and then back again leads
		// to a dirty record.

		/**
		 * Updates general data of this node like isFirst, isLast, depth. This
		 * method is internally called after a node is moved. This shouldn't
		 * have to be called by the developer unless they are creating custom
		 * Tree plugins.
		 * @param {Boolean} commit
		 * @param {Object} info The info to update. May contain any of the following
		 *  @param {Object} info.isFirst
		 *  @param {Object} info.isLast
		 *  @param {Object} info.index
		 *  @param {Object} info.depth
		 *  @param {Object} info.parentId
		 */
		updateInfo: function(commit, info) {
			var me = this,
				dataObject = me.data,
				oldDepth = dataObject.depth,
				childInfo = {},
				children = me.childNodes,
				childCount = children.length,
				phantom = me.phantom,
				fields = me.fields,
				modified = me.modified || (me.modified = {}),
				propName, newValue,
				field, currentValue, key,
				newParentId = info.parentId,
				// added in override
				modifiedParentId = modified.parentId,
				settingIndexInNewParent,
				persistentField, i;

			//<debug>
			if (!info) {
				Ext.Error.raise('NodeInterface expects update info to be passed');
			}
			//</debug>

			// Set the passed field values into the data object.
			// We do NOT need the expense of Model.set. We just need to ensure
			// that the dirty flag is set.
			for (propName in info) {
				field = fields[me.fieldOrdinals[propName]];
				newValue = info[propName];
				persistentField = field && field.persist;

				currentValue = dataObject[propName];

				// If we are setting the index value, and the developer has changed it to be persistent, and the
				// new parent node is different to the starting one, it must be dirty.
				// The index may be the same value, but it's in a different parent.
				// This is so that a Writer can write the correct persistent fields which must include
				// the index to insert at if the parentId has changed.
				settingIndexInNewParent = persistentField && (propName === 'index') && (currentValue !== -1) && (newParentId && modifiedParentId && newParentId !== modifiedParentId);

				// If new value is the same (unless we are setting the index in a new parent node), then skip the change.
				if (!settingIndexInNewParent && me.isEqual(currentValue, newValue)) {
					continue;
				}
				dataObject[propName] = newValue;

				// Only flag dirty when persistent fields are modified
				if (persistentField) {

					// modified in override
					// Already modified, just check if we've reverted it back to start value (unless we are setting the index in a new parent node)
					if (!settingIndexInNewParent && modified.hasOwnProperty(propName)) {

						// If we have reverted to start value, possibly clear dirty flag
						if (me.isEqual(modified[propName], newValue)) {
							// The original value in me.modified equals the new value, so
							// the field is no longer modified:
							delete modified[propName];

							// We might have removed the last modified field, so check to
							// see if there are any modified fields remaining and correct
							// me.dirty:
							me.dirty = false;
							for (key in modified) {
								if (modified.hasOwnProperty(key)){
									me.dirty = true;
									break;
								}
							}
						}
					}

					// Not already modified, set dirty flag
					else {
						me.dirty = true;
						modified[propName] = currentValue;
					}
				}
			}
			if (commit) {
				me.commit();
				me.phantom = phantom;
			}

			// The only way child data can be influenced is if this node has changed level in this update.
			if (me.data.depth !== oldDepth) {
				childInfo = {
					depth: me.data.depth + 1
				};
				for (i = 0; i < childCount; i++) {
					children[i].updateInfo(commit, childInfo);
				}
			}
		},
	});

});
