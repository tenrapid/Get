Ext.define('Get.view.waypoints.edit.Waypoint', {
	extend: 'Ext.window.Window',
	requires: [
		'Get.view.waypoints.edit.WaypointController',
		'Get.form.field.Geometry',
	],

	alias: 'widget.edit.waypoint',

	controller: 'edit.waypoint',
	
	session: true,

	autoShow: true,
	width: 600,
	plain: true,
	bodyStyle: 'border-width: 0;',
	layout: {
		type: 'fit',
	},
	
	bind: {
		title: 'Edit: {waypoint.name}',
	},
	
	items: [
		{
			xtype: 'form',
			reference: 'form',
			bodyPadding: '8 14 0',
			bodyStyle: 'background-color: transparent;',
// 			bodyStyle: 'background-color: #e4e4e4;',
			border: false,
			autoScroll: true,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			listeners: {
				afterrender: function(component, options) {
					var okButton = component.down('button[cls~=btn-ok]').el.dom;
					component.query('textfield').forEach(function(textfield) {
						if (!textfield.isXType('textarea')) {
							Ext.create('Ext.util.KeyNav', {
								target: textfield.el,
								enter: function() {
									okButton.click();
								}
							});
						}
					});
				}, 
			},
			fieldDefaults: {
				labelAlign: 'right',
				labelWidth: 90,
				msgTarget: 'under',
			},
			buttons: [
				{
					text: 'OK',
					cls: 'btn-ok',
					formBind: true,
					handler: 'onSave',
				},
				{
					text: 'Abbrechen',
					handler: 'closeView',
				},
			]
		},
	]

});
