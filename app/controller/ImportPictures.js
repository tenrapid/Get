Ext.define('Get.controller.ImportPictures', {
	extend: 'Ext.app.Controller',
	requires: [
		'Get.view.FileDialog',
		'Ext.window.Window',
		'Ext.form.field.Display'
	],

	id: 'importPictures', 

	config: {
		listen: {
			global: {
				'importPicturesMenuItem': 'onImportMenuItem',
			}
		}
	},

	radius: 100,

	onImportMenuItem: function() {
		Get.FileDialog.show({
			multiple: true,
			accept: '.jpg,.jpeg',
			handler: this.onFileDialog,
			scope: this
		});
	},

	onFileDialog: function(files) {
		this.files = files;
		this.openWindow();
		setTimeout(this.loadGpsData.bind(this), 200);
	},

	openWindow: function() {
		this.window = Ext.create('Ext.window.Window', {
			referenceHolder: true,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [
				{
					xtype: 'container',
					reference: 'progressBar',
					items: [
						{
							xtype: 'box',
							html: 'Lade GPS-Daten…',
							style: {
								color: '#444'
							},
							margin: '0 0 2'
						},
						{
							xtype: 'progressbar'
						},
					]
				},
				{
					xtype: 'fieldset',
					title: 'Optionen',
					reference: 'options',
					hidden: true,
					items: [
						{
							xtype: 'fieldcontainer',
							layout: 'hbox',
							items: [
								{
									xtype: 'textfield',
									name: 'radius',
									fieldLabel: 'max. Entfernung von Wegpunkten',
									labelWidth: 200,
									labelAlign: 'right',
									width: 245,
									fieldStyle: {'textAlign': 'right'},
									value: this.radius,
									reference: 'radiusField',
									listeners: {
										change: this.matchImagesToWaypoints,
										scope: this
									}
								},
								{
									xtype: 'displayfield',
									value: '&nbsp;m',
									hideLabel: true,
								}
							]
						}
					]
				},
				{
					xtype: 'box',
					margin: '0 0 10 0',
					reference: 'matchText',
					hidden: true,
				},
				{
					xtype: 'textarea',
					fieldLabel: 'Nicht zugeordnete Bilder',
					labelAlign: 'top',
					height: 128,
					editable: false,
					focusable: false,
					reference: 'noMatchTextarea',
					hidden: true,
					margin: '0 0 0 0',		
				},
			],
			buttons: [
				{
					text: 'Importieren',
					cls: 'btn-ok',
					reference: 'importButton',
					hidden: true,
					handler: this.addImagesToWaypoints,
					scope: this
				},
				{
					text: 'Abbrechen',
					reference: 'cancelButton',
					hidden: true,
					handler: this.closeWindow,
					scope: this
				},
			],
			listeners: {
				afterrender: function(component, options) {
					component.query('textfield').forEach(function(textfield) {
						if (!textfield.isXType('textarea')) {
							Ext.create('Ext.util.KeyNav', {
								target: textfield.el,
								enter: function() {
									var okButton = component.down('button[cls~=btn-ok][disabled=false][hidden=false]');
									okButton && okButton.el.dom.click();
								}
							});
						}
					});
				}, 
			},
			title: 'Bilder importieren',
			autoShow: true,
			modal: true,
			resizable: false,
			// closable: false,
			plain: true,
			width: 400,
			bodyStyle: 'border-width: 0;',
			bodyPadding: '10 16 14',
			defaultFocus: 'textfield(true)'
		});
	},

	closeWindow: function() {
		this.window.close();
		this.window = null;
		this.files = null;
		this.images = null;
		this.waypoints = null;
		this.matchImages = null;
		this.noGpsImages = null;
	},

	loadGpsData: function() {
		var me = this,
			imageInfo = require('imageinfo'),
			async = require('async'),
			turf = require('turf'),
			images = this.images = [],
			noGpsImages = this.noGpsImages = [],
			progressBarContainer = this.window.lookupReference('progressBar'),
			progressBar = progressBarContainer.down('progressbar'),
			done = 0;

		async.eachSeries(this.files, function(file, callback) {
			imageInfo(file.path, function(err, info) {
				if (!err && info.latitude !== undefined && info.longitude !== undefined) {
					images.push(turf.point([info.longitude, info.latitude], {
						path: file.path,
						name: file.name,
						width: info.width,
						height: info.height,
						orientation: info.orientation
					}));
				}
				else {
					noGpsImages.push(file.path);
				}
				progressBar.setValue(++done / me.files.length);
				callback();
			});
		}, function(err) {
			progressBarContainer.hide();
			me.window.lookupReference('matchText').show();
			me.window.lookupReference('noMatchTextarea').show();
			me.window.lookupReference('options').setVisible(images.length > 0);
			me.window.lookupReference('importButton').show();
			me.window.lookupReference('cancelButton').show();
			me.window.focus();
			me.window.center();
			me.createWaypointFeatures();
			me.matchImagesToWaypoints();
		});
	},

	createWaypointFeatures: function() {
		var turf = require('turf'),
			projection = new OpenLayers.Projection("EPSG:4326"),
			project = this.getApplication().getMainView().getViewModel().get('project'),
			waypointStore = project.waypointStore;

		this.waypoints = turf.featurecollection(waypointStore.getRange().map(function(waypoint) {
			return {
				type: 'Feature',
				geometry:  waypoint.get('geometry').toGeoJson(projection),
				properties: {
					waypoint: waypoint
				}	
			};
		}));		
	},

	matchImagesToWaypoints: function() {
		var me = this,
			turf = require('turf'),
			matchImages = this.matchImages = [],
			noMatchImages = [],
			matchText = this.window.lookupReference('matchText'),
			noMatchTextarea = this.window.lookupReference('noMatchTextarea'),
			matchTextValue,
			noMatchTextareaValue,
			noMatchTextareaLabel;

		this.radius = this.window.lookupReference('radiusField').getValue();

		this.images.forEach(function(image) {
			var nearest = turf.nearest(image, me.waypoints);
			if (turf.distance(image, nearest) * 1000 < me.radius) {
				image.properties.waypoint = nearest.properties.waypoint;
				matchImages.push(image);
			}
			else {
				noMatchImages.push(image.properties.path);
			}
		});

		matchTextValue = [
			matchImages.length ? matchImages.length : 'Keine',
			matchImages.length === 1 ? ' Bild ' : ' Bilder ',
			'Wegpunkten zugeordnet.'
		].join('');
		matchText.setHtml(matchTextValue);

		noMatchTextareaValue = noMatchImages.concat(this.noGpsImages.length ? ['Keine GPS-Daten:'].concat(this.noGpsImages) : []);
		noMatchTextarea.setValue(noMatchTextareaValue.join('\n'));

		var len = noMatchImages.length + this.noGpsImages.length;
		noMatchTextareaLabel = len ? 
			[
				len,
				' nicht',
				len === 1 ? ' zugeordnetes' : ' zugeordnete',
				len === 1 ? ' Bild' : ' Bilder'
			].join('') :
			'Nicht zugeordnete Bilder';
		noMatchTextarea.setFieldLabel(noMatchTextareaLabel);

		this.window.lookupReference('importButton').setDisabled(matchImages.length === 0);
	},

	addImagesToWaypoints: function() {
		var project = this.getApplication().getMainView().getViewModel().get('project');

		if (this.matchImages.length) {
			project.undoManager.beginUndoGroup();
			this.matchImages.forEach(function(image) {
				image.properties.waypoint.pictures().add({
					filename: image.properties.path,
					name: image.properties.name,
					width: image.properties.width,
					height: image.properties.height,
					orientation: image.properties.orientation
				});
			});
			project.undoManager.endUndoGroup();
		}

		this.closeWindow();
	}

});
