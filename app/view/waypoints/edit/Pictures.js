Ext.define('Get.view.waypoints.edit.Pictures', {
	extend: 'Ext.view.View',
	requires: [
		'Get.view.ToolTip',
		'Get.view.FileDialog',
		'Get.view.PictureCropper',
		'Ext.window.Window'
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
		this.openCropWindow(picture);
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
		// Due to a bug in role's Left.onDrop we have to prevent the cascade of the drop so
		// that the tourWaypoint is not dropped too. Left.onDrop checks for ownership only 
		// if an association store is created. While getting associated records from the session
		// ownership is not checked.
		picture.drop(false);
	},

	openCropWindow: function(picture) {
		// TODO: memory leak?
		var maxWidth = Ext.Element.getViewportWidth() - 80,
			maxHeight = Ext.Element.getViewportHeight() - 140,
			cropWindow,
			titleTextfield,
			pictureCropper;

		if (this.preview.showTimer) {
			this.preview.clearTimer('show');
		}

		cropWindow = Ext.create('Ext.window.Window', {
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [
				{
					xtype: 'picturecropper',
					picture: picture,
					maxWidth: maxWidth,
					maxHeight: maxHeight
				},
				{
					xtype: 'textfield',
					name: 'title',
					fieldLabel: 'Titel',
					labelWidth: 30,
					labelAlign: 'right',
					margin: '3 2 0 2'
				}
			],
			buttons: [
				// {
				// 	text: 'Drehen',
				// 	handler: function() {
				// 		// picture.set('orientation', picture.get('orientation') % 8 + 1);
				// 		picture.set('orientation', {
				// 			1: 6,
				// 			6: 3,
				// 			3: 8,
				// 			8: 1
				// 		}[picture.get('orientation')]);
				// 		// console.log(picture.get('orientation'));
				// 		pictureCropper.update();
				// 		cropWindow.updateLayout();
				// 		cropWindow.center();
				// 	},
				// },
				{
					text: 'OK',
					cls: 'btn-ok',
					handler: function() {
						picture.setCrop(pictureCropper.getCrop());
 						picture.set('name', titleTextfield.getValue());
						cropWindow.close();
						cropWindow = null;
					},
				},
				{
					text: 'Abbrechen',
					handler: function() {
						cropWindow.close();
						cropWindow = null;
					},
				},
			],
			listeners: {
				afterrender: function(component, options) {
					var okButton = component.down('button[cls~=btn-ok]').el.dom;
					component.query('textfield').forEach(function(textfield) {
						if (!textfield.isXType('textarea')) {
							Ext.create('Ext.util.KeyNav', {
								target: textfield.el,
								enter: function() {
									okButton.click();
								}
							});
						}
					});
				}, 
			},
			title: 'Beschneiden <span style="font-weight: normal; color: #999;">&ndash; ' + picture.get('filename') + '</span>',
			autoShow: true,
			modal: true,
			resizable: false,
			draggable: false,
			plain: true,
			bodyStyle: 'border-width: 0;',
			bodyPadding: '0 12 12 12',
			defaultFocus: 'textfield'
		});

		pictureCropper = cropWindow.child('picturecropper');
		titleTextfield = cropWindow.child('textfield');
		titleTextfield.setValue(picture.get('name'));

		setTimeout(function() {
			cropWindow.focus();
		}, 0);
	},

});
