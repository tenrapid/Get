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
					newMenuItem: 'onNewMenuItem',
					openMenuItem: 'onOpenMenuItem',
					saveMenuItem: 'onSaveMenuItem',
					saveAsMenuItem: 'onSaveAsMenuItem',
					closeMenuItem: 'onCloseMenuItem',
				},
			},
		}
	},

	project: null,
	nodeWebkitGuiController: null,

	init: function() {
		var me = this;
		Ext.get('openFileDialog').dom.addEventListener('change', function(e) {
			var input = e.target,
				files = input.files;
			if (files.length) {
				me.onOpenFileDialog(files[0]);
			}
			// Reset so that the change event can fire if the same file is selected again.
			input.value = '';
		});
		Ext.get('saveFileDialog').dom.addEventListener('change', function(e) {
			var input = e.target,
				files = input.files;
			if (files.length) {
				me.onSaveFileDialog(files[0]);
			}
			// Reset so that the change event can fire if the same file is selected again.
			input.value = '';
		});
		this.nodeWebkitGuiController = Get.app.getNodeWebkitGuiController();
	},
	
	// TODO: project load/save error handling

	load: function(project) {
		if (this.project) {
			var viewModel = this.getViewModel();
			this.fireEvent('projectUnload');
			viewModel.set('project', null);
			viewModel.notify();
			this.project.getProxy().closeDatabase();
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
		this.nodeWebkitGuiController.openWindow();
	},

	onOpenMenuItem: function() {
		this.checkForUnsavedChanges(function() {
			Ext.get('openFileDialog').dom.click();
		});
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
			shell = require('shelljs'),
			currentFilename = me.project.get('filename'),
			filename = file.path,
			save = function() {
				me.project.set('filename', filename);
				me.save();
			},
			duplicate = function() {
				if (currentFilename) {
					me.project.getProxy().closeDatabase(function() {
						if (filename !== currentFilename) {
							shell.cp(currentFilename, filename);
						}
						save();
					});
				}
				else {
					save();
				}
			};

		if (!Ext.String.endsWith(filename, '.get', true)) {
			filename += '.get';
		}

		if (fs.existsSync(filename)) {
			// TODO: Übernimmt Chrome in Windows auch die Überprüfung auf existierende Datei?
			Ext.Msg.show({
				message: '"' + path.basename(filename) + '" existiert bereits. Soll die Datei ersetzt werden?',
				buttons: Ext.Msg.OKCANCEL,
				buttonText: {
					ok: 'Ersetzen',
					cancel: 'Abbrechen'
				},
				icon: Ext.Msg.WARNING,
				fn: function(choice) {
					if (choice == 'ok') {
						if (filename !== currentFilename) {
							shell.rm(filename);
						}
						duplicate();
					}
				}
			});
			Ext.Msg.down('button#ok').addCls('btn-ok');
			Ext.Msg.down('toolbar').setLayout({pack: 'end'});
		}
		else {
			duplicate();
		}
	},

	onCloseMenuItem: function() {
		this.checkForUnsavedChanges(function() {
			this.nodeWebkitGuiController.closeWindow();
		}, this);
	},

	unsavedChangesDialog: function(handler) {
		Ext.Msg.show({
			message: 'Änderungen in "' + this.project.get('name') + '" speichern?',
			buttons: Ext.Msg.YESNOCANCEL,
			buttonText: {
				yes: 'Speichern',
				no: 'Verwerfen',
				cancel: 'Abbrechen'
			},
			icon: Ext.Msg.WARNING,
			minWidth: 350,
			fn: function(choice) {
				if (choice == 'yes') {
					handler.save();
				}
				else if (choice == 'no') {
					handler.discard();
				}
			}
		});
		Ext.Msg.down('button#yes').addCls('btn-ok');
		Ext.Msg.down('toolbar').setLayout({pack: 'end'});
	},

	checkForUnsavedChanges: function(callback, scope) {
		var me = this;
		if (this.project.get('isModified')) {
			Ext.Msg.show({
				message: 'Änderungen in "' + this.project.get('name') + '" speichern?',
				buttons: Ext.Msg.YESNOCANCEL,
				buttonText: {
					yes: 'Speichern',
					no: 'Verwerfen',
					cancel: 'Abbrechen'
				},
				icon: Ext.Msg.WARNING,
				minWidth: 350,
				fn: function(choice) {
					if (choice == 'yes') {
						me.onSaveMenuItem();
					}
					else if (choice == 'no') {
						Ext.callback(callback, scope);
					}
				}
			});
			Ext.Msg.down('button#yes').addCls('btn-ok');
			Ext.Msg.down('toolbar').setLayout({pack: 'end'});
		}
		else {
			Ext.callback(callback, scope);
		}
	}

});
