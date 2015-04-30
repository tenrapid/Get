Ext.define('Get.model.TourWaypoint', {
	extend: 'Get.model.Base',
	
	fields: [
		{
			name: 'tourId',
			// Set the default value of foreign keys that can be undefined to "null" because during a drop
			// they are set to null, which causes the record to be dirty after undoing the drop.
			defaultValue: null,
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
			name: 'tourIndex',
			type: 'int',
			defaultValue: -1
		},
		{
			name: 'areaId', 
			defaultValue: null,
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
			name: 'areaIndex',
			type: 'int',
			defaultValue: -1
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
