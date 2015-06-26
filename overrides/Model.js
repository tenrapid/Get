Ext.define('Ext.patch.data.Model', {
	override: 'Ext.data.Model',
	compatibility: '5.1.0.107',
	
	/*
		Modifications:
		- Temporarily cleanup the _singleProp reused object before calling onValueChange on associations. This avoids
		  nasty bugs if onValueChange triggers another Model.set method call.
	 */
	set: function (fieldName, newValue, options) {
		var me = this,
			cls = me.self,
			data = me.data,
			modified = me.modified,
			prevVals = me.previousValues,
			session = me.session,
			single = Ext.isString(fieldName),
			opt = (single ? options : newValue),
			convertOnSet = opt ? opt.convert !== false : me.convertOnSet,
			fieldsMap = me.fieldsMap,
			silent = opt && opt.silent,
			commit = opt && opt.commit,
			updateRefs = !(opt && opt.refs === false) && session,
			// Don't need to do dirty processing with commit, since we'll always
			// end up with nothing modified and not dirty
			dirty = !(opt && opt.dirty === false && !commit),
			modifiedFieldNames = null,
			currentValue, field, idChanged, key, name, oldId, comparator, dep, dependents,
			i, dirtyRank=0, numFields, newId, rankedFields, reference, value, values;

		if (single) {
			values = me._singleProp;
			values[fieldName] = newValue;
		} else {
			values = fieldName;
		}

		if (!(rankedFields = cls.rankedFields)) {
			// On the first edit of a record of this type we need to ensure we have the
			// topo-sort done:
			rankedFields = cls.rankFields();
		}
		numFields = rankedFields.length;

		do {
			for (name in values) {
				value = values[name];
				currentValue = data[name];
				comparator = me;
				field = fieldsMap[name];

				if (field) {
					if (convertOnSet && field.convert) {
						value = field.convert(value, me);
					}
					comparator = field;
					reference = field.reference;
				} else {
					reference = null;
				}

				if (comparator.isEqual(currentValue, value)) {
					continue; // new value is the same, so no change...
				}

				data[name] = value;
				(modifiedFieldNames || (modifiedFieldNames = [])).push(name);
				(prevVals || (me.previousValues = prevVals = {}))[name] = currentValue;

				// We need the cls to be present because it means the association class is loaded,
				// otherwise it could be pending.
				if (reference && reference.cls) {
					if (updateRefs) {
						session.updateReference(me, field, value, currentValue);
					}
					//////  MODIFIED:  ///////////////////////////////////////////////
					// reference.onValueChange(me, session, value, currentValue);
					if (single) {
						// temporarily cleanup the _singleProp reused object
						delete values[fieldName];
						reference.onValueChange(me, session, value, currentValue);
						values[fieldName] = newValue;
					}
					else {
						reference.onValueChange(me, session, value, currentValue);
					}
					//////////////////////////////////////////////////////////////////
				}

				i = (dependents = field && field.dependents) && dependents.length;
				while (i-- > 0) {
					// we use the field instance to hold the dirty bit to avoid any
					// extra allocations... we'll clear this before we depart. We do
					// this so we can perform the fewest recalculations possible as
					// each dependent field only needs to be recalculated once.
					(dep = dependents[i]).dirty = true;
					dirtyRank = dirtyRank ? Math.min(dirtyRank, dep.rank) : dep.rank;
				}

				if (!field || field.persist) {
					if (modified && modified.hasOwnProperty(name)) {
						if (!dirty || comparator.isEqual(modified[name], value)) {
							// The original value in me.modified equals the new value, so
							// the field is no longer modified:
							delete modified[name];
							me.dirty = -1; // fix me.dirty later (still truthy)
						}
					} else if (dirty) {
						if (!modified) {
							me.modified = modified = {}; // create only when needed
						}
						me.dirty = true;
						modified[name] = currentValue;
					}
				}

				if (name === me.idField.name) {
					idChanged = true;
					oldId = currentValue;
					newId = value;
				}
			}

			if (!dirtyRank) {
				// Unless there are dependent fields to process we can break now. This is
				// what will happen for all code pre-dating the depends or simply not
				// using it, so it will add very little overhead when not used.
				break;
			}

			// dirtyRank has the minimum rank (a 1-based value) of any dependent field
			// that needs recalculating due to changes above. The way we go about this
			// is to use our helper object for processing single argument invocations
			// to process just this one field. This is because the act of setting it
			// may cause another field to be invalidated, so while we cannot know at
			// this moment all the fields we need to recalculate, we know that only
			// those following this field in rankedFields can possibly be among them.

			field = rankedFields[dirtyRank - 1]; // dirtyRank is 1-based
			field.dirty = false; // clear just this field's dirty state

			if (single) {
				delete values[fieldName]; // cleanup last value
			} else {
				values = me._singleProp; // switch over
				single = true;
			}

			fieldName = field.name;
			values[fieldName] = data[fieldName];
			// We are now processing a dependent field, so we want to force a
			// convert to occur because it's the only way it will get a value
			convertOnSet = true;

			// Since dirtyRank is 1-based and refers to the field we need to handle
			// on this pass, we can treat it like an index for a minute and look at
			// the next field on towards the end to find the index of the next dirty
			// field.
			for ( ; dirtyRank < numFields; ++dirtyRank) {
				if (rankedFields[dirtyRank].dirty) {
					break;
				}
			}

			if (dirtyRank < numFields) {
				// We found a field after this one marked as dirty so make the index
				// a proper 1-based rank:
				++dirtyRank;
			} else {
				// We did not find any more dirty fields after this one, so clear the
				// dirtyRank and we will perhaps fall out after the next update
				dirtyRank = 0;
			}
		} while (1);

		if (me.dirty < 0) {
			// We might have removed the last modified field, so check to see if there
			// are any modified fields remaining and correct me.dirty:
			me.dirty = false;
			for (key in modified) {
				if (modified.hasOwnProperty(key)) {
					me.dirty = true;
					break;
				}
			}
		}

		if (single) {
			// cleanup our reused object for next time... important to do this before
			// we fire any events or call anyone else (like afterEdit)!
			delete values[fieldName];
		}

		++me.generation;

		if (idChanged) {
			me.id = newId;
			me.callJoined('onIdChanged', [oldId, newId]);
		}

		if (commit) {
			me.commit(silent, modifiedFieldNames);
		} else if (!silent && !me.editing && modifiedFieldNames) {
			me.callJoined('afterEdit', [modifiedFieldNames]);
		}

		return modifiedFieldNames;
	}

});
