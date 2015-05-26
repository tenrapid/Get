Ext.define('Get.view.PictureCropper', {
	extend: 'Ext.Component',

	xtype: 'picturecropper',

	renderTpl: [
		'<div id="{id}-imgWrapper" data-ref="imgWrapper"><img  id="{id}-img" data-ref="img"></div>',
	],

	cls: 'picture-cropper',

	childEls: [
		'imgWrapper',
		'img'
	],

	padding: 3,

	onDestroy: function () {
		if (this.jcropApi) {
			this.jcropApi.destroy();
			this.jcropApi = null;
		}
		this.callParent();
	},

	afterRender: function() {
		this.callParent(arguments);
		this.update();
	},

	update: function() {
		var me = this,
			picture = this.picture,
			size = this.size = picture.sizeWithin([this.maxWidth - this.padding * 2, this.maxHeight - this.padding * 2], true);

		if (this.jcropApi) {
			// JCrop moves the imgWrapper into its own element and attaches some styles
			this.imgWrapper.appendTo(this.el);
			this.imgWrapper.dom.removeAttribute('style');
			this.jcropApi.destroy();
		}

		this.img.set({
			width: size.image[0],
			height: size.image[1],
			style: size.transformStyle
		});
		this.imgWrapper.setSize(size.container[0], size.container[1]);

		picture.getImageUrl('original', function(err, url) {
			var crop = picture.getCrop(),
				cropX1 = Math.round(size.container[0] * crop.x),
				cropY1 = Math.round(size.container[1] * crop.y),
				cropX2 = cropX1 + Math.round(size.container[0] * crop.width),
				cropY2 = cropY1 + Math.round(size.container[1] * crop.height),
				options = picture.isCropped() ? {setSelect: [cropX1, cropY1, cropX2, cropY2]} : {};

			if (me.img.getAttribute('src') === url) {
				me.initJCrop(options);
			}
			else {
				me.img
					.on({
						load: {
							fn: function() {
								me.initJCrop(options);
							},
							single: true
						}
					})
					.set({src: url});
			}
		});
	},

	initJCrop: function(options) {
		var me = this;

		$(this.imgWrapper.dom).Jcrop(options, function() {
			me.jcropApi = this;
			$('.jcrop-keymgr', me.el.dom).keydown(function(e) {
				var keyboardEvent,
					keyCode;

				if (e.keyCode === 13) {
					keyCode = e.keyCode;
				}

				if (keyCode) {
					keyboardEvent = new KeyboardEvent('keydown', {
						bubbles: true
					});
					keyboardEvent.keyCodeVal = keyCode;
					Object.defineProperty(keyboardEvent, 'keyCode', {
						get : function() {
							return this.keyCodeVal;
						}
					});
					me.el.dom.dispatchEvent(keyboardEvent);
				}
			});
		});
	},

	getCrop: function() {
		var crop = this.jcropApi.tellSelect();

		if (this.jcropApi.ui.selection.is(':visible')) {
			crop = {
				x: crop.x / this.size.container[0],
				y: crop.y / this.size.container[1],
				width: crop.w / this.size.container[0],
				height: crop.h / this.size.container[1]
			};
		}
		else {
			crop = {
				x: 0,
				y: 0,
				width: 1,
				height: 1
			};
		}

		return crop;
	}

});
