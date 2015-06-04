Ext.define('Get.view.StatefulGrid', {
	extend: 'Ext.grid.Panel',

	stateful: true,


	initComponent: function() {
		this.callParent(arguments);
		if (this.headerCt.resizer) {
			this.patchHeaderResizerPlugin();
		}
	},

	applyState: function(state) {
		var columns = state.columns,
			columnHash;

		this.callParent(arguments);

		if (this.rendered) {
			columnHash = {};
			columns.forEach(function(column) {
				columnHash[column.id] = column;
			});
	
			this.columns.forEach(function(column) {
				var id = column.getStateId();
	
				if (columnHash[id] && columnHash[id].width) {
					column.setWidth(this.width);
				}
			});
		}
	},
	
	/*
		This patch keeps the flex state of flex column. It assumes that there is only one flex column
		in a grid and that it's right neighbour column can be resized.
	*/
	patchHeaderResizerPlugin: function() {
		this.headerCt.resizer.doResize = function() {
			var me = this,
				dragHd = me.dragHd,
				nextHd,
				offset = me.tracker.getOffset('point'),
				oldWidth = this.origWidth,
				newWidth;

			// Only resize if we have dragged any distance in the X dimension...
			if (dragHd && offset[0]) {

				Ext.suspendLayouts();

				//// changed ///////////////////////////
				if (dragHd.flex) {
					nextHd = dragHd.nextNode('gridcolumn:not([hidden]):not([isGroupHeader])');
					if (nextHd && !me.headerInSameGrid(nextHd)) {
						nextHd = null;
					}
					if (nextHd) {
						delete nextHd.flex;
						nextHd.setWidth(nextHd.getWidth() - offset[0] + me.xDelta);
					}
				}
				else {
				////////////////////////////////////////
					// Set the new column width.
					// Adjusted for the offset from the actual column border that the mousedownb too place at.
					me.adjustColumnWidth(offset[0] - me.xDelta);

					// In the case of forceFit, change the following Header width.
					// Constraining so that neither neighbour can be sized to below minWidth is handled in getConstrainRegion
					if (me.headerCt.forceFit) {
						nextHd = dragHd.nextNode('gridcolumn:not([hidden]):not([isGroupHeader])');
						if (nextHd && !me.headerInSameGrid(nextHd)) {
							nextHd = null;
						}
						if (nextHd) {
							delete nextHd.flex;
							nextHd.setWidth(nextHd.getWidth() - offset[0]);
						}
					}
				}

				// Apply the two width changes by laying out the owning HeaderContainer
				Ext.resumeLayouts(true);
			}
		};
	}
});
