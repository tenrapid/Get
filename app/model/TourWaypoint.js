Ext.define('Get.model.TourWaypoint', {
    extend: 'Get.model.Base',
    
    fields: [
		{
			name: 'tourId', 
			type: 'int', 
			reference: {
				parent: 'Tour',
				inverse: {
					storeConfig: {
						// damit kann der Assoziationsstore als Instanz von FeatureStore erzeugt werden
						type: 'tourWaypoints',
					}
				}
			}
		},
		{
			name: 'areaId', 
			type: 'int', 
			reference: {
				parent: 'Area',
				inverse: {
					storeConfig: {
						// damit kann der Assoziationsstore als Instanz von FeatureStore erzeugt werden
						type: 'tourWaypoints',
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
