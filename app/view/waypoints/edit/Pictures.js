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
			'<div id="{viewId}-record-{internalId}" class="waypoint-picture-thumbnail waypoint-picture">',
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

	loadMask: false,
	preserveScrollOnRefresh: false,

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
	prepareData: function(_data, index, picture) {
		var me = this,
			data = {
				backgroundImage: 'none',
				transformStyle: picture.getTransformCenteredStyle(),
				viewId: this.id,
				internalId: picture.internalId
			},
			async = false;

		// data.backgroundImage = 'url(resources/images/loader.gif); background-size: initial';

		picture.getImageUrl('thumb', function(err, url) {
			var node;

			if (async) {
				node = me.getNode(picture);
				if (node) {
					Ext.fly(node).down('.waypoint-picture-holder', true).style.backgroundImage = 'url(' + url + ')';
				}
			}
			else {
				data.backgroundImage = 'url(' + url + ')';
			}
		});

		async = true;

		return data;
	},

	// overide View
	getNodeByRecord: function(record) {
		return this.el.getById(this.id + '-record-' + record.internalId, true);
	},

	afterRender: function() {
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

		if (this.ownerCmp && this.ownerCmp.componentLayoutCounter && !this.componentLayoutCounter) {
			// We are within a grid cell and its grid has already layout so we must do the first refresh ourselves.
			this.componentLayoutCounter++;
			this.doFirstRefresh(this.store);
		}
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
			'<div style="margin-top: 3px;">',
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

	onItemMouseDown: function(picture, item, index, e) {
		// Stop propagation of mousedown event to prevent the grid from handling this event if 
		// this view is inside a gridd cell.
		e.stopPropagation();
	},

	onItemClick: function(picture) {
		if (this.preview.showTimer) {
			this.preview.clearTimer('show');
		}
		this.editPicture(picture);
	},

	onItemContextMenu: function() {
		if (this.preview.showTimer) {
			this.preview.clearTimer('show');
		}
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
			project = this.lookupViewModel().get('project'),
			imageInfo = require('imageinfo'),
			async = require('async'),
			picturesToAdd = [];

		async.each(files, function(file, callback) {
			imageInfo(file.path, function(err, info) {
				if (err) {
					console.error(err);
				}
				else {
					picturesToAdd.push({
						filename: file.path,
						name: file.name,
						width: info.width,
						height: info.height,
						orientation: info.orientation
					});
				}
				callback();
			});
		}, function() {
			project.undoManager.beginUndoGroup();
			pictures.add(picturesToAdd);
			project.undoManager.endUndoGroup();
		});
	},

	editPicture: function(picture) {
		Ext.widget('edit.picture', {
			picture: picture,
			session: this.getStore().getSession().spawn()
		});
	},

	duplicatePicture: function(picture) {
		var me = this,
			viewModel,
			project;

		picture.duplicate(function(err, duplicate) {
			viewModel = me.lookupViewModel(),
			project = viewModel && viewModel.get('project'),
			store = me.getStore();

			if (!err && project) {
				project.undoManager.beginUndoGroup();
				store.insert(store.indexOf(picture), duplicate);
				project.undoManager.endUndoGroup();
			}
		});
	},
	
	removePicture: function(picture) {
		var project = this.lookupViewModel().get('project');

		project.undoManager.beginUndoGroup();
		picture.drop();
		project.undoManager.endUndoGroup();
	}

});
