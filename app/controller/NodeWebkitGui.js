Ext.define('Get.controller.NodeWebkitGui', function() {
	var gui = require('nw.gui'),
		win = gui.Window.get();

	return {
		extend: 'Ext.app.Controller',

		id: 'nodewebkitgui', 

		init: function() {
			var me = this,
				menuBar,
				fileMenuItem;

			if (!win.menu) {
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
						window.Get.app.getController('NodeWebkitGui', true).fireEvent('newMenuItem');
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
						window.Get.app.getController('NodeWebkitGui', true).fireEvent('openMenuItem');
					}
				}));
				fileMenuItem.submenu.append(new gui.MenuItem({
					type: 'normal',
					label: 'Speichern',
					key: 's',
					// modifier: 'cmd',
					click: function() {
						window.Get.app.getController('NodeWebkitGui', true).fireEvent('saveMenuItem');
					}
				}));
				fileMenuItem.submenu.append(new gui.MenuItem({
					type: 'normal',
					label: 'Speichern als …',
					key: 'S',
					modifier: 'shift',
					click: function() {
						window.Get.app.getController('NodeWebkitGui', true).fireEvent('saveAsMenuItem');
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
						window.Get.app.getController('NodeWebkitGui', true).fireEvent('closeMenuItem');
					}
				}));

				menuBar.createMacBuiltin("Get");
				menuBar.insert(fileMenuItem, 1);

				win.menu = menuBar;
			}
		},

		onLaunch: function() {
			var viewModel = Get.app.getMainView().getViewModel();
			viewModel.bind('{windowTitle}', function(val) {
				win.title = val;
			});
		}	
	};
});