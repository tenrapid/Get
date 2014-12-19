require('shelljs/global');

// init and update submodules
if (!which('git')) {
	echo('Sorry, this script requires git');
	exit(1);
}
if (exec('git submodule init && git submodule update').code !== 0) {
	echo('Error: git submodule init && git submodule update failed');
	exit(1);
}

// build OpenLayers
pushd('openlayers/build');
if (exec('./build.py').code !== 0) {
	echo('Error: ./build.py failed');
	exit(1);
}
popd();

mkdir('-p', 'resources/js/openlayers');
cp('-R', 'openlayers/build/OpenLayers.js', 'openlayers/img', 'openlayers/theme', 'resources/js/openlayers'); 

// build node-sqlite3 for node-webkit
pushd('node_modules/sqlite3');
exec('node_modules/node-pre-gyp/bin/node-pre-gyp build --runtime=node-webkit --target_arch=x64 --target=0.11.2');
popd();
