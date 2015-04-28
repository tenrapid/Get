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
	    	this.callParent(arguments);
	    	if (this.createEntitiesCalling) {
    			record.phantom = true;
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