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
	    add: function(record) {
	    	this.callParent(arguments);
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