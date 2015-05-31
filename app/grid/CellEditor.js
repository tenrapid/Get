Ext.define('Get.grid.CellEditor', {
	extend: 'Ext.grid.CellEditor',

	xtype: 'celleditor',

	field: {
		xtype: 'textarea'
	},
	autoSize: {
		width: 'field',
		height: 'field'
	},
	alignment: 'tl-tl',
	offsets: [-1, -1],

	constructor: function(config) {
		this.callParent([config]);
		// add missing assignment of editorId
		this.editorId = config.column.id;
	},

	/**
	 * @private
	 * Realigns the Editor to the grid cell, or to the text node in the grid inner cell
	 * if the inner cell contains multiple child nodes.
	 */
	realign: function(autoSize) {
		var me = this,
			boundEl = me.boundEl,
			innerCell = boundEl.first(),
			innerCellTextNode = innerCell.dom.firstChild,
			width = boundEl.getWidth(),
			height = boundEl.getHeight(),
			offsets = me.offsets,
			grid = me.grid,
			v = '',

			// innerCell is empty if there are no children, or there is one text node, and it contains whitespace
			isEmpty = !innerCellTextNode || (innerCellTextNode.nodeType === 3 && !(Ext.String.trim(v = innerCellTextNode.data).length));

		if (grid.columnLines) {
			// Subtract the column border width so that the editor displays inside the
			// borders. The column border could be either on the left or the right depending
			// on whether the grid is RTL - using the sum of both borders works in both modes.
			width -= boundEl.getBorderWidth('rl');
		}

		if (autoSize === true) {
			me.field.setWidth(width - offsets[0]);
			me.field.setHeight(height - offsets[1]);
		}

		// https://sencha.jira.com/browse/EXTJSIV-10871 Ensure the data bearing element has a height from text.
		if (isEmpty) {
			innerCell.dom.innerHTML = 'X';
		}

		if (!this.fieldStyleCopied) {
			var paddingRight = (parseFloat(innerCell.getStyle('padding-right')) || 0),
				paddingTop = (parseFloat(innerCell.getStyle('padding-top')) || 0),
				paddingBottom = (parseFloat(innerCell.getStyle('padding-bottom')) || 0);

			this.field.inputEl.setStyle({
				'padding-top': innerCell.getStyle('padding-top'),
				'padding-right': paddingRight - 1 + 'px',
				'padding-bottom': paddingBottom - 1 + 'px',
				'padding-left': innerCell.getStyle('padding-left'),
				'font-size': innerCell.getStyle('font-size'),
				'font-weight': innerCell.getStyle('font-weight'),
				'line-height': innerCell.getStyle('line-height'),
				'color': innerCell.getStyle('color'),
				'height': 'calc(100% + ' + (paddingTop + paddingBottom) + 'px)'
			});

			this.fieldStyleCopied = true;
		}

		me.alignTo(innerCell, me.alignment, offsets);

		if (isEmpty) {
			innerCell.dom.firstChild.data = v;
		}
	}

});
