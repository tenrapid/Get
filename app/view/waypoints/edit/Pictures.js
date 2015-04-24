Ext.define('Get.view.waypoints.edit.Pictures', {
	extend: 'Ext.view.View',
	requires: [
		'Get.view.waypoints.edit.PicturesController',
	],

	alias: 'widget.edit.waypoint.pictures',

	controller: 'edit.waypoint.pictures',

	tpl: [
		'<tpl for=".">',
			'<div class="waypoint-picture-thumbnail waypoint-picture" style="background-image: url({imageUrl});">',
				'<div class="waypoint-picture-remove-button"><i class="fa fa-trash"></i></div>',
			'</div>',
		'</tpl>',
	],

	itemSelector: 'div.waypoint-picture',

	renderTpl: [
		'<input style="display:none;" type="file" multiple id="{id}-fileInput" data-ref="fileInput" />',
		'<div id="{id}-pictures" data-ref="pictures"></div>',
		'<div class="waypoint-picture-thumbnail waypoint-picture-add-button" id="{id}-addButton" data-ref="addButton">+</div>',
	],

	childEls: [
		'addButton',
		'pictures',
		'fileInput'
	],

	listeners: {
		itemmouseenter: function(view, record, el) {
			var removeButton = Ext.get(el).down('.waypoint-picture-remove-button');
			removeButton.show();
			removeButton.on({
				click: {
					fn: view.onRemoveButton,
					scope: view,
					args: [record]
				}
			});
		},
		itemmouseleave: function(view, record, el) {
			var removeButton = Ext.get(el).down('.waypoint-picture-remove-button');
			removeButton.hide();
			removeButton.un('click', view.onRemoveButton, view);
		}
	},

	getNodeContainer: function() {
		return this.pictures;
	},

	afterRender: function() {
		this.callParent(arguments);
		this.addButton.on({
			click: 'onAddButton',
			scope: this
		});
		this.fileInput.dom.files.append(new File('', ''));
		this.fileInput.on({
			change: 'onFileInput',
			scope: this
		});
	},

	refresh: function() {
		this.callParent();
		// AbstractView.refresh appends the items to this view's el and ignores getNodeContainer, so we have 
		// to put them there in the next line.
		this.all.appendTo(this.pictures);
	},

	prepareData: function(data, index, record) {
		var newData = this.callParent(arguments);
		newData.imageUrl = 'file:///Users/tenrapid/Desktop/DSC_0147.jpg';
		return newData;
	},

	onAddButton: function() {
		this.fileInput.dom.click();
	},

	onRemoveButton: function(record) {
		this.fireEvent('removePicture', record);
	},

	onFileInput: function() {
		var files = Ext.Array.clone(this.fileInput.dom.files);

		if (files.length) {
			this.fireEvent('addPicture', files);
		}

		this.fileInput.dom.files.clear();
		this.fileInput.dom.files.append(new File('', ''));
	}

});
