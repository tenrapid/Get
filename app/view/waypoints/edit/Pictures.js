Ext.define('Get.view.waypoints.edit.Pictures', {
	extend: 'Ext.view.View',
	requires: [
		'Get.view.ToolTip',
		'Get.view.FileDialog'
	],

	alias: 'widget.edit.waypoint.pictures',

	baseCls: Ext.baseCSSPrefix + 'waypoint-pictures',

	tpl: [
		'<tpl for=".">',
			'<div class="waypoint-picture-thumbnail waypoint-picture">',
				'<div class="waypoint-picture-holder" style="background-image: {backgroundImage}; {transformStyle}"></div>',
				'<div class="waypoint-picture-remove-button"><i class="fa fa-trash"></i></div>',
			'</div>',
		'</tpl>',
	],

	itemSelector: 'div.waypoint-picture',

	renderTpl: [
		'<div id="{id}-pictures" data-ref="pictures"></div>',
		'<div class="waypoint-picture-thumbnail waypoint-picture-add-button" id="{id}-addButton" data-ref="addButton">+</div>',
	],

	childEls: [
		'addButton',
		'pictures'
	],

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

		// newData.backgroundImage = 'url(resources/images/loader.gif); background-size: initial';
		newData.backgroundImage = 'none';
		newData.transformStyle = picture.getTransformCenteredStyle();

		picture.getImageUrl('thumb', function(err, url) {
			var node = me.getNode(picture);

			if (node) {
				Ext.fly(node).down('.waypoint-picture-holder', true).style.backgroundImage = 'url(' + url + ')';
			}
			newData.backgroundImage = 'url(' + url + ')';
		});

		return newData;
	},

	onRender: function() {
		this.callParent(arguments);
		this.addButton.on({
			click: 'onAddButton',
			scope: this
		});
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
	},

	onDestroy: function() {
		this.preview.destroy();
		this.preview = null;
		this.callParent();
	},

	updatePreview: function(preview) {
		var picture = this.getRecord(preview.triggerElement),
			size;

		if (!picture) {
			return;
		}

		size = picture.sizeWithin([600, Math.min(600, Math.round(Ext.Element.getViewportHeight() / 2.25))]);

		preview.update([
			'<div style="width: ' + size.container[0] + 'px; height: ' + size.container[1] + 'px;">',
				'<img width="' + size.image[0] + '" height="' + size.image[1] + '" style="background-color: #ccc;',
				size.transformStyle,
				'">', 
			'</div>',
			picture.isCropped() ? '<div class="waypoint-picture-crop-indicator"><i class="fa fa-crop"></i></div>' : '',
			'<div style="margin-top: 1px;">',
				picture.get('name'),
			'</div>',
		].join(''));
		picture.getImageUrl('preview', function(err, url) {
			// Waypoint edit window could be closed already
			preview.body && preview.body.down('img').set({src: url});
		});
	},

	onItemMouseEnter: function(record, el) {
		this.callParent(arguments);
		var removeButton = Ext.get(el).down('.waypoint-picture-remove-button');
		removeButton.on({
			click: {
				fn: this.onRemoveButton,
				scope: this,
				args: [record]
			}
		});
	},

	onItemMouseLeave: function(record, el) {
		this.callParent(arguments);
		var removeButton = Ext.get(el).down('.waypoint-picture-remove-button');
		removeButton.un('click', this.onRemoveButton, this);
	},

	onItemClick: function(picture) {
		if (this.preview.showTimer) {
			this.preview.clearTimer('show');
		}
		Ext.widget('edit.picture', {
			picture: picture,
			session: this.getStore().getSession().spawn()
		});
	},

	onAddButton: function() {
		Get.FileDialog.show({
			multiple: true,
			handler: this.addPicture,
			scope: this
		});
	},

	onRemoveButton: function(picture) {
		this.removePicture(picture);
	},

	addPicture: function(files) {
		var pictures = this.getStore(),
			imageInfo = require('imageinfo');

		files.forEach(function(file) {
			imageInfo(file.path, function(err, info) {
				if (err) {
					throw err;
				}
				pictures.add({
					filename: file.path,
					name: file.name,
					width: info.width,
					height: info.height,
					orientation: info.orientation
				});
			});
		});
	},
	
	removePicture: function(picture) {
		var project = this.lookupViewModel().get('project');

		project.undoManager.beginUndoGroup();
		picture.drop();
		project.undoManager.endUndoGroup();
	}

});
