Ext.define('Get.view.waypoints.edit.TourWaypointFields', {
	extend: 'Ext.form.FieldContainer',

	alias: 'widget.edit.waypoint.tour-waypoint-fields',

	layout: {
		type: 'vbox',
		align: 'stretch'
	},

	items: [
		{
// 			itemId: 'firstField',
			xtype: 'textfield',
			fieldLabel: 'Name',
			bind: '{tourWaypoint.name}',
		},
		{
			xtype: 'textarea',
			fieldLabel: 'Beschreibung',
			grow: true,
			bind: '{tourWaypoint.description}'
		},
	]

});
