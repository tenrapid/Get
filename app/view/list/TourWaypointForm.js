Ext.define('Get.view.list.TourWaypointForm', {
	extend: 'Ext.form.Panel',

	alias: 'widget.list.tourwaypoint-form',

	viewModel: true,

	border: false,
	layout: 'anchor',

	fieldDefaults: {
		labelAlign: 'top',
		labelStyle: 'font-weight: bold; font-size: 11px; color: #aaa; text-transform: uppercase; letter-spacing: 1px;'
	},

	items: [
		{
			xtype: 'fieldcontainer',
			layout: 'hbox',
			fieldLabel: 'Aufgabe',
			anchor: '100%',
			items: [
				{
					xtype: 'textarea',
					grow: true,
					flex: 1,
					minHeight: 61,
					bind: '{tourWaypoint.task}'
				},
				{
					xtype: 'picturecombobox',
					width: 79,
					height: 61,
					bind: {
						store: '{tourWaypoint.waypoint.pictures}',
						selection: '{tourWaypoint.taskPicture}',
					},
					margin: '0 0 0 6'
				},
			]
		},
		{
			xtype: 'textfield',
			fieldLabel: 'Hinweis',
			bind: '{tourWaypoint.hint}',
			anchor: '100%',
		},
		{
			xtype: 'fieldcontainer',
			layout: 'hbox',
			fieldLabel: 'Aufbau',
			anchor: '100%',
			items: [
				{
					xtype: 'textarea',
					grow: true,
					flex: 1,
					minHeight: 61,
					bind: '{tourWaypoint.setup}'
				},
				{
					xtype: 'picturecombobox',
					width: 79,
					height: 61,
					bind: {
						store: '{tourWaypoint.waypoint.pictures}',
						selection: '{tourWaypoint.setupPicture}',
					},
					margin: '0 0 0 6'
				},
			]
		},
	],

	bindTourWaypoint: function(tourWaypoint) {
		var viewModel = this.getViewModel(),
			pictures = null;

		if (tourWaypoint) {
			pictures = tourWaypoint.getWaypoint().pictures();
			pictures.complete = true;
			pictures.remoteFilter = false;

			// // We need to set and notify the picture store first so that the picture combobox creates a new pictureSelectionModel.
			// // After that we can safely set and notify the tourWaypoint which will the selected value of the picture combobox. 
			// viewModel.set('pictures', pictures);
			// viewModel.notify();
			// viewModel.set('tourWaypoint', tourWaypoint);
			// viewModel.notify();
		}
		// else {
		// 	// On unbind the order of setting and notifying is the opposite to the above 
		// 	// bind of a picture store to the picture combobox.
		// 	viewModel.set('tourWaypoint', tourWaypoint);
		// 	viewModel.notify();
		// 	viewModel.set('pictures', pictures);
		// 	viewModel.notify();
		// }
		viewModel.set('tourWaypoint', tourWaypoint);
		// viewModel.notify();

		// if (!tourWaypoint) {
		// 	this.query('picturecombobox').forEach(function(pictureCombobox) {
		// 		pictureCombobox.setValue(null);
		// 	});
		// }
	},

	// beforeShow: function() {
	// 	this.getViewModel().notify();
	// },

});
