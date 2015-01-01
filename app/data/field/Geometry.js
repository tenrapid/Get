Ext.define('Get.data.field.Geometry', {
	extend: 'Ext.data.field.Field',

	alias: 'data.field.geometry',
	
	requires: 'Get.data.Geometry',
	
	projection: 'EPSG:4326',
	projectionObject: null,

	constructor: function(config) {
		this.callParent(arguments);
		if (!this.projectionObject) {
			this.projectionObject = new OpenLayers.Projection(this.projection);
		}
	},
	
	convert: function(value) {
		var config;
		
		if (value instanceof Get.data.Geometry) {
			if (value.isFromFormField) {
				// convert called from form field binding
				delete value.isFromFormField;
				return value;
			}
			else {
				// convert called from Model.set() or Model.copy()
				config = {
					geometry: value.geometry.clone(),
					projection: value.projection,
				};
				return Ext.create('Get.data.Geometry', config);
			}
		}
		else {
			config = {
				json: value,
				projection: this.projectionObject,
			};
			return Ext.create('Get.data.Geometry', config);
		}
	},
	
	serialize: function(value, record) {
		if (!(value instanceof Get.data.Geometry)) {
			Ext.Error.raise({
				msg: 'Object not of type Get.data.Geometry.',
				option: value
			});
		}
		return JSON.stringify(value.toGeoJson(this.projectionObject));
	},
	
	isEqual: function (lhs, rhs) {
		return Get.data.Geometry.isEqual(lhs, rhs);
	},
	
	getType: function() {
		return 'geometry';
	}
});