 /* 
 * view/NavTree
 */
Ext.define('vcube.view.NavTree', {
    extend: 'Ext.tree.Panel',
    alias: 'widget.NavTree',
    width: 300,
    cls: 'vcubeNavTree',
    viewConfig:{
        markDirty:false
    },
    rootVisible: false,
    lines: false,
    useArrows: true,
    root: {
		allowDrag: false,
		allowDrop: false,
    	expanded: true
    },
    viewConfig: {
    	plugins: {
	    	ptype: 'treeviewdragdrop',
	    	allowContainerDrop: false,
	    	allowParentInsert: false,
	    	ddGroup: 'navtreevms'
    	}
	}
});
