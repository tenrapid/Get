module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		exec: {
			'run-dev': {
				cmd: 'npm start'
			},
			'run': {
				cmd: 'node_modules/.bin/nodewebkit build/production/Get/'
			},
		}
	});

	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-exec');

	// Default task(s).
	grunt.registerTask('default', ['exec:run-dev']);
	grunt.registerTask('run', ['exec:run']);

};