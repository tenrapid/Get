require('shelljs/global');

if (!which('git')) {
	echo('Sorry, this script requires git');
	exit(1);
}

if (exec('git submodule init && git submodule update').code !== 0) {
	echo('Error: git submodule init && git submodule update failed');
	exit(1);
}

cd('openlayers/build');

if (exec('./build.py').code !== 0) {
	echo('Error: ./build.py failed');
	exit(1);
}

cd('../..');

mkdir('-p', 'resources/js/openlayers');
cp('-R', 'openlayers/build/OpenLayers.js', 'openlayers/img', 'openlayers/theme', 'resources/js/openlayers'); 