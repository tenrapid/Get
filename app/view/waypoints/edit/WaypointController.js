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
			waypointParentSession = viewModel.get('waypoint'),
			entityName = waypointParentSession.entityName,
			id = waypointParentSession.getId(),
			session = this.getSession(),
			form = this.lookupReference('form'),
			waypoint,
			tourWaypoint;
			
		if (entityName == 'TourWaypoint') {
			tourWaypoint = session.getRecord(entityName, id);
			waypoint = tourWaypoint.getWaypoint();
			viewModel.set('waypoint', waypoint);
			viewModel.set('tourWaypoint', tourWaypoint);
			form.add([
				{
					xtype: 'edit.waypoint.tour-waypoint-fields'
				},
				{
					xtype: 'fieldset',
					title: 'Waypoint',
					layout: {
						type: 'vbox',
						align: 'stretch'
					},
					padding: '1 8 0', //'0 7 1'
					margin: '0 0 8',
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
			waypoint = session.getRecord(entityName, id);
			viewModel.set('waypoint', waypoint);
			form.add({
				xtype: 'edit.waypoint.waypoint-fields'
			});
		}
		this.getView().defaultFocus = 'textfield';
	},

	onSave: function() {
		var project = this.getViewModel().get('project');
		this.eventbus.unlisten(this);
		project.undoManager.beginUndoGroup();
		this.getSession().save();
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
				delete editingRecord.modified[fieldName];
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
