Ext.define('Get.model.TreeBase', {
    extend: 'Get.model.Base',
    requires: [
        'Ext.data.NodeInterface',
        'Ext.data.identifier.Uuid'
    ],
    mixins: [
        'Ext.mixin.Queryable'
    ],
    
    identifier: 'uuid',
	
	fields: [
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
});
