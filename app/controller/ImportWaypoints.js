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

	fileDialog: null,

	init: function() {
		this.fileDialog = Ext.create('Get.view.FileDialog', {
			accept: '.kml,.gpx',
			listeners: {
				change: this.importFile,
				scope: this
			}
		});
	},

	onImportMenuItem: function() {
		this.fileDialog.show();
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

		if (!file) return;

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

		geojson.features.forEach(function(feature) {
			waypoints.push(Ext.create('Get.model.Waypoint', {
				name: feature.properties.name,
				geometry: feature.geometry,
				description: feature.properties.desc
			}));
		});
		project.undoManager.beginUndoGroup();
		waypointStore.add(waypoints);
		project.undoManager.endUndoGroup();
	}

});
