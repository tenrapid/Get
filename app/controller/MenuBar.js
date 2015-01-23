Ext.define('Get.controller.MenuBar', {
	extend: 'Ext.app.Controller',

	id: 'menubar', 

	config: {
		listen: {
			controller: {
				'#main': {
					'new': 'onNew',
					'close': 'onClose',
				},
			},
		}
	},

	gui: null,
	win: null,
	menuBarManager: null,
	projectManager: null,
	recentProjectsChangedHandler: null,

	saveMenuItem: null,
	recentFilesMenuItem: null,

	init: function() {
		this.gui = require('nw.gui');
		this.win = this.gui.Window.get();

		this.win.on('close', this.fireEvent.bind(this, 'closeMenuItem'));

		if (process.platform === 'darwin') {
			this.menuBarManager = require('menubarmanager');
			this.menuBarManager.register(this.win, this.buildMenuBar());
		}
		else {
			this.win.menu = this.buildMenuBar();
		}

		this.recentProjectsChangedHandler = this.onRecentProjectsChanged.bind(this);
		this.projectManager = require('projectmanager');
		this.projectManager.setRecentProjects(Ext.state.Manager.get('recentProjects'));
		this.projectManager.on('recentProjectsChanged', this.recentProjectsChangedHandler);
		this.onRecentProjectsChanged(this.projectManager.getRecentProjects());
	},

	onLaunch: function() {
		var me = this,
			win = this.win,
			viewModel = this.getApplication().getMainView().getViewModel();

		viewModel.bind('{windowTitle}', function(val) {
			win.title = val;
		});
		viewModel.bind('{project.isModified}', function(isModified) {
			me.saveMenuItem.enabled = isModified;
		});
	},

	onClose: function() {
		this.projectManager.removeListener('recentProjectsChanged', this.recentProjectsChangedHandler);
	},

	buildMenuBar: function() {
		var gui = this.gui,
			win = this.win,
			isMac = process.platform === 'darwin',
			cmd = isMac ? 'cmd' : 'ctrl',
			fireEvent = isMac ? this.menuBarManager.fireControllerEvent : this.fireEvent,
			fireEventScope = isMac ? this.menuBarManager : this,
			menuBar,
			fileMenuItem,
			debugMenuItem;

		menuBar = new gui.Menu({ type: "menubar" });

		// File menu

		fileMenuItem = new gui.MenuItem({
			type: 'normal',
			label: 'Datei',
			submenu: new gui.Menu()
		});

		fileMenuItem.submenu.append(new gui.MenuItem({
			type: 'normal',
			label: 'Neues Fenster',
			key: 'n',
			modifiers: cmd,
			click: fireEvent.bind(fireEventScope, 'newMenuItem') 
		}));
		fileMenuItem.submenu.append(new gui.MenuItem({
			type: 'normal',
			label: 'Öffnen …',
			key: 'o',
			modifiers: cmd,
			click: fireEvent.bind(fireEventScope, 'openMenuItem') 
		}));
		this.recentFilesMenuItem = new gui.MenuItem({
			type: 'normal',
			label: 'Zuletzt verwendet',
			submenu: new gui.Menu()
		});
		fileMenuItem.submenu.append(this.recentFilesMenuItem);
		fileMenuItem.submenu.append(new gui.MenuItem({
			type: 'separator'
		}));
		fileMenuItem.submenu.append(new gui.MenuItem({
			type: 'normal',
			label: 'Schließen',
			key: 'w',
			modifiers: cmd,
			click: fireEvent.bind(fireEventScope, 'closeMenuItem') 
		}));
		this.saveMenuItem = new gui.MenuItem({
			type: 'normal',
			label: 'Speichern',
			key: 's',
			modifiers: cmd,
			click: fireEvent.bind(fireEventScope, 'saveMenuItem') 
		});
		fileMenuItem.submenu.append(this.saveMenuItem);
		fileMenuItem.submenu.append(new gui.MenuItem({
			type: 'normal',
			label: 'Speichern als …',
			key: 's',
			modifiers: 'shift-' + cmd,
			click: fireEvent.bind(fireEventScope, 'saveAsMenuItem') 
		}));

		if (process.platform === 'darwin') {
			menuBar.createMacBuiltin("Get");
		}
		menuBar.insert(fileMenuItem, 1);

		// Debug menu

		debugMenuItem = new this.gui.MenuItem({
			type: 'normal',
			label: this.win.id,
			submenu: new this.gui.Menu()
		});

		debugMenuItem.submenu.append(new gui.MenuItem({
			type: 'normal',
			label: 'ReloadDev',
			key: 'r',
			modifiers: cmd,
			click: function() {
				win.reloadDev();
			}
		}));
		debugMenuItem.submenu.append(new gui.MenuItem({
			type: 'normal',
			label: 'Reload',
			key: 'r',
			modifiers: 'shift-' + cmd,
			click: function() {
				win.reload();
			}
		}));
		debugMenuItem.submenu.append(new gui.MenuItem({
			type: 'normal',
			label: 'ShowDevTools',
			key: 'i',
			modifiers: 'alt-' + cmd,
			click: function() {
				var devTools = win.showDevTools();
				devTools.width = 1024;
				devTools.height = 600;
			}
		}));
		menuBar.append(debugMenuItem);

		return menuBar;
	},

	onRecentProjectsChanged: function(recentProjects) {
		var me = this,
			gui = this.gui,
			menu = new gui.Menu(),
			path = require('path'),
			isMac = process.platform === 'darwin',
			fireEvent = isMac ? this.menuBarManager.fireControllerEvent : this.fireEvent,
			fireEventScope = isMac ? this.menuBarManager : this;

		recentProjects.forEach(function(filename) {
			menu.append(new gui.MenuItem({
				type: 'normal',
				label: path.basename(filename),
				click: fireEvent.bind(fireEventScope, 'recentProjectsMenuItem', filename)
			}));
		});
		this.recentFilesMenuItem.submenu = menu;
	},

	onNew: function(win) {
		if (process.platform === 'darwin') {
			this.menuBarManager.register(win);
		}
	}

});
