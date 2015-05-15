Ext.define('Get.form.trigger.ClearPicker', {
	extend: 'Ext.form.trigger.Trigger',
	alias: 'trigger.clearpicker',

	bodyTpl: [
		'<div class="' + Ext.baseCSSPrefix + 'form-trigger-default ' + Ext.baseCSSPrefix + 'form-clear-trigger"></div>',
		'<div class="' + Ext.baseCSSPrefix + 'form-trigger-default ' + Ext.baseCSSPrefix + 'form-arrow-trigger"></div>'
	],

	destroy: function() {
		if (this.triggerEl) {
			this.triggerEl.destroy();
			this.triggerEl = this.clearEl = this.expandEl = null;
		}

		this.callParent();
	},

	getStateEl: function() {
		return this.triggerEl;
	},

	onFieldRender: function() {
		var triggerEl, elements;

		this.callParent();

		this.el.removeCls(Ext.baseCSSPrefix + 'form-trigger-default');

		triggerEl = this.triggerEl = this.el.select('div', true);
		elements = triggerEl.elements;

		this.clearEl = elements[0];
		this.expandEl = elements[1];
	},

	onClick: function(e) {
		var me = this,
			field = me.field;

		if (!field.readOnly && !field.disabled) {
			if (me.expandEl.contains(e.target)) {
				Ext.callback(me.handler, me.scope, [field, me, e], 0, field);
			} 
			else if (me.clearEl.contains(e.target)) {
				Ext.callback(me.clearHandler, me.scope, [field, me, e], 0, field);
			}
		}

		field.inputEl.focus();
	},

	setClearEnabled: function(enabled) {
		enabled ? 
			this.el.addCls(Ext.baseCSSPrefix + 'form-trigger-clear-enabled') : 
			this.el.removeCls(Ext.baseCSSPrefix + 'form-trigger-clear-enabled');
	}

});
