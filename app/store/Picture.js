Ext.define('Get.store.Picture', {
	extend: 'Ext.data.Store',
	model: 'Get.model.Picture',
	alias: 'store.picture',

	mixins: [
		'Get.data.PersistentIndexStore'
	],

	pageSize: 0
});
