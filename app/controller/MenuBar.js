Ext.define('Get.controller.MenuBar', {
	extend: 'Ext.app.Controller',

	id: 'menubar', 

	config: {
		listen: {
			controller: {
				'#main': {
					'new': 'onNew',
					'close': 'onClose',
					'dialogVisibleChanged': 'onFileDialogVisibleChanged'
				},
				'#undomanager': {
					'canUndoChanged': 'onCanUndoChanged',
					'canRedoChanged': 'onCanRedoChanged',
				}
			},
			component: {
				'edit\\.waypoint': {
					show: {
						fn: 'onEditWindowVisibleChanged',
						args: [true]
					},
					hide: {
						fn: 'onEditWindowVisibleChanged',
						args: [false]
					}
				},
			}
		}
	},

	gui: null,
	win: null,
	menuBarManager: null,
	projectManager: null,
	recentProjectsChangedHandler: null,

	saveMenu: null,
	recentFilesMenu: null,
	editMenu: null,
	undoMenuItem: null,
	redoMenuItem: null,
	canUndo: false,
	canRedo: false,
	openEditWindowCount: 0,

	init: function() {
		this.gui = require('nw.gui');
		this.win = this.gui.Window.get();

		this.win.on('close', Ext.GlobalEvents.fireEvent.bind(Ext.GlobalEvents, 'closeMenuItem'));

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
			me.saveMenu.enabled = isModified;
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
			fireEvent = isMac ? this.menuBarManager.fireControllerEvent : Ext.GlobalEvents.fireEvent,
			fireEventScope = isMac ? this.menuBarManager : Ext.GlobalEvents,
			menuBar,
			fileMenu,
			editMenu,
			debugMenu;

		menuBar = new gui.Menu({ type: "menubar" });
		if (isMac) {
			menuBar.createMacBuiltin("Get");
		}

		// File menu

		fileMenu = new gui.MenuItem({
			type: 'normal',
			label: 'Datei',
			submenu: new gui.Menu()
		});

		fileMenu.submenu.append(new gui.MenuItem({
			type: 'normal',
			label: 'Neues Fenster',
			key: 'n',
			modifiers: cmd,
			click: fireEvent.bind(fireEventScope, 'newMenuItem') 
		}));
		fileMenu.submenu.append(new gui.MenuItem({
			type: 'separator'
		}));
		fileMenu.submenu.append(new gui.MenuItem({
			type: 'normal',
			label: 'Öffnen …',
			key: 'o',
			modifiers: cmd,
			click: fireEvent.bind(fireEventScope, 'openMenuItem') 
		}));
		this.recentFilesMenu = new gui.MenuItem({
			type: 'normal',
			label: 'Zuletzt verwendet',
			submenu: new gui.Menu()
		});
		fileMenu.submenu.append(this.recentFilesMenu);
		fileMenu.submenu.append(new gui.MenuItem({
			type: 'separator'
		}));
		fileMenu.submenu.append(new gui.MenuItem({
			type: 'normal',
			label: 'Importiere Wegpunkte …',
			click: fireEvent.bind(fireEventScope, 'importWaypointsMenuItem') 
		}));
		fileMenu.submenu.append(new gui.MenuItem({
			type: 'normal',
			label: 'Importiere Bilder …',
			click: fireEvent.bind(fireEventScope, 'importPicturesMenuItem') 
		}));
		fileMenu.submenu.append(new gui.MenuItem({
			type: 'separator'
		}));
		fileMenu.submenu.append(new gui.MenuItem({
			type: 'normal',
			label: 'Schließen',
			key: 'w',
			modifiers: cmd,
			click: fireEvent.bind(fireEventScope, 'closeMenuItem') 
		}));
		this.saveMenu = new gui.MenuItem({
			type: 'normal',
			label: 'Speichern',
			key: 's',
			modifiers: cmd,
			click: fireEvent.bind(fireEventScope, 'saveMenuItem') 
		});
		fileMenu.submenu.append(this.saveMenu);
		fileMenu.submenu.append(new gui.MenuItem({
			type: 'normal',
			label: 'Speichern als …',
			key: 's',
			modifiers: 'shift-' + cmd,
			click: fireEvent.bind(fireEventScope, 'saveAsMenuItem') 
		}));

		if (isMac) {
			menuBar.insert(fileMenu, 1);
		}
		else {
			menuBar.append(fileMenu);
		}

		// Edit menu

		if (isMac) {
			this.editMenu = menuBar.items[2];
		}
		else {
			this.editMenu = new gui.MenuItem({
				type: 'normal',
				label: 'Bearbeiten',
				submenu: new gui.Menu()
			});
			this.editMenu.submenu.append(new gui.MenuItem({
				type: 'normal',
				label: 'Rückgängig',
				key: 'z',
				modifiers: cmd,
				click: fireEvent.bind(fireEventScope, 'undoMenuItem') 
			}));
			this.editMenu.submenu.append(new gui.MenuItem({
				type: 'normal',
				label: 'Wiederholen',
				key: 'z',
				modifiers: 'shift-' + cmd,
				click: fireEvent.bind(fireEventScope, 'redoMenuItem') 
			}));
			menuBar.append(this.editMenu);
		}
		this.undoMenuItem = this.editMenu.submenu.items[0];
		this.redoMenuItem = this.editMenu.submenu.items[1];
		this.updateUndoRedoMenuItems();

		// Debug menu

		debugMenu = new this.gui.MenuItem({
			type: 'normal',
			label: this.win.id,
			submenu: new this.gui.Menu()
		});

		debugMenu.submenu.append(new gui.MenuItem({
			type: 'normal',
			label: 'ReloadDev',
			key: 'r',
			modifiers: cmd,
			click: function() {
				win.reloadDev();
			}
		}));
		debugMenu.submenu.append(new gui.MenuItem({
			type: 'normal',
			label: 'Reload',
			key: 'r',
			modifiers: 'shift-' + cmd,
			click: function() {
				win.reload();
			}
		}));
		debugMenu.submenu.append(new gui.MenuItem({
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
		menuBar.append(debugMenu);

		return menuBar;
	},

	updateUndoRedoMenuItems: function(dialogVisible) {
		var gui = this.gui,
			isMac = process.platform === 'darwin',
			cmd = isMac ? 'cmd' : 'ctrl',
			fireEvent = isMac ? this.menuBarManager.fireControllerEvent : Ext.GlobalEvents.fireEvent,
			fireEventScope = isMac ? this.menuBarManager : Ext.GlobalEvents;

		if (dialogVisible) {
			if (isMac) {
				this.editMenu.submenu.remove(this.undoMenuItem);
				this.editMenu.submenu.remove(this.redoMenuItem);
				this.undoMenuItem = new gui.MenuItem({
					label: 'Rückgängig',
					key: 'z',
					modifiers: cmd,
					selector: 'undo:'
				});
				this.redoMenuItem = new gui.MenuItem({
					label: 'Wiederholen',
					key: 'z',
					modifiers: 'shift-' + cmd,
					selector: 'redo:'
				});
				this.editMenu.submenu.insert(this.undoMenuItem, 0);
				this.editMenu.submenu.insert(this.redoMenuItem, 1);
			}
			else {
				this.undoMenuItem.enabled = false;
				this.redoMenuItem.enabled = false;
			}
		}
		else {
			if (isMac && this.undoMenuItem && this.redoMenuItem) {
				this.editMenu.submenu.remove(this.undoMenuItem);
				this.editMenu.submenu.remove(this.redoMenuItem);
				this.undoMenuItem = new gui.MenuItem({
					type: 'normal',
					label: 'Rückgängig',
					key: 'z',
					modifiers: cmd,
					click: fireEvent.bind(fireEventScope, 'undoMenuItem') 
				});
				this.redoMenuItem = new gui.MenuItem({
					type: 'normal',
					label: 'Wiederholen',
					key: 'z',
					modifiers: 'shift-' + cmd,
					click: fireEvent.bind(fireEventScope, 'redoMenuItem') 
				});
				this.editMenu.submenu.insert(this.undoMenuItem, 0);
				this.editMenu.submenu.insert(this.redoMenuItem, 1);
			}
			this.undoMenuItem.enabled = this.canUndo;
			this.redoMenuItem.enabled = this.canRedo;
		}
	},

	onRecentProjectsChanged: function(recentProjects) {
		var me = this,
			gui = this.gui,
			path = require('path'),
			isMac = process.platform === 'darwin',
			fireEvent = isMac ? this.menuBarManager.fireControllerEvent : Ext.GlobalEvents.fireEvent,
			fireEventScope = isMac ? this.menuBarManager : Ext.GlobalEvents,
			menu,
			menuBar;

		if (isMac) {
			menu = new gui.Menu();
		}
		else {
			// build a whole new menu bar because setting a new submenu of a menu item 
			// does not work on windows
			menuBar = this.buildMenuBar();
			menu = this.recentFilesMenu.submenu;
		}

		recentProjects.forEach(function(filename) {
			menu.append(new gui.MenuItem({
				type: 'normal',
				label: path.basename(filename),
				click: fireEvent.bind(fireEventScope, 'recentProjectsMenuItem', filename)
			}));
		});

		if (isMac) {
			this.recentFilesMenu.submenu = menu;
		}
		else {
			this.win.menu = menuBar;
		}
	},

	onNew: function(win) {
		if (process.platform === 'darwin') {
			this.menuBarManager.register(win);
		}
	},

	onCanUndoChanged: function(canUndo) {
		this.canUndo = canUndo;
		this.undoMenuItem.enabled = canUndo;
	},

	onCanRedoChanged: function(canRedo) {
		this.canRedo = canRedo;
		this.redoMenuItem.enabled = canRedo;
	},

	onFileDialogVisibleChanged: function(visible) {
		// TODO: enable/disable file menu items
		this.updateUndoRedoMenuItems(visible);
	},

	onEditWindowVisibleChanged: function(visible) {
		this.openEditWindowCount += (visible ? 1 : -1);
		if (this.openEditWindowCount === 0 || this.openEditWindowCount === 1 && visible) {
			// only if last window closed or first window opened
			this.updateUndoRedoMenuItems(this.openEditWindowCount > 0);
		}
	},

});
