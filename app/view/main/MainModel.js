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
			return (get('project.name') || 'Get') + (get('project.isModified') ? '*' : '');
		},
	},
	
	stores: {
	},    

});
