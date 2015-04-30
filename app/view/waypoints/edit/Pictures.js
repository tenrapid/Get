Ext.define('Get.view.waypoints.edit.Pictures', {
	extend: 'Ext.view.View',
	requires: [
		'Get.view.ToolTip',
		'Ext.window.Window'
	],

	alias: 'widget.edit.waypoint.pictures',

	tpl: [
		'<tpl for=".">',
			'<div class="waypoint-picture-thumbnail waypoint-picture" style="background-image: {backgroundImage};">',
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

		picture.getImageUrl('thumb', function(err, url) {
			var node = me.getNode(picture);

			if (node) {
				node.style.backgroundImage = 'url(' + url + ')';
			}
			newData.backgroundImage = 'url(' + url + ')';
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
		// pv = this;
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
			'<div style="width: ' + size[0] + 'px;">',
				'<img width="' + size[0] + '" height="' + size[1] + '" style="background-color: #ccc;">', 
				picture.isCropped() ? '<div class="waypoint-picture-crop-indicator"><i class="fa fa-crop"></i></div>' : '',
				'<div style="margin-top: 1px;">',
					picture.get('name'),
				'</div>',
			'</div>'
		].join(''));
		picture.getImageUrl('preview', function(err, url) {
			preview.body.down('img').set({src: url});
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
				if (err) {
					throw err;
				}
				pictures.add(Ext.create('Get.model.Picture', {
					filename: file.path,
					name: file.name,
					width: dimensions.width,
					height: dimensions.height
				}));
			});
		});
	},
	
	removePicture: function(picture) {
		picture.drop();
	},

	openCropWindow: function(picture) {
		// TODO: memory leak?
		var maxWidth = Ext.Element.getViewportWidth() - 80,
			maxHeight = Ext.Element.getViewportHeight() - 140,
			size = picture.sizeWithin([maxWidth, maxHeight], true),
			cropWindow,
			image,
			titleTextfield,
			jcropApi;

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
					xtype: 'image',
					width: size[0] + 6,
					height: size[1] + 6,
					autoEl: 'div',
					padding: '3 3 0 3'
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
				{
					text: 'OK',
					cls: 'btn-ok',
					handler: function() {
						var crop = jcropApi.tellSelect(),
							values = {
								name: titleTextfield.getValue()	
							};

 						if (!(crop.w === 0 || crop.h === 0)) {
 							Ext.apply(values, {
								cropX: crop.x / size[0],
								cropY: crop.y / size[1],
								cropWidth: crop.w / size[0],
								cropHeight: crop.h / size[1]
 							});
 						}
 						else {
 							Ext.apply(values, {
								cropX: 0,
								cropY: 0,
								cropWidth: 1,
								cropHeight: 1
 							});
 						}

 						picture.set(values);
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

		image = cropWindow.child('image');
		titleTextfield = cropWindow.child('textfield');
		titleTextfield.setValue(picture.get('name'));

		picture.getImageUrl('original', function(err, url) {
			var $image = $(image.imgEl.dom).first(),
				cropX1 = Math.round(size[0] * picture.get('cropX')),
				cropY1 = Math.round(size[1] * picture.get('cropY')),
				cropX2 = cropX1 + Math.round(size[0] * picture.get('cropWidth')),
				cropY2 = cropY1 + Math.round(size[1] * picture.get('cropHeight')),
				options = picture.isCropped() ? {setSelect: [cropX1, cropY1, cropX2, cropY2]} : {};

			$image.width(size[0]);
			$image.height(size[1]);
			$image.attr('src', url);
			$image.Jcrop(options, function() {
				jcropApi = this;
			});
			setTimeout(function() {
				cropWindow.focus();
			}, 0);
		});
	},

});
