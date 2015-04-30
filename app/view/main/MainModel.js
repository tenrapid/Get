Ext.define('Get.view.main.MainModel', {
	extend: 'Ext.app.ViewModel',
	alias: 'viewmodel.main',
	
	data: {
		project: null,
	}, 
	
	formulas: {
		uiDisabled: function (get) {
			return get('project') ? false : true;
		},
		windowTitle: function (get) {
			var project = get('project'),
				name = get('project.name'),
				isModified = get('project.isModified'),
				phantom = project && project.phantom;
			return project ? name + (phantom ? '' : '.get') + (isModified ? '*' : '') : 'Get';
		},
	},
	
	stores: {
	},    

});
