Ext.define('Get.view.waypoints.edit.EditPicture', {
	extend: 'Ext.window.Window',
	requires: [
		'Get.view.PictureCropper'
	],

	alias: 'widget.edit.picture',

	isEditPictureWindow: true,
	
	session: true,
	viewModel: true,

	autoShow: true,
	modal: true,
	resizable: false,
	draggable: false,
	plain: true,
	bodyStyle: 'border-width: 0;',
	bodyPadding: '0 12 12 12',
	defaultFocus: 'textfield',

	defaultListenerScope: true,

	bind: {
		title: 'Beschneiden <span style="font-weight: normal; color: #999;">&ndash; {picture.filename}</span>',
	},

	layout: {
		type: 'vbox',
		align: 'stretch'
	},

	items: [
		{
			xtype: 'picturecropper'
		},
		{
			xtype: 'textfield',
			fieldLabel: 'Titel',
			labelWidth: 30,
			labelAlign: 'right',
			margin: '3 2 0 2',
			bind: '{picture.name}'
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
			handler: 'save'
		},
		{
			text: 'Abbrechen',
			handler: 'close'
		},
	],

	keys: {
		binding: [
			{
				key: Ext.event.Event.ENTER,
				fn: function(key, e) { 
					if (e.getTarget('input[type=text], .picture-cropper')) {
						this.target.component.down('button[cls~=btn-ok]').el.dom.click();
					}							
				}
			}
		]
	},

	initComponent: function() {
		var picture = this.getSession().getRecord('Picture', this.picture.getId()),
			maxWidth = Ext.Element.getViewportWidth() - 80,
			maxHeight = Ext.Element.getViewportHeight() - 140,
			pictureCropper;

		this.callParent();
		
		this.getViewModel().set('picture', picture);

		pictureCropper = this.down('picturecropper');
		pictureCropper.setMaxWidth(maxWidth);
		pictureCropper.setMaxHeight(maxHeight);
		pictureCropper.picture = picture;
	},

	beforeShow: function() {
		this.getViewModel().notify();
	},

	afterShow: function() {
		this.callParent(arguments);
		setTimeout(this.focus.bind(this), 0);
	},

	save: function() {
		var viewModel = this.getViewModel(),
			project = viewModel.get('project'),
			picture = viewModel.get('picture'),
			pictureCropper = this.down('picturecropper');

		picture.setCrop(pictureCropper.getCrop());
		project.undoManager.beginUndoGroup();
		this.getSession().save();
		project.undoManager.endUndoGroup();
		this.close();
	}

});
