Ext.define('Get.controller.NodeWebkitGui', {
	extend: 'Ext.app.Controller',

	id: 'nodewebkitgui', 

	gui: null,
	win: null,

	init: function() {
		this.gui = require('nw.gui');
		this.win = this.gui.Window.get();

		this.focusedWindowManager = require('./app/controller/windowfocusmanager.js');
		this.focusedWindowManager.register(this.win, this.buildMenuBar());
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
			fwm = this.focusedWindowManager,
			cmd = process.platform === 'darwin' ? 'cmd' : 'ctrl',
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
			click: fwm.fireControllerEvent.bind(fwm, 'newMenuItem') 
		}));
		fileMenuItem.submenu.append(new gui.MenuItem({
			type: 'separator'
		}));
		fileMenuItem.submenu.append(new gui.MenuItem({
			type: 'normal',
			label: 'Öffnen …',
			key: 'o',
			modifiers: cmd,
			click: fwm.fireControllerEvent.bind(fwm, 'openMenuItem') 
		}));
		fileMenuItem.submenu.append(new gui.MenuItem({
			type: 'normal',
			label: 'Speichern',
			key: 's',
			modifiers: cmd,
			click: fwm.fireControllerEvent.bind(fwm, 'saveMenuItem') 
		}));
		fileMenuItem.submenu.append(new gui.MenuItem({
			type: 'normal',
			label: 'Speichern als …',
			key: 's',
			modifiers: 'shift-' +cmd,
			click: fwm.fireControllerEvent.bind(fwm, 'saveAsMenuItem') 
		}));
		fileMenuItem.submenu.append(new gui.MenuItem({
			type: 'separator'
		}));
		fileMenuItem.submenu.append(new gui.MenuItem({
			type: 'normal',
			label: 'Schließen',
			key: 'w',
			modifiers: cmd,
			click: fwm.fireControllerEvent.bind(fwm, 'closeMenuItem') 
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
			label: 'ShowDevTools',
			key: 'i',
			modifiers: 'alt-' + cmd,
			click: function() {
				win.showDevTools();
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
		this.focusedWindowManager.register(win);
	},

	closeWindow: function() {
		this.focusedWindowManager.close(this.win);
	},

	focusWindow: function() {
		this.focusedWindowManager.focus(this.win);
	},

	focusedWindowManager: {
		windows: null,
		lastFocused: null,

		init: function() {
			if (!global.focusedWindowManager) {
				global.focusedWindowManager = {
					windows: {},
					lastFocused: []
				};
			}
			this.windows = global.focusedWindowManager.windows;
			this.lastFocused = global.focusedWindowManager.lastFocused;
		},

		register: function(win, menuBar) {
			var me = this,
				handler;

			this.init();
			if (this.windows[win.id]) {
				return;
			}

			handler = {
				onFocus: this.onFocus.bind(this, win),
				onClose: this.onClose.bind(this, win)
			};
			if (process.platform === 'darwin') {
				win.on('focus', handler.onFocus);
			}
			win.on('close', handler.onClose);

			win.menu = menuBar;

			win.window.addEventListener('unload', function() {
				console.log('unload');
				me.unregister(win);
			});

			this.windows[win.id] = {
				win: win,
				handler: handler,
				menuBar: menuBar
			};
			if (process.platform === 'darwin') {
				this.setFocused(win);
			}
		},

		unregister: function(win) {
			console.log('unregister');
			var handler = this.windows[win.id].handler;
			if (process.platform === 'darwin') {
				win.removeListener('focus', handler.onFocus);
			}
			win.removeListener('close', handler.onClose);
			// win.menu = null;
			delete this.windows[win.id];

			if (process.platform === 'darwin') {
				this.lastFocused.splice(this.lastFocused.indexOf(win), 1);
				if (this.lastFocused.length) {
					// this.setFocused(this.lastFocused[0]);
				}
			}
		},

		setFocused: function(win) {
			var index;

			if (win != this.lastFocused[0]) {
				index = this.lastFocused.indexOf(win);
				if (index >= 0) {
					this.lastFocused.splice(index, 1);
				}
				this.lastFocused.unshift(win);
				if (process.platform === 'darwin') {
					this.setMenuBar(win);
				}
				console.log('setFocused', this.lastFocused.map(function(win) {return win.id;}));
			}
		},

		setMenuBar: function(win) {
			var menuBar = this.windows[win.id].menuBar;
			win.menu = menuBar;
			console.log('setMenuBar', this.lastFocused.map(function(win) {return win.id;}));
		},

		onFocus: function(win) {
			console.log('onFocus');
			this.setFocused(win);
		},

		onClose: function(win) {
			console.log('onClose');
			win.window.Get.app.getController('NodeWebkitGui', true).fireEvent('closeMenuItem');
		},

		close: function(win) {
			console.log('close');
			this.unregister(win);
			win.close();
		},

		focus: function(win) {
			console.log('focus');
			win.focus();
		},

		fireControllerEvent: function(e) {
			this.lastFocused[0].window.Get.app.getController('NodeWebkitGui', true).fireEvent(e);
		}

	}

});
