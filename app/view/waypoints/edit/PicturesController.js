Ext.define('Get.view.waypoints.edit.PicturesController', {
	extend: 'Ext.app.ViewController',

	alias: 'controller.edit.waypoint.pictures',

	requires: [
		'Ext.tip.ToolTip'
	],

	control: {
		'#': {
			addpicture: 'onAddPicture',
			removepicture: 'onRemovePicture',
			afterRender: 'afterRender'
		}
	},

	afterRender: function(view) {
		var me = this;

		if (!this.preview) {
			this.preview = Ext.create('Ext.tip.ToolTip', {
				target: view.pictures,
				delegate: view.itemSelector,
				trackMouse: true,
				mouseOffset: [10, -25],
				maxWidth: 615,
				anchor: 'bottom',
				hideDelay: 0,
				dismissDelay: 0,
				renderTo: Ext.getBody(),
				listeners: {
					beforeshow: function updateTipBody(preview) {
						preview.update([
							'<img src="/Users/tenrapid/Desktop/DSC_0147.jpg" style="max-width: 600px; max-height: 450px;"><br>', 
							'Filename: ' + view.getRecord(preview.triggerElement).get('filename')
						].join(''));
					}
				}
			});
		}
	},

	onAddPicture: function(files) {
		var pictures = this.getView().getStore();

		files.forEach(function(file) {
			pictures.add(Ext.create('Get.model.Picture', {
				filename: file.path,
				db: false
			}));
		});
	},
	
	onRemovePicture: function(picture) {
		picture.drop();
	},

});
