Ext.define('Get.view.waypoints.edit.EditWaypoint', {
	extend: 'Ext.window.Window',
	requires: [
		'Get.view.waypoints.edit.EditWaypointController',
		'Get.form.field.Geometry',
	],

	alias: 'widget.edit.waypoint',

	controller: 'edit.waypoint',

	isEditWaypointWindow: true,
	
	session: true,
	viewModel: true,

	autoShow: true,
	width: 600,
	constrain: true,
	plain: true,
	bodyStyle: 'border-width: 0;',
	layout: {
		type: 'fit',
	},
	
	bind: {
		title: 'Edit: {waypoint.name}',
	},

	beforeShow: function() {
		this.getViewModel().notify();
	},
	afterShow: function() {
		this.query('textarea').forEach(function(textarea) {
			textarea.autoSize();
		});
		this.center();
		this.callParent(arguments);
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
