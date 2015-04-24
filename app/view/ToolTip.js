Ext.define('Get.view.ToolTip', {
	extend: 'Ext.tip.ToolTip',

	/**
	 * Shows this tooltip at the current event target XY position.
	 * Modified: ignore cached coords xy
	 */
	show: function () {
		var me = this;

		// Show this Component first, so that sizing can be calculated
		// pre-show it off screen so that the el will have dimensions
		this.callParent();
		this.el.setOpacity('1');
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

    delayHide: function() {
		this.el.setOpacity('0');
        this.callParent(arguments);
    },

    getOffsets: function() {
        var me = this,
            offsets,
            ap = me.getAnchorPosition().charAt(0);

        switch (ap) {
        case 't':
            offsets = [0, 4];
            break;
        case 'b':
            offsets = [0, -4];
            break;
        case 'r':
            offsets = [-14, 0];
            break;
        default:
            offsets = [14, 0];
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

});
