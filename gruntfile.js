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
		},
		concurrent: {
			install: ['download-extjs', 'build-openlayers', 'build-node-sqlite3']
		}
	});

	grunt.loadNpmTasks('grunt-exec');
	grunt.loadNpmTasks('grunt-concurrent');

	// Default task
	grunt.registerTask('default', ['exec:run-dev']);

	grunt.registerTask('run', ['exec:run']);

	grunt.registerTask('install', ['git-submodule-init', 'concurrent:install']);

	grunt.registerTask('git-submodule-init', function() {
		var shell = require('shelljs');

		if (!shell.which('git')) {
			grunt.fatal('git required.');
		}
		if (shell.exec('git submodule init && git submodule update').code !== 0) {
			grunt.fatal('git submodule init && git submodule update failed.');
		}
	});

	grunt.registerTask('download-extjs', function() {
		var shell = require('shelljs'),
			done = this.async(),
			Download = require('download');

		shell.mkdir('ext');
		new Download({extract: true, strip: 1})
			.get('http://cdn.sencha.com/ext/gpl/ext-5.1.0-gpl.zip')
			.dest('ext')
			.run(function(err, files, stream) {
				if (err) {
					grunt.warn(err);
				}
				shell.rm('-r', [
					'ext/examples', 
					'ext/plugins', 
					'ext/welcome',
					'ext/index.html',
					'ext/LICENSE',
					'ext/Readme.md',
					'ext/release-notes.html',
					'ext/build/examples',
					'ext/build/packages',
					'ext/build/welcome',
					'ext/build/index.html',
					'ext/build/release-notes.html',
				]);
				done();
			});
	});

	grunt.registerTask('build-openlayers', function() {
		var shell = require('shelljs'),
			done = this.async();

		shell.pushd('openlayers/build');
		shell.exec('./build.py', {silent: true}, function(code, output) {
			if (code !== 0) {
				grunt.log.writeln(output);
				grunt.warn('./build.py failed.');
			}
			shell.popd();
			shell.mkdir('-p', 'resources/js/openlayers');
			shell.cp('-Rf', 'openlayers/build/OpenLayers.js', 'openlayers/img', 'openlayers/theme', 'resources/js/openlayers'); 
			done();
		});
	});

	grunt.registerTask('build-node-sqlite3', function() {
		var shell = require('shelljs'),
			done = this.async(),
			cmd = 'node_modules/node-pre-gyp/bin/node-pre-gyp build --runtime=node-webkit --target_arch=x64 --target=0.11.5';

		shell.pushd('node_modules/sqlite3');
		shell.exec(cmd, {silent: true}, function(code, output) {
			shell.popd();
			if (code !== 0) {
				grunt.log.writeln(output);
				grunt.warn('build-node-sqlite3 failed.');
			}
			done();
		});
	});

};
