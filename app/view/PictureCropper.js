Ext.define('Get.view.PictureCropper', {
	extend: 'Ext.Component',

	xtype: 'picturecropper',

	renderTpl: [
		'<div id="{id}-imgWrapper" data-ref="imgWrapper"><img  id="{id}-img" data-ref="img"></div>',
	],

	childEls: [
		'imgWrapper',
		'img'
	],

	padding: 3,

    onDestroy: function () {
        this.jcropApi = null;
        this.callParent();
    },

	onRender: function() {
		var me = this,
			picture = this.picture,
			size = this.size = picture.sizeWithin([this.maxWidth - this.padding * 2, this.maxHeight - this.padding * 2], true);

		this.callParent(arguments);

		$(me.img.dom)
			.attr('width', size.image[0])
			.attr('height', size.image[1])
			.attr('style', size.transformStyle);
		$(me.imgWrapper.dom)
			.width(size.container[0])
			.height(size.container[1]);

		picture.getImageUrl('original', function(err, url) {
			var crop = picture.getCrop(),
				cropX1 = Math.round(size.container[0] * crop.x),
				cropY1 = Math.round(size.container[1] * crop.y),
				cropX2 = cropX1 + Math.round(size.container[0] * crop.width),
				cropY2 = cropY1 + Math.round(size.container[1] * crop.height),
				options = picture.isCropped() ? {setSelect: [cropX1, cropY1, cropX2, cropY2]} : {};

			$(me.img.dom).attr('src', url);
			$(me.imgWrapper.dom).Jcrop(options, function() {
				me.jcropApi = this;
			});
		});
	},

	save: function() {
		this.picture.setCrop(this.getCrop());
	},

	getCrop: function() {
		var crop = this.jcropApi.tellSelect();

		if (!(crop.w === 0 || crop.h === 0)) {
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
