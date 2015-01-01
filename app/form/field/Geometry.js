Ext.define('Get.form.field.Geometry', {
	extend: 'Ext.form.field.Text',
	requires: [
		'Get.data.Geometry',
		'Ext.form.field.VTypes',
	],
	
	xtype: 'geometryfield',
	
	emptyText: 'N 00° 00.000 E 000° 00.000',
	
	vtype: 'coordinates',
	
	projection: new OpenLayers.Projection('EPSG:4326'),
		
	reDMS: /([NS])\s*(\d+)(°\s*|\s+)(\d+)\.(\d+)\s*([EW])\s*(\d+)(°\s*|\s+)(\d+)\.(\d+)/i,
	
	valueToRaw: function(value) {
		var geometry,
			projection;

		if (!value) {
			return '';
		}
		
		geometry = value.geometry;
		projection = value.projection;
			
		if (!(geometry instanceof OpenLayers.Geometry.Point)) {
			return (geometry instanceof OpenLayers.Geometry) ? geometry.CLASS_NAME : '';
		}

		geometry = geometry.clone().transform(projection, this.projection);
		return this.latLonToString(geometry.y, geometry.x);		
	},
	
	rawToValue: function(raw) {
		var latLon = this.stringToLatLon(raw),
			geometry;
			
		if (!latLon) {
			return;
		}

		geometry = Ext.create('Get.data.Geometry', {
			geometry: new OpenLayers.Geometry.Point(latLon.lon, latLon.lat)
		});
		geometry.isFromFormField = true;
		return geometry;
	},
	
	transformRawValue: function(value) {
		if (Ext.Object.equals(this.stringToLatLon(value), this.stringToLatLon(this.rawValue))) {
			value = this.rawValue;
		}
		return value;
	},
	
	isEqual: function(newVal, oldVal) {
		return Get.data.Geometry.isEqual(newVal, oldVal);
	},
	
	latLonToString: function(lat, lon) {
		var str = '';
		str += lat >= 0 ? 'N ' : 'S ';
		str += Ext.String.leftPad(Math.abs(Math.floor(lat)), 2, '0') + '° ';
		minutes = Math.abs(lat - Math.floor(lat)) * 60;
		str += Ext.String.leftPad(Ext.Number.toFixed(minutes, 3), 6, '0');
		
		str += lon >= 0 ? ' E ' : ' W ';
		str += Ext.String.leftPad(Math.abs(Math.floor(lon)), 3, '0') + '° ';
		minutes = Math.abs(lon - Math.floor(lon)) * 60;
		str += Ext.String.leftPad(Ext.Number.toFixed(minutes, 3), 6, '0');
		return str;
	},
	
	stringToLatLon: function(str) {
		var match;
		
		match = this.reDMS.exec(str);
		if (!match) {
			return;
		}
		return {
			lat: (match[1].toUpperCase() === 'N' ? 1 : -1) * match[2] + (parseFloat(match[4] + '.' + match[5]) / 60),
			lon: (match[6].toUpperCase() === 'E' ? 1 : -1) * match[7] + (parseFloat(match[9] + '.' + match[10]) / 60)
		};
	},
	
}, 
function() {
	var me = this;
	// add VType 'coordinates'
	Ext.apply(Ext.form.field.VTypes, {
		coordinates: function(value, field) {
			return me.prototype.reDMS.test(value);
		},
		coordinatesText: 'Invalid coordinate.',
	});
});