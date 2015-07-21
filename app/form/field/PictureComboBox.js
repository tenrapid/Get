Ext.define('Get.form.field.PictureComboBox', {
	extend: 'Ext.form.field.ComboBox',
	requires: [
		'Get.form.trigger.ClearPicker'
	],

	xtype: 'picturecombobox',

	cls: 'picture-combobox',

	triggers: {
		picker: {
			type: 'clearpicker',
			clearHandler: 'onClearClick'
		}
	},
	triggerCls: null,
	
	editable: false,
	queryMode: 'local',
	valueField: 'id',
	displayField: 'id',

	listConfig: {
		tpl: [
			'<tpl for=".">',
				'<li class="waypoint-picture">',
					'<div class="waypoint-picture-thumbnail">',
						'<div class="waypoint-picture-holder" style="background-image: {backgroundImage}; {transformStyle}"></div>',
					'</div>',
					'<div class="waypoint-picture-name">{name}</div>',
				'</li>',
			'</tpl>',
		],

		itemCls: 'waypoint-picture',

		minWidth: 200,
		maxHeight: 330,

		prepareData: function(_data, index, picture) {
			var me = this,
				data = Ext.Object.chain(_data);

			data.backgroundImage = 'none';
			data.transformStyle = picture.getTransformCenteredStyle();

			picture.getImageUrl('thumb', function(err, url) {
				var node = me.store && me.getNode(picture);

				if (node) {
					Ext.fly(node).down('.waypoint-picture-holder', true).style.backgroundImage = 'url(' + url + ')';
				}
			});

			return data;
		}
	},

	matchFieldWidth: false,
	emptyText: '\uf03e',

	updateValue: function() {
		var me = this,
			picture;
		
		this.callParent();

		if (!this.inputEl) return;

		picture = this.getSelectedRecord();
		if (picture) {
			picture.getImageUrl('thumb', function(err, url) {
				me.inputEl
					.setStyle('background-image', 'url(' + url + ')')
					.applyStyles(picture.getTransformCenteredStyle());
			});
		}
		else {
			this.inputEl.setStyle({
				'background-image': 'none',
				'transform': 'none'
			});
		}
		this.triggers.picker.setClearEnabled(!!picture);
	},

	checkValueOnChange: function() {
		this.callParent(arguments);
		if (!this.getSelectedRecord()) {
			// Set value to null if the corresponding picture was removed
			this.setValue(null);
		}
	},

	onBindStore: function() {
		this.callParent(arguments);
		this.setDisabled(!this.store.count());
	},

	onDataChanged: function() {
		this.callParent(arguments);
		this.setDisabled(!this.store.count());
	},

	onClearClick: function() {
		this.setValue(null);
	}

});
