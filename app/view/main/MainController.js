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
	isDialogVisible: false,
	openFileDialogInputEl: null,
	saveFileDialogInputEl: null,

	init: function() {
		var me = this;
		['openFileDialog', 'saveFileDialog'].forEach(function(elementId) {
			var input = Ext.get(elementId).dom;
			input.files.append(new File('', ''));
			input.addEventListener('change', me.onFileInputElChange.bind(me));
			input.addEventListener('click', me.onDialogShow.bind(me));
			// openFileDialogInputEl, saveFileDialogInputEl, ...
			me[elementId + 'InputEl'] = input;
		});

		Ext.Msg.on({
			show: this.onDialogShow,
			hide: this.onDialogHide,
			scope: this
		});

		this.nodeWebkitGuiController = Get.app.getNodeWebkitGuiController();
	},
	
	// TODO: project load/save error handling
	// TODO: don't allow overwriting of files that are open in another window
	// TODO: investigate store listeners of sqlite proxy

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

	onFileInputElChange: function(e) {
		var input = e.target,
			files = input.files;

		this.onDialogHide();

		if (files.length) {
			// onOpenFileDialog or onSaveFileDialog
			this['on' + Ext.String.capitalize(input.id)](files[0]);
		}

		// Reset so that the change event can fire if the same file is selected again.
		input.files.clear();
		// Append unnamed file so that the change event fires if the file dialog is canceled.
		input.files.append(new File('', ''));
	},

	onDialogShow: function() {
		this.isDialogVisible = true;
	},
	
	onDialogHide: function() {
		this.isDialogVisible = false;
	},
	
	onNewMenuItem: function() {
		this.nodeWebkitGuiController.openWindow();
	},

	onOpenMenuItem: function() {
		var me = this;

		if (this.isDialogVisible) {
			return;
		}
		this.checkForUnsavedChanges(function() {
			me.openFileDialogInputEl.click();
		});
	},
	onOpenFileDialog: function(file) {
		var project = Ext.create('Get.model.Project', {
			filename: file.path
		});
		this.load(project);
	},

	onSaveMenuItem: function() {
		var filename = this.project.get('filename');

		if (this.isDialogVisible) {
			return;
		}
		if (filename) {
			this.save();
		}
		else {
			this.onSaveAsMenuItem()
		}
	},
	onSaveAsMenuItem: function() {
		var input = this.saveFileDialogInputEl,
			path = require('path'),
			filename = this.project.get('filename'),
			name = filename ? path.basename(filename) : (this.project.get('name') + '.get');

		if (this.isDialogVisible) {
			return;
		}
		input.files.clear();
		input.files.append(new File(name, ''));
		if (filename) {
			input.setAttribute('nwworkingdir', path.dirname(filename));
		}
		input.click();
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

		if (fs.existsSync(filename) && filename !== currentFilename) {
			// TODO: Übernimmt Chrome in Windows auch die Überprüfung auf existierende Datei?
			shell.rm(filename);
		}
		duplicate();

		// if (fs.existsSync(filename)) {
		// 	Ext.Msg.show({
		// 		message: '"' + path.basename(filename) + '" existiert bereits. Soll die Datei ersetzt werden?',
		// 		buttons: Ext.Msg.OKCANCEL,
		// 		buttonText: {
		// 			ok: 'Ersetzen',
		// 			cancel: 'Abbrechen'
		// 		},
		// 		icon: Ext.Msg.WARNING,
		// 		fn: function(choice) {
		// 			if (choice == 'ok') {
		// 				if (filename !== currentFilename) {
		// 					shell.rm(filename);
		// 				}
		// 				duplicate();
		// 			}
		// 		}
		// 	});
		// 	Ext.Msg.down('button#ok').addCls('btn-ok');
		// 	Ext.Msg.down('toolbar').setLayout({pack: 'end'});
		// }
		// else {
		// 	duplicate();
		// }
	},

	onCloseMenuItem: function() {
		if (this.isDialogVisible) {
			return;
		}
		this.checkForUnsavedChanges(function() {
			this.nodeWebkitGuiController.closeWindow();
		}, this);
	},

	checkForUnsavedChanges: function(callback, scope) {
		var me = this;
		if (this.project.get('isModified')) {
			this.nodeWebkitGuiController.focusWindow();
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
