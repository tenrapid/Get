Ext.define('Get.view.waypoints.edit.WaypointFields', {
    extend: 'Ext.form.FieldContainer',

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
			fieldLabel: 'Description',
			grow: true,
			bind: '{waypoint.description}'
		},
		{
			xtype: 'geometryfield',
			fieldLabel: 'Coords',
			allowBlank: false,
			bind: '{waypoint.geometry}',
			maxWidth: 260,
		},
	]

});
