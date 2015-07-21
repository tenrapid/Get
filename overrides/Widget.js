Ext.define('Ext.patch.grid.column.Widget', {
	override: 'Ext.grid.column.Widget',
	compatibility: '5.1.0.107',
	
	privates: {
		/*
			Changes:
			- original method assumed argument "record" is always a single record and not an array of records
			- added "onWidgetDetach" callback
			- call new "detachWidget" method
		*/
		onItemRemove: function(record, index, item) {
			var me = this,
				liveWidgets = me.liveWidgets,
				hasDetach = !!me.onWidgetDetach,
				records = Ext.isArray(record) ? record : [record];

			if (!me.rendered) return;

			records.forEach(function(record) {
				var widget;
				// If there was a real record (collapsed placeholder will no longer be acessible)...
				// return ousted widget to free stack, and move its element to the detached body
				if (record && (widget = liveWidgets[record.internalId])) {
					delete liveWidgets[record.internalId];
					// changed //////////////////////////////////
					me.detachWidget(widget, hasDetach);
					/////////////////////////////////////////////
				}
			});
		},

		/*
			Overide because if a record is added to an empty view, "refresh" and "itemAdd" are fired
			so some widgets may exist already and need to be detached.
		*/
		onItemAdd: function(records, index, items) {
			var me = this,
				hasDetach = !!me.onWidgetDetach,
				liveWidgets = me.liveWidgets;

			if (!me.rendered || me.hidden) return;

			records.forEach(function(record) {
				var widget;

				if (record.isNonData) {
					return;
				}
				widget = liveWidgets[record.internalId];
				if (widget) {
					delete liveWidgets[record.internalId];
					me.detachWidget(widget, hasDetach);
				}
			});
			this.callParent(arguments);
		},

		/*
			Changes:
			- added "onWidgetDetach" callback
			- call new "detachWidget" method
		*/
		onViewRefresh: function(view, records) {
			var me = this,
				rows = view.all,
				hasAttach = !!me.onWidgetAttach,
				// changed //////////////////////////////////
				hasDetach = !!me.onWidgetDetach,
				/////////////////////////////////////////////
				oldWidgetMap = me.liveWidgets,
				dataIndex = me.dataIndex,
				isFixedSize = me.isFixedSize,
				cell, widget, el, width, recordId, 
				itemIndex, recordIndex, record, id, lastBox, dom;

			if (me.rendered && !me.hidden) {
				me.liveWidgets = {};
				Ext.suspendLayouts();
				for (itemIndex = rows.startIndex, recordIndex = 0; itemIndex <= rows.endIndex; itemIndex++, recordIndex++) {
					record = records[recordIndex];
					if (record.isNonData) {
						continue;
					}

					recordId = record.internalId;
					cell = view.getRow(rows.item(itemIndex)).cells[me.getVisibleIndex()].firstChild;

					// Attempt to reuse the existing widget for this record.
					widget = me.liveWidgets[recordId] = oldWidgetMap[recordId] || me.getFreeWidget();
					delete oldWidgetMap[recordId];

					lastBox = me.lastBox;
					if (lastBox && !isFixedSize && width === undefined) {
						width = lastBox.width - parseInt(me.getCachedStyle(cell, 'padding-left'), 10) - parseInt(me.getCachedStyle(cell, 'padding-right'), 10);
					}

					// Call the appropriate setter with this column's data field
					if (widget.defaultBindProperty && dataIndex) {
						widget.setConfig(widget.defaultBindProperty, records[recordIndex].get(dataIndex));
					}
					widget.$widgetRecord = record;
					widget.$widgetColumn = me;
					if (hasAttach) {
						Ext.callback(me.onWidgetAttach, me.scope, [me, widget, record], 0, me);
					}

					if (el = (widget.el || widget.element)) {
						dom = el.dom;
						if (dom.parentNode !== cell) {
							Ext.fly(cell).empty();
							cell.appendChild(el.dom);
						}
						if (!isFixedSize) {
							widget.setWidth(width);
						}
					} else {
						if (!isFixedSize) {
							widget.width = width;
						}
						Ext.fly(cell).empty();
						widget.render(cell);
					}
				}

				Ext.resumeLayouts(true);

				// Free any unused widgets from the old live map.
				// Move them into detachedBody.
				for (id in oldWidgetMap) {
					widget = oldWidgetMap[id];
					// changed //////////////////////////////////
					this.detachWidget(widget, hasDetach);
					/////////////////////////////////////////////
				}
			}
		},
		/*
			Method added
		*/
		detachWidget: function(widget, hasDetach) {
			if (hasDetach) {
				Ext.callback(this.onWidgetDetach, this.scope, [this, widget, widget.$widgetRecord], 0, this);
			}
			widget.$widgetRecord = widget.$widgetColumn = null;
			this.freeWidgetStack.unshift(widget);
			Ext.detachedBodyEl.dom.appendChild((widget.el || widget.element).dom);
		}

	}
});
