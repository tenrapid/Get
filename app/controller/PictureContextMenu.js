Ext.define('Get.controller.PictureContextMenu', {
	extend: 'Ext.app.Controller',

	id: 'pictureContextMenu', 

	config: {
		listen: {
			component: {
				'edit\\.waypoint\\.pictures': {
					itemcontextmenu: 'onPictureContextMenu'
				}
			}
		}
	},

	init: function() {
		this.menu = Ext.create('Ext.menu.Menu', {
			items: [
				{
					text: 'Bearbeiten',
					handler: 'onEditPicture',
					scope: this
				},
				{
					text: 'Duplizieren',
					handler: 'onDuplicatePicture',
					scope: this
				},
				{
					text: 'Löschen',
					handler: 'onRemovePicture',
					scope: this
				}
			]
		});
	},

	onPictureContextMenu: function(view, picture, el, i, e) {
		this.view = view;
		this.picture = picture;
		this.el = el;
		this.menu.showAt(e.pageX, e.pageY);
	},

	onEditPicture: function() {
		this.view.editPicture(this.picture);
	},

	onDuplicatePicture: function() {
		this.view.duplicatePicture(this.picture);
	},

	onRemovePicture: function() {
		this.view.removePicture(this.picture);
	}

});
