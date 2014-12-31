Ext.define('Get.view.main.MainController', {
    extend: 'Ext.app.ViewController',

    requires: [
        'Ext.data.Request',
        'Ext.data.operation.Operation',
        'Get.Project',
    ],

    alias: 'controller.main',

	init: function() {
		var project = Ext.create('Get.Project', {
			name: 'Dresden'
		});
		this.load(project);

		var me = this;
// 		setTimeout(function() {
// 			project = Ext.create('Get.Project', {
// 				name: 'Berlin'
// 			})
// 			me.load(project);
// 		}, 4000);
	},
	
	load: function(project) {
		var me = this,
			viewModel = me.getViewModel(),
			currentProject = viewModel.get('project');
			
		if (currentProject) {
			me.unload(currentProject);
		}
		project.load(me.onLoad, me);
	},
	
	save: function() {
		var me = this,
			viewModel = me.getViewModel(),
			currentProject = viewModel.get('project');
		
		currentProject.save();
// 		var jsonString = currentProject.save();
// 		Ext.create('Ext.window.Window', {
// 			autoScroll: true,
// 			autoShow: true,
// 			html: '<pre>' + jsonString + '</pre>',
// 			height: 600,
// 			width: 800,
// 			title: 'json',
// 		});
	},
	
	onLoad: function(project) {
		var me = this,
			view = me.getView(),
			viewModel = me.getViewModel();
			
		project.waypointStore.setStoreId('waypoints');
		Ext.data.StoreManager.register(project.waypointStore);
		
		view.setSession(project.session);
		viewModel.setSession(project.session);
		viewModel.set('project', project);
		viewModel.notify();
		
 		me.fireEvent('projectLoad');
	},
	
	unload: function(project) {
		var me = this,
			viewModel = me.getViewModel();
			
		me.fireEvent('projectUnload');
		viewModel.set('project', null);
		viewModel.notify();
		project.destroy();
		project = null;
	},

});
