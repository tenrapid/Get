/*
 * This file is generated and updated by Sencha Cmd. You can edit this file as
 * needed for your application, but these edits will have to be merged by
 * Sencha Cmd when upgrading.
 */
Ext.application({
    name: 'Get',

    extend: 'Get.Application',
    
    autoCreateViewport: 'Get.view.main.Main',
	
    //-------------------------------------------------------------------------
    // Most customizations should be made to Get.Application. If you need to
    // customize this file, doing so below this section reduces the likelihood
    // of merge conflicts when upgrading to new versions of Sencha Cmd.
    //-------------------------------------------------------------------------
	paths: {
		GeoExt: 'libs/geoext2/src/GeoExt'
	},
});

// Catch uncaught node.js exceptions
// Prevent node-webkit exception page on uncaught exeptions
if (window.process) {
	(function() {
		var production = true,
			uncaughtExceptionHandler = function(err) {
				if (production && Ext && Ext.Msg) {
					Ext.Msg.show({
						title: 'Error',
						icon: Ext.Msg.ERROR,
						buttons: Ext.Msg.OK,
						message: err.stack.replace(/\n/g, '<br>')
					});
				}
			};
		//<debug>
		production = false;
		//</debug>

		process.on('uncaughtException', uncaughtExceptionHandler);
		window.addEventListener('unload', function() {
			process.removeListener('uncaughtException', uncaughtExceptionHandler);
		});
	})();
}
