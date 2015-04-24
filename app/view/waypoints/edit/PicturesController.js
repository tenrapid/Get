Ext.define('Get.view.waypoints.edit.PicturesController', {
	extend: 'Ext.app.ViewController',

	alias: 'controller.edit.waypoint.pictures',

	requires: [
		'Get.view.ToolTip'
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
			this.preview = Ext.create('Get.view.ToolTip', {
				target: view.pictures,
				delegate: view.itemSelector,
				maxWidth: 615,
				anchor: 'bottom',
				hideDelay: 0,
				dismissDelay: 0,
				renderTo: Ext.getBody(),
				listeners: {
					beforeshow: 'updatePreview',
					scope: this
				}
			});
		}
	},

	updatePreview: function(preview) {
		var view = this.getView(),
			picture = view.getRecord(preview.triggerElement);

		if (!picture) {
			return;
		}

		preview.update([
			'<img src="/Users/tenrapid/Desktop/DSC_0147 2.jpg" style="max-width: 600px; max-height: 450px;"><br>', 
			'Filename: ' + picture.get('filename')
		].join(''));
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
