Ext.define('Get.view.FileDialog', {
	extend: 'Ext.Component',

	alias: 'widget.filedialog',

	autoEl: 'input',
	hidden: true,
	baseCls: Ext.baseCSSPrefix + 'file-dialog',

	initComponent: function() {
		this.callParent();
		this.renderTo = Ext.getBody();
	},

	onRender: function() {
		this.callParent(arguments);

		this.el.set({
			type: 'file'
		});

		this.el.on({
			change: this.onChange,
			scope: this
		});
	},

	/*
	 * config options
	 * 		multiple (Boolean)
	 *		saveAs (Boolean)
	 *		accept (String)
	 *		directory (String)
	 * 		file (String)
	 */
	show: function(config) {
		var attrs = {
			accept: config.accept,
			nwworkingdir: config.directory,
			multiple: config.multiple ? '' : undefined,
			nwsaveas: config.saveAs ? '' : undefined,
		};

		this.el.set(attrs);

		this.multiple = config.multiple;
		this.changeHandler = Ext.Function.bindCallback(config.handler || Ext.emptyFn, config.scope || Ext.global);

		// Reset so that the change event can fire if the same file is selected again.
		this.el.dom.files.clear();
		// Append unnamed file so that the change event fires if the file dialog is canceled.
		this.el.dom.files.append(config.file ? new File(config.file, '') : new File('', ''));

		this.el.dom.click();
		this.hidden = false;
		this.fireEvent('show', this);
	},

	onChange: function() {
		var files = Ext.Array.clone(this.el.dom.files);

		if (files.length) {
			this.changeHandler(this.multiple ? files : files[0]);
			this.fireEvent('change', this.multiple ? files : files[0]);
		}
		this.hidden = true;
		this.fireEvent('hide', this);
	}

}, function(FileDialog) {
    Ext.onReady(function() {
        Get.FileDialog = new FileDialog();
    });
});
