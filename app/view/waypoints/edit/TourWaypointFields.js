Ext.define('Get.view.waypoints.edit.TourWaypointFields', {
	extend: 'Ext.form.FieldContainer',
	requires: [
		'Get.form.field.PictureComboBox'
	],

	alias: 'widget.edit.waypoint.tour-waypoint-fields',

	layout: {
		type: 'vbox',
		align: 'stretch'
	},

	items: [
		{
			xtype: 'textfield',
			fieldLabel: 'Name',
			bind: '{tourWaypoint.name}',
		},
		{
			xtype: 'fieldcontainer',
			layout: 'hbox',
			items: [
				{
					xtype: 'textarea',
					fieldLabel: 'Aufgabe',
					grow: true,
					flex: 1,
					minHeight: 61,
					bind: '{tourWaypoint.task}'
				},
				{
					xtype: 'picturecombobox',
					width: 79,
					height: 61,
					editable: false,
					queryMode: 'local',
					valueField: 'id',
					displayField: 'id',
					bind: {
						store: '{waypoint.pictures}',
						selection: '{tourWaypoint.taskPicture}',
					},
					margin: '0 0 0 6'
				},
			]
		},
		{
			xtype: 'textfield',
			fieldLabel: 'Hinweis',
			bind: '{tourWaypoint.hint}',
		},
		{
			xtype: 'fieldcontainer',
			layout: 'hbox',
			items: [
				{
					xtype: 'textarea',
					fieldLabel: 'Aufbau',
					grow: true,
					flex: 1,
					minHeight: 61,
					bind: '{tourWaypoint.setup}'
				},
				{
					xtype: 'picturecombobox',
					width: 79,
					height: 61,
					editable: false,
					queryMode: 'local',
					valueField: 'id',
					displayField: 'id',
					bind: {
						store: '{waypoint.pictures}',
						selection: '{tourWaypoint.setupPicture}',
					},
					margin: '0 0 0 6'
				},
			]
		},
	]

});
