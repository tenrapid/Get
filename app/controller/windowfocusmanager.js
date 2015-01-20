
var EventEmitter = require('events');
var emitter = new EventEmitter();

// Order of events after win.close(true)
//		1. 'focus' from window that receives focus after window is closed
//		2. 'closed' from closed window

var windowFocusManager = {
	windows: {},
	lastFocused: [],

	register: function(win) {
		if (this.windows[win.id]) {
			return;
		}
		// console.log('windowFocusManager.register', win.id);

		win.on('focus', this.onFocus.bind(this, win));
		win.on('closed', this.onClosed.bind(this, win));

		this.windows[win.id] = true;
		this.setFocused(win);
	},

	unregister: function(win) {
		// console.log('windowFocusManager.unregister', win.id);
		this.lastFocused.splice(this.lastFocused.indexOf(win), 1);
		delete this.windows[win.id];
		emitter.emit('closed', win);
	},

	setFocused: function(win) {
		var index;

		if (win != this.lastFocused[0]) {
			index = this.lastFocused.indexOf(win);
			if (index >= 0) {
				this.lastFocused.splice(index, 1);
			}
			this.lastFocused.unshift(win);
			// console.log('windowFocusManager.setFocused', this.lastFocused.map(function(win) {return win.id;}));
			emitter.emit('focus', win);
		}
	},

	getFocused: function() {
		return this.lastFocused[0];
	},

	isFocused: function(win) {
		return win == this.lastFocused[0];
	},

	onFocus: function(win) {
		// console.log('windowFocusManager.onFocus');
		this.setFocused(win);
	},

	onClosed: function(win) {
		// console.log('windowFocusManager.onClosed', win.id);
		this.unregister(win);
	},

	addListener: emitter.addListener.bind(emitter),
	on: emitter.addListener.bind(emitter),
	removeListener: emitter.removeListener.bind(emitter)

};

module.exports = windowFocusManager;

