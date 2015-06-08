Ext.define('Get.controller.MenuBar', {
	extend: 'Ext.app.Controller',

	id: 'menubar', 

	config: {
		listen: {
			controller: {
				'#main': {
					newWindow: 'onNewWindow',
					windowClose: 'onWindowClose'
				},
				'#undomanager': {
					canUndoChanged: 'onCanUndoChanged',
					canRedoChanged: 'onCanRedoChanged',
				}
			},
			store: {
				'waypoint': {
					datachanged: 'onWaypointDataChanged'
				}
			},
			component: {
				'filedialog': {
					show: 'onComponentVisibilityChanged',
					hide: 'onComponentVisibilityChanged'
				},
				'window': {
					show: 'onComponentVisibilityChanged',
					hide: 'onComponentVisibilityChanged'
				},
				'editor': {
					show: 'onComponentVisibilityChanged',
					hide: 'onComponentVisibilityChanged'
				}
			}
		}
	},

	gui: null,
	win: null,
	menuBarManager: null,
	projectManager: null,
	recentProjectsChangedHandler: null,

	saveMenuItem: null,
	recentFilesMenu: null,
	editMenu: null,
	undoMenuItem: null,
	redoMenuItem: null,
	canUndo: false,
	canRedo: false,
	undoRedoSuspendCount: 0,

	init: function() {
		this.gui = require('nw.gui');
		this.win = this.gui.Window.get();

		this.win.on('close', this.onCloseWindowButton.bind(this));

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

	onNewWindow: function(win) {
		if (process.platform === 'darwin') {
			this.menuBarManager.register(win);
		}
	},

	onWindowClose: function() {
		this.projectManager.removeListener('recentProjectsChanged', this.recentProjectsChangedHandler);
	},

	buildMenuBar: function() {
		var me = this,
			gui = this.gui,
			win = this.win,
			isMac = process.platform === 'darwin',
			cmd = isMac ? 'cmd' : 'ctrl',
			fireEvent = isMac ? this.menuBarManager.fireControllerEvent : Ext.GlobalEvents.fireEvent,
			fireEventScope = isMac ? this.menuBarManager : Ext.GlobalEvents,
			menuBar,
			fileMenu,
			debugMenu;

		menuBar = new gui.Menu({ type: "menubar" });
		if (isMac) {
			menuBar.createMacBuiltin("Get");
		}

		/******************************

		 File menu
		
		*******************************/

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
		this.openMenuItem = new gui.MenuItem({
			type: 'normal',
			label: 'Öffnen …',
			key: 'o',
			modifiers: cmd,
			click: fireEvent.bind(fireEventScope, 'openMenuItem') 
		});
		fileMenu.submenu.append(this.openMenuItem);
		this.recentFilesMenu = new gui.MenuItem({
			type: 'normal',
			label: 'Zuletzt verwendet',
			submenu: new gui.Menu()
		});
		fileMenu.submenu.append(this.recentFilesMenu);
		fileMenu.submenu.append(new gui.MenuItem({
			type: 'separator'
		}));
		this.importMenu = new gui.MenuItem({
			type: 'normal',
			label: 'Import',
			submenu: new gui.Menu()
		});
		fileMenu.submenu.append(this.importMenu);
		this.importMenu.submenu.append(new gui.MenuItem({
			type: 'normal',
			label: 'Wegpunkte …',
			click: fireEvent.bind(fireEventScope, 'importWaypointsMenuItem') 
		}));
		this.importPicturesMenuItem = new gui.MenuItem({
			type: 'normal',
			label: 'Bilder …',
			click: fireEvent.bind(fireEventScope, 'importPicturesMenuItem') 
		});
		this.importMenu.submenu.append(this.importPicturesMenuItem);
		this.exportMenu = new gui.MenuItem({
			type: 'normal',
			label: 'Export',
			submenu: new gui.Menu()
		});
		fileMenu.submenu.append(this.exportMenu);
		fileMenu.submenu.append(new gui.MenuItem({
			type: 'separator'
		}));
		this.closeMenuItem = new gui.MenuItem({
			type: 'normal',
			label: 'Schließen',
			key: 'w',
			modifiers: cmd,
			click: fireEvent.bind(fireEventScope, 'closeMenuItem') 
		});
		fileMenu.submenu.append(this.closeMenuItem);
		this.saveMenuItem = new gui.MenuItem({
			type: 'normal',
			label: 'Speichern',
			key: 's',
			modifiers: cmd,
			click: fireEvent.bind(fireEventScope, 'saveMenuItem') 
		});
		fileMenu.submenu.append(this.saveMenuItem);
		this.saveAsMenuItem = new gui.MenuItem({
			type: 'normal',
			label: 'Speichern als …',
			key: 's',
			modifiers: 'shift-' + cmd,
			click: fireEvent.bind(fireEventScope, 'saveAsMenuItem') 
		});
		fileMenu.submenu.append(this.saveAsMenuItem);

		if (isMac) {
			menuBar.insert(fileMenu, 1);
		}
		else {
			menuBar.append(fileMenu);
		}

		/******************************

		 Edit menu
		
		*******************************/

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

		/******************************

		 Debug menu
		
		*******************************/

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
		debugMenu.submenu.append(new gui.MenuItem({
			type: 'normal',
			label: 'Create test data',
			key: 'y',
			modifiers: cmd,
			click: function() {
				var viewModel = me.getApplication().getMainView().getViewModel(),
					project = viewModel.get('project');

				project.undoManager.beginUndoGroup();
				project.createTestData();
				project.undoManager.endUndoGroup();
			}
		}));
		menuBar.append(debugMenu);

		return menuBar;
	},

	onCloseWindowButton: function() {
		if (this.closeMenuItem && this.closeMenuItem.enabled) {
			Ext.GlobalEvents.fireEvent('closeMenuItem');
		}
	},

	onComponentVisibilityChanged: function(component) {
		var visible = component.isVisible();

		if (component.isXType('messagebox') || component.isXType('filedialog')) {
			// disable most items in file menu if a message box or a file dialog is visible
			this.updateFileMenuItems(visible);
		}

		this.undoRedoSuspendCount += (visible ? 1 : -1);
		if (this.undoRedoSuspendCount === 0 || this.undoRedoSuspendCount === 1 && visible) {
			// only if last window closed or first window opened
			this.updateUndoRedoMenuItems(this.undoRedoSuspendCount > 0);
		}
	},

	updateUndoRedoMenuItems: function(suspend) {
		var gui = this.gui,
			isMac = process.platform === 'darwin',
			cmd = isMac ? 'cmd' : 'ctrl',
			fireEvent = isMac ? this.menuBarManager.fireControllerEvent : Ext.GlobalEvents.fireEvent,
			fireEventScope = isMac ? this.menuBarManager : Ext.GlobalEvents;

		if (suspend) {
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

	updateFileMenuItems: function(disabled) {
		var viewModel = this.getApplication().getMainView().getViewModel();

		this.openMenuItem.enabled = !disabled;
		this.recentFilesMenu.enabled = !disabled;
		this.importMenu.enabled = !disabled;
		this.exportMenu.enabled = !disabled;
		this.closeMenuItem.enabled = !disabled;
		this.saveMenuItem.enabled = disabled ? false : viewModel.get('project.isModified');
		this.saveAsMenuItem.enabled = !disabled;
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

	onCanUndoChanged: function(canUndo) {
		this.canUndo = canUndo;
		this.undoMenuItem.enabled = canUndo;
	},

	onCanRedoChanged: function(canRedo) {
		this.canRedo = canRedo;
		this.redoMenuItem.enabled = canRedo;
	},

	onWaypointDataChanged: function(waypoints) {
		this.importPicturesMenuItem.enabled = !!waypoints.count();
	}

});
