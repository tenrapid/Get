Ext.define('Ext.patch.container.Container', {
    override: 'Ext.container.Container',
    compatibility: '5.1.0.107',
    
    //EXTJS-16180
    disable: function() {
        this.callSuper(arguments);

        var itemsToDisable = this.getChildItemsToDisable(),
            length         = itemsToDisable.length,
            item, i;

        for (i = 0; i < length; i++) {
            item = itemsToDisable[i];

            if (item.resetDisable !== false && !item.disabled) {
                item.disable();
                item.resetDisable = true;
            }
        }

        return this;
    }
});
