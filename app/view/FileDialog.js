Ext.define('Get.view.FileDialog', {
	extend: 'Ext.Component',

	alias: 'widget.filedialog',

	config: {
		multiple: false,
		saveAs: false,
		accept: ''
	},

	autoEl: 'input',
	hidden: true,
	baseCls: Ext.baseCSSPrefix + 'file-dialog',

	initComponent: function() {
		this.callParent();
		this.renderTo = Ext.getBody();
	},

	onRender: function() {
		var attrs = {
			type: 'file'
		};

		this.callParent();

		if (this.accept) {
			attrs.accept = this.accept;
		}
		if (this.multiple) {
			attrs.multiple = '';
		}
		if (this.saveAs) {
			attrs.nwsaveas = '';
		}

		this.el.set(attrs);
		this.el.dom.files.append(new File('', ''));

		this.el.on({
			change: this.onChange,
			scope: this
		});
	},

	show: function() {
		this.el.dom.click();
		this.fireEvent('show');
	},

	onChange: function() {
		var files = Ext.Array.clone(this.el.dom.files);

		// Reset so that the change event can fire if the same file is selected again.
		this.el.dom.files.clear();
		// Append unnamed file so that the change event fires if the file dialog is canceled.
		this.el.dom.files.append(new File('', ''));

		this.fireEvent('change', this.multiple ? files : files[0]);
		this.fireEvent('hide');
	}

});
