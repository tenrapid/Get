Ext.define('Get.controller.NodeWebkitGui', {
	extend: 'Ext.app.Controller',

	id: 'nodewebkitgui', 

	gui: null,
	win: null,
	menuBarManager: null,

	init: function() {
		var nodeMoulePath = '';

		this.gui = require('nw.gui');
		this.win = this.gui.Window.get();

		this.win.on('close', this.fireEvent.bind(this, 'closeMenuItem'));

		if (process.platform === 'darwin') {
			//<debug>
				nodeMoulePath = './app/controller/';
			//</debug>
			this.menuBarManager = require(nodeMoulePath + 'menubarmanager.js');
			// this.menuBarManager.register(this.win, this.buildMenuBar());
			var menuBar = this.buildMenuBar();
			menuBar.append(new this.gui.MenuItem({
				type: 'normal',
				label: this.win.id,
				submenu: new this.gui.Menu()
			}));
			this.menuBarManager.register(this.win, menuBar);
		}
		else {
			this.win.menu = this.buildMenuBar();
		}
	},

	onLaunch: function() {
		var win = this.win,
			viewModel = Get.app.getMainView().getViewModel();

		viewModel.bind('{windowTitle}', function(val) {
			win.title = val;
		});
	},

	buildMenuBar: function() {
		var gui = this.gui,
			win = this.win,
			isMac = process.platform === 'darwin',
			cmd = isMac ? 'cmd' : 'ctrl',
			fireEvent = isMac ? this.menuBarManager.fireControllerEvent : this.fireEvent,
			fireEventScope = isMac ? this.menuBarManager : this,
			menuBar,
			fileMenuItem;

		menuBar = new gui.Menu({ type: "menubar" });
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
			type: 'separator'
		}));
		fileMenuItem.submenu.append(new gui.MenuItem({
			type: 'normal',
			label: 'Öffnen …',
			key: 'o',
			modifiers: cmd,
			click: fireEvent.bind(fireEventScope, 'openMenuItem') 
		}));
		fileMenuItem.submenu.append(new gui.MenuItem({
			type: 'normal',
			label: 'Speichern',
			key: 's',
			modifiers: cmd,
			click: fireEvent.bind(fireEventScope, 'saveMenuItem') 
		}));
		fileMenuItem.submenu.append(new gui.MenuItem({
			type: 'normal',
			label: 'Speichern als …',
			key: 's',
			modifiers: 'shift-' +cmd,
			click: fireEvent.bind(fireEventScope, 'saveAsMenuItem') 
		}));
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
		fileMenuItem.submenu.append(new gui.MenuItem({
			type: 'separator'
		}));
		fileMenuItem.submenu.append(new gui.MenuItem({
			type: 'normal',
			label: 'ReloadDev',
			key: 'r',
			modifiers: cmd,
			click: function() {
				win.reloadDev();
			}
		}));
		fileMenuItem.submenu.append(new gui.MenuItem({
			type: 'normal',
			label: 'Reload',
			key: 'r',
			modifiers: 'shift' + cmd,
			click: function() {
				win.reload();
			}
		}));
		fileMenuItem.submenu.append(new gui.MenuItem({
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

		if (process.platform === 'darwin') {
			menuBar.createMacBuiltin("Get");
		}
		menuBar.insert(fileMenuItem, 1);
		return menuBar;
	},

	openWindow: function() {
		var win = this.gui.Window.open(window.location.href, {
			focus: true,
			toolbar: false
		});
		if (process.platform === 'darwin') {
			this.menuBarManager.register(win);
		}
	},

	closeWindow: function() {
		this.win.close(true);
	},

	focusWindow: function() {
		this.win.focus();
	},

});
