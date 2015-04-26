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
	width: 500,
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
			bodyPadding: '8 14 2', // '8 10'
			bodyStyle: 'background-color: transparent;',
// 			bodyStyle: 'background-color: #e4e4e4;',
			border: false,
			autoScroll: true,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			listeners: {
				afterrender: function(form, options) {
					var controller = form.lookupController();
					Ext.create('Ext.util.KeyNav', form.el, {
						enter: function(e) {
							if (e.target.nodeName == 'TEXTAREA') {
								return true;
							}
							if (form.isValid()) {
								this.onSave();
							}
						},
						scope: controller
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
