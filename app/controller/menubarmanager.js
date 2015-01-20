
var windowFocusManager = require('./windowFocusManager.js');

var menuBarManager = {
	menuBars: {},

	register: function(win, menuBar) {
		var me = this,
			handler;

		// console.log('menuBarManager.register', win.id, menuBar && menuBar.id);
		windowFocusManager.register(win);
		this.menuBars[win.id] = menuBar;
		if (windowFocusManager.isFocused(win)) {
			this.setMenuBar(win);
		}
	},

	unregister: function(win) {
		// console.log('menuBarManager.unregister', win.id);
		delete this.menuBars[win.id];
	},

	setMenuBar: function(win) {
		var menuBar = this.menuBars[win.id];

		if (menuBar) {
			win.menu = menuBar;
			// console.log('menuBarManager.setMenuBar', win.id, menuBar.id);
		}
	},

	onFocus: function(win) {
		// console.log('menuBarManager.onFocus', win.id);
		this.setMenuBar(win);
	},

	onClosed: function(win) {
		// console.log('menuBarManager.onClosed', win.id);
		this.unregister(win);
	},

	fireControllerEvent: function(e) {
		var focused = windowFocusManager.getFocused();
		if (focused.window.Get && focused.window.Get.app) {
			focused.window.Get.app.getController('NodeWebkitGui', true).fireEvent(e);
		}
	}

};
windowFocusManager.on('focus', menuBarManager.onFocus.bind(menuBarManager));
windowFocusManager.on('closed', menuBarManager.onClosed.bind(menuBarManager));

module.exports = menuBarManager;
