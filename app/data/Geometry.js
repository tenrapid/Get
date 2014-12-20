Ext.define('Get.data.Geometry', {

	projection: new OpenLayers.Projection("EPSG:4326"),
	geometry: null,

	statics: {
		geoJsonFormat: new OpenLayers.Format.GeoJSON(),
		
		isEqual: function (o1, o2) {
			var projection = this.prototype.projection,
				geoJson1,
				geoJson2;
			
			if (!o1 && o2 || o1 && !o2) {
				return false;
			}
			if (!o1 && !o2) {
				return true;
			}
			geoJson1 = o1.toGeoJson(projection);
			geoJson2 = o2.toGeoJson(projection);
			return geoJson1.type === geoJson2.type && Ext.Object.equals(geoJson1.coordinates, geoJson2.coordinates);
		},
	},
	
	constructor: function(config) {
		this.geometry = config.geometry || this.self.geoJsonFormat.read(config.json, 'Geometry');
		
		if (config.projection) {
			this.projection = config.projection;
		}
	},
	
	transform: function(projection) {
		this.geometry.transform(this.projection, projection);
		this.projection = projection;
	},
	
	toGeoJson: function(projection) {
		var geometry = this.geometry;
		if (projection && projection.projCode != this.projection.projCode) {
			geometry = geometry.clone();
			geometry.transform(this.projection, projection);
		}
		return this.self.geoJsonFormat.extract.geometry.apply(this.self.geoJsonFormat, [geometry]);
	}
	
});