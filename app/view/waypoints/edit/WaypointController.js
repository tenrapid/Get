Ext.define('Get.view.waypoints.edit.WaypointController', {
	extend: 'Ext.app.ViewController',

	alias: 'controller.edit.waypoint',

	requires: [
		'Get.view.waypoints.edit.WaypointFields',
		'Get.view.waypoints.edit.TourWaypointFields',
		'Ext.data.Model'
	],

	config: {
		listen:{
			store: {
				waypoint: {
					update: 'onRecordUpdate',
					remove: 'onRecordRemove',
					clear: 'onRecordRemove'
				},
				tourWaypoint: {
					update: 'onRecordUpdate',
					remove: 'onRecordRemove',
					clear: 'onRecordRemove'
				}
			}
		}
	},

	init: function() {
		/*
			Eigentlich müsste es so aussehen:
			viewModel: {
				links: {
					waypoint: record,
				},
			},
			Das erzeugt aber im Haupt-ViewModel auch einen 'waypoint'-Eintrag, so dass nicht 
			zwei Fenster mit unterschiedlichen Waypoints geöffnet werden können.
		*/
		var viewModel = this.getViewModel(),
			session = this.getSession(),
			form = this.lookupReference('form'),
			waypointParentSession = viewModel.get('waypoint'),
			id,
			isTourWaypoint,
			tourWaypoint,
			waypoint,
			map,
			latLon;

		if (waypointParentSession) {
			id = waypointParentSession.getId(),
			isTourWaypoint = waypointParentSession.entityName === 'TourWaypoint',
			tourWaypoint = isTourWaypoint ? session.getRecord('TourWaypoint', id) : null,
			waypoint = isTourWaypoint ? tourWaypoint.getWaypoint() : session.getRecord('Waypoint', id);

			// We have to "initialize" the association store. If we don't do this, new pictures aren't
			// added to it during session.save().
			if (isTourWaypoint) {
				waypointParentSession.getWaypoint().pictures();
			}
			else {
				waypointParentSession.pictures();
			}
		}
		else {
			// Create new waypoint.
			map = Ext.getCmp('map-panel').map,
			latLon = map.getCenter();
			waypoint = session.createRecord('Waypoint', {
				geometry: Ext.create('Get.data.Geometry', {
					geometry: new OpenLayers.Geometry.Point(latLon.lon, latLon.lat),
					projection: map.getProjection()
				})
			});
			isTourWaypoint = false;
			this.isNewWaypoint = true;
		}

		// Set complete to true to prevent a load of the association store.
		waypoint.pictures().complete = true;
		// Set association store proxy as memory proxy to prevent an ajax load from PictureCombobox.
		waypoint.pictures().setProxy('memory');
		
		viewModel.set('waypoint', waypoint);

		if (isTourWaypoint) {
			viewModel.set('tourWaypoint', tourWaypoint);
			viewModel.set('pictures', waypoint.pictures());
			form.add([
				{
					xtype: 'edit.waypoint.tour-waypoint-fields'
				},
				{
					xtype: 'fieldset',
					title: 'Wegpunkt',
					layout: {
						type: 'vbox',
						align: 'stretch'
					},
					margin: '0 0 -5',
					fieldDefaults: {
						labelWidth: 80,	
					},
					items: [
						{
							xtype: 'edit.waypoint.waypoint-fields',
						},
					],
				}
			]);
			this.getView().setBind({title: 'Edit: {tourWaypoint.name}'});
		}
		else {
			form.add({
				xtype: 'edit.waypoint.waypoint-fields'
			});
		}
		viewModel.notify();
		this.getView().defaultFocus = 'textfield';
	},

	onSave: function() {
		var viewModel = this.getViewModel(),
			project = viewModel.get('project'),
			waypoint;

		this.eventbus.unlisten(this);
		project.undoManager.beginUndoGroup();
		this.getSession().save();
		if (this.isNewWaypoint) {
			waypoint = project.session.getRecord('Waypoint', viewModel.get('waypoint').getId());
			project.getStore('waypoint').add(waypoint);
		}
		project.undoManager.endUndoGroup();
		this.closeView();
	},

	onRecordRemove: function (store, records) {
		var me = this;
		records.some(function(record) {
			if (me.isEditingRecord(record)) {
				me.closeView();
				return true;
			}
		});
	},

	onRecordUpdate: function(store, record, operation, modifiedFieldNames) {
		var editingRecord;

		/*
			TEST:
			open WP1 -> open TWP1 -> edit WP1 + save -> edit WP1 in TWP1 + save -> no change 
		*/

		if (operation === Ext.data.Model.EDIT && modifiedFieldNames && this.isEditingRecord(record)) {
			if (record.entityName === 'Waypoint') {
				editingRecord = this.getViewModel().get('waypoint');
			}
			else {
				editingRecord = this.getViewModel().get('tourWaypoint');
			}
			modifiedFieldNames.forEach(function(fieldName) {
				editingRecord.set(fieldName, record.get(fieldName));
				if (editingRecord.modified) {
					delete editingRecord.modified[fieldName];
				}
			});
		}
	},

	isEditingRecord: function(record) {
		var tourWaypoint;

		if (record.entityName === 'Waypoint' && record.getId() === this.getViewModel().get('waypoint').getId()) {
			return true;
		}
		else if (record.entityName === 'TourWaypoint') {
			tourWaypoint = this.getViewModel().get('tourWaypoint');
			if (tourWaypoint && record.getId() === tourWaypoint.getId()) {
				return true;
			}
		}
		return false;
	}
	
});
