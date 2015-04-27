Ext.define('Get.data.Session', {
	extend: 'Ext.data.Session',

    mixins: [
        'Ext.mixin.Observable'
    ],

    requires: [
    	'Ext.data.Model'
    ],

	constructor: function(config) {
		this.callParent(arguments);
		this.mixins.observable.constructor.call(this, config);
	},

    privates: {
	    add: function _add(record) {
	    	this.callParent(arguments);
	    	if (_add.caller === Ext.data.Model.prototype.constructor) {
	    		// Call stack:
	    		//		Ext.data.Model.prototype.constructor
	    		//		Ext.data.Model
	    		//		Ext.data.Session.prototype.createRecord
	    		//		Ext.data.Session.prototype.createEntities
	    		//
	    		// With this call stack the record was created in session.createEntities and
	    		// the phantom property is set to true right after this call to session.add. 
	    		// We need the phantom status right now for e.g. ProjectModificationState.
	    		if (_add.caller.caller.caller.caller === Ext.data.Session.prototype.createEntities) {
	    			record.phantom = true;
	    		}
    		}
	    	this.fireEvent('add', record);
	    },
    },

	afterEdit: function(record, modifiedFieldNames) {
    	this.fireEvent('update', record, Ext.data.Model.EDIT, modifiedFieldNames);
	},

	afterCommit: function(record, modifiedFieldNames) {
    	this.fireEvent('update', record, Ext.data.Model.COMMIT);
	},

	afterDrop: function(record) {
    	this.fireEvent('remove', record);
	}

});