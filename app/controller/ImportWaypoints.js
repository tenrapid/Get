Ext.define('Get.controller.ImportWaypoints', {
	extend: 'Ext.app.Controller',
	requires: [
		'Get.view.FileDialog'
	],

	id: 'importWaypoints', 

	config: {
		listen: {
			global: {
				'importWaypointsMenuItem': 'onImportMenuItem',
			}
		}
	},

	onImportMenuItem: function() {
		Get.FileDialog.show({
			accept: '.kml,.gpx',
			handler: this.importFile,
			scope: this
		});
	},

	importFile: function(file) {
		var fs = require('fs'),
			togeojson = require('togeojson'),
			project = this.getApplication().getMainView().getViewModel().get('project'),
			waypointStore = project.waypointStore,
			xml,
			parsererror,
			type,
			geojson,
			waypoints = [];

		xml = new DOMParser().parseFromString(fs.readFileSync(file.path), 'text/xml');

		if (xml.getElementsByTagName('parsererror').length) {
			parsererror = xml.getElementsByTagName('parsererror')[0];
			throw new Error('Fehler beim Lesen von "' + file.name + '":\n' + parsererror.getElementsByTagName('div')[0].textContent);
		}

		type = xml.childNodes.length && xml.childNodes[0].nodeName.toLowerCase();
		if (type === 'gpx') {
			geojson = togeojson.gpx(xml);
		}
		else if (type === 'kml') {
			geojson = togeojson.kml(xml);
		}
		else {
			throw new Error('Kein unterstützter Dateityp: "' + file.name + '"');
		}

		project.undoManager.beginUndoGroup();
		geojson.features.forEach(function(feature) {
			waypoints.push(project.session.createRecord('Waypoint', {
				name: feature.properties.name,
				geometry: feature.geometry,
				description: feature.properties.desc
			}));
		});
		waypointStore.add(waypoints);
		project.undoManager.endUndoGroup();

		Ext.GlobalEvents.fireEvent('zoomToWaypoints', waypoints);
	}

});
