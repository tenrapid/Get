Ext.define('Get.view.main.MainController', {
	extend: 'Ext.app.ViewController',
	alias: 'controller.main',

	requires: [
		'Get.project.Project',
		'Get.view.FileDialog'
	],

	id: 'main', 

	config: {
		listen: {
			global: {
				newMenuItem: 'onNewMenuItem',
				openMenuItem: 'onOpenMenuItem',
				recentProjectsMenuItem: 'onRecentProjectsMenuItem',
				saveMenuItem: 'onSaveMenuItem',
				saveAsMenuItem: 'onSaveAsMenuItem',
				closeMenuItem: 'onCloseMenuItem',
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

	init: function() {
		var me = this,
			gui = require('nw.gui');

		this.win = gui.Window.get();
		this.projectManager = require('projectmanager');

		Ext.Msg.on({
			show: this.onDialogShow,
			hide: this.onDialogHide,
			scope: this
		});
		Get.FileDialog.on({
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
			this.project.close(function() {
				this.project.destroy();
				this.project = null;
				project.load(this.onLoad, this);
			}, this);
		}
		else {
			project.load(this.onLoad, this);
		}
	},
	
	onLoad: function(project, error) {
		var view = this.getView(),
			viewModel = this.getViewModel();
		
		if (error) {
			this.showErrorMessage('"' + project.get('filename') + '" konnte nicht geladen werden.', error);
			project.destroy();
			project = Ext.create('Get.project.Project');
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

	onDialogShow: function() {
		this.isDialogVisible = true;
		this.fireEvent('dialogVisibleChanged', this.isDialogVisible);
	},
	
	onDialogHide: function() {
		this.isDialogVisible = false;
		this.fireEvent('dialogVisibleChanged', this.isDialogVisible);
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
			project = Ext.create('Get.project.Project', {
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
			Get.FileDialog.show({
				accept: '.get',
				handler: me.onOpenFileDialog,
				scope: me
			});
		});
	},

	onOpenFileDialog: function(file) {
		var filename = Ext.isString(file) ? file : file.path,
			project,
			win;

		if (this.projectManager.isOpen(filename)) {
			win = this.projectManager.getProjectWindow(filename);
			win.focus();
		}
		else {
			project = Ext.create('Get.project.Project', {
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

		Get.FileDialog.show({
			saveAs: true,
			directory: filename ? path.dirname(filename) : undefined,
			file: name,
			handler: this.onSaveFileDialog,
			scope: this
		});
	},

	onSaveFileDialog: function(file) {
		var me = this,
			fs = require('fs'),
			shell = require('shelljs'),
			filename = file.path,
			currentFilename = me.project.get('filename'),
			save = function() {
				me.project.set('filename', filename);
				me.save();
			};

		if (!Ext.String.endsWith(filename, '.get', true)) {
			filename += '.get';
		}

		if (fs.existsSync(filename) && filename !== currentFilename) {
			// SaveAs: remove an existing file, but only if it is not open
			if (this.projectManager.isOpen(filename)) {
				this.showErrorMessage('Speichern nicht möglich. ' + 
					'Die Datei "' + filename + '" ist bereits in einem anderen Fenster geöffnet.');
				return;
			}
			shell.rm(filename);
		}

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
	},

	onCloseMenuItem: function() {
		if (this.isDialogVisible) {
			return;
		}
		this.checkForUnsavedChanges(function() {
			this.projectManager.projectClosed(this.project.get('filename'));
			this.fireEvent('close');
			this.project.close(function() {
				this.win.hide();
				this.project.destroy();
				this.win.close(true);
			}, this);
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
