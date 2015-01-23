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
				'#menubar': {
					newMenuItem: 'onNewMenuItem',
					openMenuItem: 'onOpenMenuItem',
					recentProjectsMenuItem: 'onRecentProjectsMenuItem',
					saveMenuItem: 'onSaveMenuItem',
					saveAsMenuItem: 'onSaveAsMenuItem',
					closeMenuItem: 'onCloseMenuItem',
				},
			},
		}
	},

	routes: {
		'project/:filename': {
			action: 'onOpenFileDialog',
			conditions: {
				':filename': '(.+)'
			}
		}
	},

	project: null,
	win: null,
	projectManager: null,
	isDialogVisible: false,
	openFileDialogInputEl: null,
	saveFileDialogInputEl: null,

	init: function() {
		var me = this,
			gui = require('nw.gui');

		this.win = gui.Window.get();
		this.projectManager = require('projectmanager');

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
	},
	
	load: function(project) {
		if (this.project) {
			var viewModel = this.getViewModel();
			this.fireEvent('projectUnload');
			viewModel.set('project', null);
			viewModel.notify();
			this.projectManager.projectClosed(this.project.get('filename'));
			this.project.destroy();
			this.project = null;
		}
		project.load(this.onLoad, this);
	},
	
	onLoad: function(project, error) {
		var view = this.getView(),
			viewModel = this.getViewModel();
		
		if (error) {
			this.showErrorMessage('"' + project.get('filename') + '" konnte nicht geladen werden.', error);
			project.destroy();
			project = Ext.create('Get.model.Project');
			this.load(project);
			return;
		}

		project.waypointStore.setStoreId('waypoints');
		Ext.data.StoreManager.register(project.waypointStore);
		
		view.setSession(project.session);
		viewModel.setSession(project.session);
		viewModel.set('project', project);
		viewModel.notify();
		this.project = project;
		this.fireEvent('projectLoad');
		this.projectManager.projectOpened(project.get('filename'), this.win);
		Ext.state.Manager.set('recentProjects', this.projectManager.getRecentProjects());
	},
	
	save: function() {
		this.project.save(this.onSave, this);
	},

	onSave: function(project, error) {
		if (error) {
			this.showErrorMessage('"' + project.get('filename') + '" konnte nicht gespeichert werden.', error);
		}
		this.projectManager.projectOpened(project.get('filename'), this.win);
		Ext.state.Manager.set('recentProjects', this.projectManager.getRecentProjects());
	},

	showErrorMessage: function(message, error) {
		Ext.Array.from(error).forEach(function(e) {
			message += '<br>' + e;
		});
		Ext.Msg.show({
			title: 'Error',
			icon: Ext.Msg.ERROR,
			buttons: Ext.Msg.OK,
			message: message
		});
		Ext.Msg.down('toolbar').setLayout({pack: 'center'});
	},

	onFileInputElChange: function(e) {
		var input = e.target,
			files = input.files;

		this.onDialogHide();

		if (files.length) {
			// onOpenFileDialog or onSaveFileDialog
			this['on' + Ext.String.capitalize(input.id)](files[0].path);
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
	
	onNewMenuItem: function(filename) {
		var href = window.location.origin + window.location.pathname + (filename ? '#project/' + filename : ''),
			gui = require('nw.gui'),
			win = gui.Window.open(href, {
				focus: true,
				toolbar: false
			});
		this.fireEvent('new', win);
	},

	onRecentProjectsMenuItem: function(filename) {
		var project;

		if (this.projectManager.isOpen(filename)) {
			this.projectManager.getProjectWindow(filename).focus();
		}
		else if (this.project && (this.project.get('isModified') || this.project.get('filename'))) {
			this.onNewMenuItem(filename);
		}
		else {
			if (this.isDialogVisible) {
				return;
			}
			project = Ext.create('Get.model.Project', {
				filename: filename
			});
			this.load(project);
		}
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
	onOpenFileDialog: function(filename) {
		var project,
			win;

		if (this.projectManager.isOpen(filename)) {
			win = this.projectManager.getProjectWindow(filename);
			win.focus();
		}
		else {
			project = Ext.create('Get.model.Project', {
				filename: filename
			});
			this.load(project);
		}
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
			this.onSaveAsMenuItem();
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
	onSaveFileDialog: function(filename) {
		var me = this,
			fs = require('fs'),
			path = require('path'),
			shell = require('shelljs'),
			currentFilename = me.project.get('filename'),
			save = function() {
				me.project.set('filename', filename);
				me.save();
			},
			duplicate = function() {
				if (currentFilename && filename !== currentFilename) {
					// SaveAs: copy the currently open file to the new location. If the new filename and
					// the current one are the same, then do not copy and handle it as a regular save.
					me.projectManager.projectClosed(currentFilename);
					me.project.getProxy().closeDatabase(function() {
						shell.cp(currentFilename, filename);
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
			if (this.projectManager.isOpen(filename)) {
				this.showErrorMessage('Speichern nicht möglich. ' + 
					'Die Datei "' + filename + '" ist bereits in einem anderen Fenster geöffnet.');
				return;
			}
			// SaveAs: remove an existing file 
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
			this.projectManager.projectClosed(this.project.get('filename'));
			this.fireEvent('close');
			this.win.close(true);
		}, this);
	},

	checkForUnsavedChanges: function(callback, scope) {
		var me = this;
		if (this.project.get('isModified')) {
			this.win.focus();
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
