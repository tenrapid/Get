
module.exports = {
	windows: {},
	lastFocused: [],
	menuBarWin: null,

	register: function(win, menuBar) {
		var me = this,
			handler;

		console.log('register', win.id, menuBar && menuBar.id);
		if (this.windows[win.id]) {
			this.windows[win.id].menuBar = menuBar;
			return;
		}

		handler = {
			onFocus: this.onFocus.bind(this, win),
			onClose: this.onClose.bind(this, win)
		};
		win.on('focus', handler.onFocus);
		win.on('close', handler.onClose);

		if (menuBar) {
			win.menu = menuBar;
			if (!this.menuBarWin) {
				this.menuBarWin = win;
			}
		}
		// win.window.addEventListener('unload', function() {
		// 	console.log('unload');
		// 	me.unregister(win);
		// });

		this.windows[win.id] = {
			win: win,
			handler: handler,
			menuBar: menuBar
		};
		this.setFocused(win);
	},

	unregister: function(win) {
		console.log('unregister');
		var handler = this.windows[win.id].handler;
		win.removeListener('focus', handler.onFocus);
		win.removeListener('close', handler.onClose);

		this.lastFocused.splice(this.lastFocused.indexOf(win), 1);
		if (this.lastFocused.length) {
			if (win == this.menuBarWin) {
				this.menuBarWin = this.lastFocused[0];
				this.lastFocused[0].menu = this.windows[this.lastFocused[0].id].menuBar;
			}
		}

		delete this.windows[win.id];
	},

	setFocused: function(win) {
		var index;

		if (win != this.lastFocused[0]) {
			index = this.lastFocused.indexOf(win);
			if (index >= 0) {
				this.lastFocused.splice(index, 1);
			}
			this.lastFocused.unshift(win);
			console.log('setFocused', this.lastFocused.map(function(win) {return win.id;}));
		}
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
		var w = this.lastFocused[0].window;
		if (w.Get && w.Get.app) {
			w.Get.app.getController('NodeWebkitGui', true).fireEvent(e);
		}
	}

};
