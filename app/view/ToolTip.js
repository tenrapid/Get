Ext.define('Get.view.ToolTip', {
	extend: 'Ext.tip.ToolTip',

	delayShow: function (trackMouse) {
		// When delaying, cache the XY coords of the mouse when this method was invoked, NOT when the deferred
		// show is called because the mouse could then be in a completely different location. Only cache the
		// coords when trackMouse is false.
		//
		// Note that the delayShow call could be coming from a caller which would internally be setting trackMouse
		// (e.g., Ext.chart.Tip:showTip()). Because of this, the caller will pass along the original value for
		// trackMouse (i.e., the value passed to the component constructor) to the delayShow method.
		// See EXTJSIV-11292.
		var me = this;

		if (me.hidden && !me.showTimer) {
			if (Ext.Date.getElapsed(me.lastActive) < me.quickShowInterval) {
				me.show();
			} else {
				me.showTimer = Ext.defer(me.showFromDelay, me.showDelay, me);
			}
		}
		else if (!me.hidden && me.autoHide !== false) {
			this.fireEvent('beforeShow', this);
			me.show();
		}
	},

	/**
	 * Shows this tooltip at the current event target XY position.
	 * Modified: ignore cached coords xy
	 */
	show: function () {
		var me = this;

		// trigger element already removed
		if (!this.triggerElement.parentNode) {
			return;
		}

		// Show this Component first, so that sizing can be calculated
		// pre-show it off screen so that the el will have dimensions
		this.callParent();
		if (this.hidden === false) {
			if (me.anchor) {
				me.anchor = me.origAnchor;
			}

			if (!me.calledFromShowAt) {
				// If the caller was this.showFromDelay(), the XY coords may have been cached.
				me.showAt(me.getTargetXY());
			}
		}
	},

	getOffsets: function() {
		var me = this,
			offsets,
			ap = me.getAnchorPosition().charAt(0);

		switch (ap) {
		case 't':
			offsets = [0, 16];
			break;
		case 'b':
			offsets = [0, -16];
			break;
		case 'r':
			offsets = [-16, 0];
			break;
		default:
			offsets = [16, 0];
			break;
		}

		return offsets;
	},

	getAnchorAlign: function() {
		switch (this.anchor) {
		case 'top':
			return 't-b';
		case 'left':
			return 'l-r';
		case 'right':
			return 'r-l';
		default:
			return 'b-t';
		}
	},

	syncAnchor: function() {
		var me = this,
			anchorPos,
			targetPos,
			offset;
		switch (me.tipAnchor.charAt(0)) {
		case 't':
			anchorPos = 'b';
			targetPos = 't';
			offset = [me.anchorOffset, 1];
			break;
		case 'r':
			anchorPos = 'l';
			targetPos = 'r';
			offset = [-1, me.anchorOffset];
			break;
		case 'b':
			anchorPos = 't';
			targetPos = 'b';
			offset = [me.anchorOffset, -1];
			break;
		default:
			anchorPos = 'r';
			targetPos = 'l';
			offset = [1, me.anchorOffset];
			break;
		}
		me.anchorEl.alignTo(me.el, anchorPos + '-' + targetPos, offset);
		me.anchorEl.setStyle('z-index', parseInt(me.el.getZIndex(), 10) || 0 + 1).setVisibilityMode(Ext.Element.DISPLAY);
	},

	onTargetOver: function(e) {
		var me = this,
			delegate = me.delegate,
			t;

		t = delegate ? e.getTarget(delegate) : e.target;

		if (me.disabled || e.within(t, true)) {
			return;
		}
		if (t) {
			me.triggerElement = delegate ? t : true;
			me.triggerEvent = e;
			me.clearTimer('hide');
			me.targetXY = e.getXY();
			me.delayShow();
		}
	},

});
