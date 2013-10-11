 /* 
 * view/NavTree
 */
Ext.define('vcube.view.NavTree', {
    extend: 'Ext.tree.Panel',
    alias: 'widget.NavTree',
    
    statics: {
    	
    	/*
    	 * Generate VM tooltip
    	 */
    	vmTip: function(vm) {
    		
    	},
    	
    	/*
    	 * Generate server tooltip
    	 */
    	serverTip: function(server) {
    		
    	},
    	
    	/*
    	 * Generate group tooltip
    	 */
    	groupTip: function(group) {
    		
    	}
    	
    },
    
    width: 300,
    cls: 'vcubeNavTree',
    rootVisible: false,
    lines: false,
    useArrows: true,
    root: {
		allowDrag: false,
		allowDrop: false,
    	expanded: true
    },
    folderSort: true,
    viewConfig: {
    	markDirty:false,
    	plugins: {
	    	ptype: 'treeviewdragdrop',
	    	allowContainerDrop: false,
	    	allowParentInsert: false,
	    	ddGroup: 'navtreevms',
	    	appendOnly: true
    	}
	}
});
