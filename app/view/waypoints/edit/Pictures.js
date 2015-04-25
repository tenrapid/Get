Ext.define('Get.view.waypoints.edit.Pictures', {
	extend: 'Ext.view.View',
	requires: [
		'Get.view.ToolTip'
	],

	alias: 'widget.edit.waypoint.pictures',

	// controller: 'edit.waypoint.pictures',

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

	// overide View
	getNodeContainer: function() {
		return this.pictures;
	},

	// overide View
	refresh: function() {
		this.callParent();
		// AbstractView.refresh appends the items to this view's el and ignores getNodeContainer, so we have 
		// to put them there in the next line.
		this.all.appendTo(this.pictures);
	},

	// overide View
	prepareData: function(data, index, picture) {
		var me = this,
			newData = this.callParent(arguments);

		picture.getImageUrl('thumb', function(err, url) {
			var node = me.getNode(picture);

			if (node) {
				node.style.backgroundImage = 'url(' + url + ')';
			}
			newData.imageUrl = url;
		});
		return newData;
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
		if (!this.preview) {
			this.preview = Ext.create('Get.view.ToolTip', {
				target: this.pictures,
				delegate: this.itemSelector,
				maxWidth: 620,
				anchor: 'bottom',
				hideDelay: 200,
				dismissDelay: 0,
				shadow: null,
				renderTo: Ext.getBody(),
				listeners: {
					beforeshow: 'updatePreview',
					scope: this
				}
			});
		}

		// DEBUG
		pv = this;
	},

	updatePreview: function(preview) {
		var picture = this.getRecord(preview.triggerElement),
			size;

		if (!picture) {
			return;
		}

		size = picture.sizeWithin([600, 400]);

		preview.update([
			'<div style="width: ' + size[0] + 'px;">',
				'<img src="" width="' + size[0] + '" height="' + size[1] + '"><br>', 
				'Filename: ' + picture.get('filename'),
			'</div>'
		].join(''));
		picture.getImageUrl('preview', function(err, url) {
			preview.body.down('img').set({src: url});
		});
	},

	onAddButton: function() {
		this.fileInput.dom.click();
	},

	onRemoveButton: function(picture) {
		this.removePicture(picture);
	},

	onFileInput: function() {
		var files = Ext.Array.clone(this.fileInput.dom.files);

		if (files.length) {
			this.addPicture(files);
		}

		this.fileInput.dom.files.clear();
		this.fileInput.dom.files.append(new File('', ''));
	},

	addPicture: function(files) {
		var pictures = this.getStore(),
			sizeOf = require('image-size');

		files.forEach(function(file) {
			sizeOf(file.path, function(err, dimensions) {
				if (!err) {
					pictures.add(Ext.create('Get.model.Picture', {
						filename: file.path,
						width: dimensions.width,
						height: dimensions.height,
						db: false
					}));
				}
			});
		});
	},
	
	removePicture: function(picture) {
		picture.drop();
	},

});
