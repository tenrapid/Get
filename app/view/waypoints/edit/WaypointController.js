Ext.define('Get.view.waypoints.edit.WaypointController', {
    extend: 'Ext.app.ViewController',
    requires: [
        'Get.view.waypoints.edit.WaypointFields',
        'Get.view.waypoints.edit.TourWaypointFields',
    ],

    alias: 'controller.edit.waypoint',
    id: 'edit-waypoint',

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
		this.getSession().save();
		this.closeView();
	},
	
});