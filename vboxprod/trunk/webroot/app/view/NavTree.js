 /* 
 * view/NavTree
 */
Ext.define('vcube.view.NavTree', {
    extend: 'Ext.tree.Panel',
    alias: 'widget.NavTree',
    width: 300,
    viewConfig:{
        markDirty:false
    },
    rootVisible: false,
    lines: false,
    useArrows: true,
    root: {
    	expanded: true
    }
});
