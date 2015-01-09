Ext.define('Get.controller.NodeWebkitGui', function() {
	var gui = require('nw.gui'),
		win = gui.Window.get(),
		fwm,
		focusedWindowManager,
		menuBar,
		fileMenuItem;

	// menuBar

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
		click: function() {
			focusedWindowManager.fireControllerEvent('newMenuItem');
		}
	}));
	fileMenuItem.submenu.append(new gui.MenuItem({
		type: 'separator'
	}));
	fileMenuItem.submenu.append(new gui.MenuItem({
		type: 'normal',
		label: 'Öffnen …',
		key: 'o',
		click: function() {
			focusedWindowManager.fireControllerEvent('openMenuItem');
		}
	}));
	fileMenuItem.submenu.append(new gui.MenuItem({
		type: 'normal',
		label: 'Speichern',
		key: 's',
		click: function() {
			focusedWindowManager.fireControllerEvent('saveMenuItem');
		}
	}));
	fileMenuItem.submenu.append(new gui.MenuItem({
		type: 'normal',
		label: 'Speichern als …',
		key: 'S',
		modifier: 'shift',
		click: function() {
			focusedWindowManager.fireControllerEvent('saveAsMenuItem');
		}
	}));
	fileMenuItem.submenu.append(new gui.MenuItem({
		type: 'separator'
	}));
	fileMenuItem.submenu.append(new gui.MenuItem({
		type: 'normal',
		label: 'Schließen',
		key: 'w',
		click: function() {
			focusedWindowManager.fireControllerEvent('closeMenuItem');
		}
	}));

	menuBar.createMacBuiltin("Get");
	menuBar.insert(fileMenuItem, 1);

	// focusedWindowManager

	if (!global.focusedWindowManager) {
		global.focusedWindowManager = {
			windows: {},
			focused: null,
			lastFocused: [],
		};
	}
	fwm = global.focusedWindowManager;

	focusedWindowManager = {
		register: function(win) {
			var me = this,
				handler;

			if (!(win.id in fwm.windows)) {
				handler = {
					focus: function() {
						if (win.id in fwm.windows) {
							me.setFocused(win);
						}
					},
					close: function() {
						if (win != fwm.focused) {
							win.focus();
						}
						win.window.Get.app.getController('NodeWebkitGui', true).fireEvent('closeMenuItem');
					}
				};
				win.on('focus', handler.focus);
				win.on('close', handler.close);
				fwm.windows[win.id] = {
					win: win,
					handler: handler,
				};
				this.setFocused(win);
			}
		},
		setFocused: function(win) {
			var index;
			if (win != fwm.focused) {
				index = fwm.lastFocused.indexOf(win);
				if (index >= 0) {
					fwm.lastFocused.splice(index, 1);
				}
				if (fwm.focused) {
					fwm.lastFocused.unshift(fwm.focused);
				}
				fwm.focused = win;
				if (process.platform === 'darwin') {
					win.menu = menuBar;
				}
				console.log('setFocused', fwm.focused.id, fwm.lastFocused.map(function(win) {return win.id;}));
			}
		},
		close: function(win) {
			var handler = fwm.windows[win.id].handler,
				lastFocused;
			win.removeListener('focus', handler.focus);
			win.removeListener('close', handler.close);
			delete fwm.windows[win.id];
			if (win == fwm.focused) {
				fwm.focused = null;
			}
			if (fwm.lastFocused.indexOf(win) >= 0) {
				fwm.lastFocused.splice(fwm.lastFocused.indexOf(win), 1);
			}
			if (fwm.lastFocused.length) {
				lastFocused = fwm.lastFocused[0];
				lastFocused.focus();
			}
			win.close();
		},
		fireControllerEvent: function(e) {
			fwm.focused.window.Get.app.getController('NodeWebkitGui', true).fireEvent(e);
		}
	};
	focusedWindowManager.register(win);

	return {
		extend: 'Ext.app.Controller',

		id: 'nodewebkitgui', 

		init: function() {
			if (!win.menu && process.platform !== 'darwin') {
				win.menu = menuBar;
			}
		},

		onLaunch: function() {
			var viewModel = Get.app.getMainView().getViewModel();
			viewModel.bind('{windowTitle}', function(val) {
				win.title = val;
			});
		},

		openWindow: function() {
			gui.Window.open(window.location.href, {
				focus: true
			});
		},

		closeWindow: function() {
			focusedWindowManager.close(win);
		}
	};
});