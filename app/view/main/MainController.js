Ext.define('Get.view.main.MainController', {
	extend: 'Ext.app.ViewController',
	alias: 'controller.main',

	requires: [
		'Get.model.Project',
	],

	id: 'main', 

	config: {
		listen: {
			controller: {
				'#nodewebkitgui': {
					openMenuItem: 'onOpenMenuItem',
					saveMenuItem: 'onSaveMenuItem',
					saveAsMenuItem: 'onSaveAsMenuItem',
					closeMenuItem: 'onCloseMenuItem',
				},
			},
		}
	},

	project: null,

	init: function() {
		var me = this;
		Ext.get('openFileDialog').dom.addEventListener('change', function(e) {
			me.onOpenFileDialog(e.target.files[0]);
		});
		Ext.get('saveFileDialog').dom.addEventListener('change', function(e) {
			me.onSaveFileDialog(e.target.files[0]);
		});
	},
	
	load: function(project) {
		if (this.project) {
			var viewModel = this.getViewModel();
			this.fireEvent('projectUnload');
			viewModel.set('project', null);
			viewModel.notify();
			this.project.destroy();
			this.project = null;
		}
		project.load(this.onLoad, this);
	},
	
	onLoad: function(project) {
		var me = this,
			view = me.getView(),
			viewModel = me.getViewModel();
			
		project.waypointStore.setStoreId('waypoints');
		Ext.data.StoreManager.register(project.waypointStore);
		
		view.setSession(project.session);
		viewModel.setSession(project.session);
		viewModel.set('project', project);
		viewModel.notify();
		me.project = project;
		me.fireEvent('projectLoad');
	},
	
	save: function() {
		this.project.save();
	},
	
	onNewMenuItem: function() {
		// TODO: onNewMenuItem
	},

	onOpenMenuItem: function() {
		// TODO: warn if there are unsaved changes
		Ext.get('openFileDialog').dom.click();
	},
	onOpenFileDialog: function(file) {
		project = Ext.create('Get.model.Project', {
			filename: file.path
		});
		this.load(project);
	},

	onSaveMenuItem: function() {
		var filename = this.project.get('filename');

		if (filename) {
			this.save();
		}
		else {
			Ext.get('saveFileDialog').dom.click();
		}
	},
	onSaveAsMenuItem: function() {
		var input = Ext.get('saveFileDialog'),
			path = require('path'),
			filename = this.project.get('filename'),
			name = filename ? path.basename(filename) : (this.project.get('name') + '.get');

		input.set({
			nwsaveas: name
		});
		input.dom.click();
	},
	onSaveFileDialog: function(file) {
		var me = this,
			fs = require('fs'),
			path = require('path'),
			save = function() {
				if (me.project.get('filename')) {
					// TODO: close Database, copy and open again?
				}
				// me.project.set('filename', filename);
				// me.save();
			},
			filename = file.path;

		// Reset so that the change event can fire if the same file is selected again.
		Ext.get('saveFileDialog').dom.value = '';

		if (!Ext.String.endsWith(filename, '.get', true)) {
			filename += '.get';
		}

		if (fs.existsSync(filename)) {
			// TODO: Übernimmt Chrome in Windows auch die Überprüfung auf existierende Datei?
			Ext.Msg.show({
				message: '"' + path.basename(filename) + '" existiert bereits. Soll die Datei ersetzt werden?',
				buttons: Ext.MessageBox.OKCANCEL,
				buttonText: {
					ok: 'Ersetzen',
					cancel: 'Abbrechen'
				},
				icon: Ext.MessageBox.WARNING,
				fn: function(choice) {
					if (choice == 'ok') {
						save();
					}
				}
			});
		}
		else {
			save();
		}
	},

	onCloseMenuItem: function() {
		// TODO: warn if there are unsaved changes
	}

});
