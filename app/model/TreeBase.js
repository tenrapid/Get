Ext.define('Get.model.TreeBase', {
    extend: 'Get.model.Base',
    requires: [
        'Ext.data.NodeInterface'
    ],
    mixins: [
        'Ext.mixin.Queryable'
    ],
    
    identifier: {
    	id: 'treeNodes'
    },
	
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
