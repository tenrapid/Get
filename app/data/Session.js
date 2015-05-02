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
		createEntities: function() {
			this.createEntitiesCalling = true;
			this.callParent(arguments);
			this.createEntitiesCalling = false;
		},

	    add: function(record) {
	    	if (this.createEntitiesCalling) {
				// Set the "phantom" property to true right before firing the "add" event. 
				// We need the phantom status right now for e.g. ProjectModificationState.
				// "phantom" is set to true in session.createEntities() anyways but too late
				// for ProjectModificationState.
    			record.phantom = true;
    		}
    		// Fire the "add" event before actually adding the record to the session to have 
    		// the correct order of events after going through StoreEventNormalizationController: 
    		// "create" the record -> "add" it to  store
    		// This is needed for association records that are created during a session.save()
    		// (e.g. "Get.model.Picture") because in session.add() the records are added to their
    		// association stores which results in firing "add" events on these stores.
	    	this.fireEvent('add', record);
	    	this.callParent(arguments);
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