Ext.define('Get.data.reader.Feature', {
    extend: 'GeoExt.data.reader.Feature',
    
    config: {
    	preserveRawData: true
    },
    
    extractRecord: function(node) {
//     	console.log('Reader', this);
    	var id = node.id;
    	record = this.callParent(arguments);
// 		console.log(this.getModel());
// 		console.log(root);
        return record;
    },

	getModelData: function(raw) {
		return this.getPreserveRawData() ? Ext.apply({}, raw.attributes) : raw.attributes;
	},

    createFieldAccessor: function(field){
    	console.log('Field', field);
        return this.callParent([field]);
    },

});
