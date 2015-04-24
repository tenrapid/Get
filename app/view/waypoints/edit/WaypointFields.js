Ext.define('Get.view.waypoints.edit.WaypointFields', {
	extend: 'Ext.form.FieldContainer',

	requires: [
		'Get.view.waypoints.edit.Pictures'
	],

	alias: 'widget.edit.waypoint.waypoint-fields',

	layout: {
		type: 'vbox',
		align: 'stretch'
	},

	items: [
		{
			itemId: 'firstField',
			xtype: 'textfield',
			fieldLabel: 'Name',
			bind: '{waypoint.name}',
		},
		{
			xtype: 'textarea',
			fieldLabel: 'Beschreibung',
			grow: true,
			bind: '{waypoint.description}'
		},
		{
			xtype: 'geometryfield',
			fieldLabel: 'Koordinaten',
			allowBlank: false,
			bind: '{waypoint.geometry}',
			maxWidth: 260,
		},
		{
			xtype: 'fieldcontainer',
			fieldLabel: 'Bilder',
			items: [
				{
					xtype: 'edit.waypoint.pictures',
					bind: '{waypoint.pictures}'
				}
			]
		},
	]

});
