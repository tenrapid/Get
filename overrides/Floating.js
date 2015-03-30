Ext.define('Ext.patch.util.Floating', {
    override: 'Ext.util.Floating',
    compatibility: '5.1.0.107',
    
    // don't show shadow if windows is currently beeing dragged
    onAfterFloatLayout: function(){
        var el = this.el;

        if (el.shadow || el.shim) {
            // An element's underlays (shadow and shim) are automatically synced in response
            // to any calls to Ext.Element APIs that change the element's size or position
            // (setXY, setWidth, etc).  Since the layout system bypasses these APIs and
            // sets the element's styles directly, we need to trigger a sync now.
            if (!(this.dd && this.dd.active)) {
                el.setUnderlaysVisible(true);
            }
            el.syncUnderlays();
        }
    },
});
