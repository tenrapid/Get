Ext.define('Get.view.layers.edit.EditLayer', {
	extend: 'Ext.window.Window',
	requires: [
		'Get.view.layers.edit.EditLayerController',
		'Ext.form.Panel'
	],

	alias: 'widget.edit.layer',

	controller: 'edit.layer',

	isEditLayerWindow: true,
	
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
	defaultFocus: 'textfield',

	bind: {
		title: 'Edit: {layer.name}',
	},
	
	items: [
		{
			xtype: 'form',
			reference: 'form',
			bodyPadding: '8 14 6',
			bodyStyle: 'background-color: transparent;',
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
			items: [
				{
					xtype: 'textfield',
					fieldLabel: 'Name',
					bind: '{layer.name}',
				},
				{
					xtype: 'textarea',
					fieldLabel: 'Roadbook',
					grow: true,
					minHeight: 200,
					bind: '{layer.roadbook}'
				}
			],
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
	],

	beforeShow: function() {
		this.getViewModel().notify();
	},
	afterShow: function() {
		Ext.suspendLayouts();
		this.query('textarea').forEach(function(textarea) {
			textarea.autoSize();
		});
		Ext.resumeLayouts(true);
		this.center();
		this.callParent(arguments);
	}

});
