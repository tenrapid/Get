Ext.define('Get.model.TourWaypoint', {
	extend: 'Get.model.Base',
	
	fields: [
		{
			name: 'tourId', 
			reference: {
				parent: 'Tour',
				inverse: {
					storeConfig: {
						// damit kann der Assoziationsstore als Instanz von FeatureStore erzeugt werden
						type: 'tourWaypoint',
					}
				}
			}
		},
		{
			name: 'areaId', 
			reference: {
				type: 'Area',
				inverse: {
					storeConfig: {
						// damit kann der Assoziationsstore als Instanz von FeatureStore erzeugt werden
						type: 'tourWaypoint',
					}
				}
			}
		},
		{
			name: 'waypointId', 
			type: 'int', 
			reference: {
				parent: 'Waypoint',
			}
		},
		{
			name: 'geometry',
			type: 'geometry',
			persist: false,
		},
	]
});
