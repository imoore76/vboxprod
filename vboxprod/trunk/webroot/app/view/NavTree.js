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
    	
    	/*,
    	
    	vmContextMenuItems :[
    	    // settings
    		vcube.utils.actionToMenuItemConfig('vm','settings'),
    		// clone
    		vcube.utils.actionToMenuItemConfig('vm','clone'),
    		// remove
    		vcube.utils.actionToMenuItemConfig('vm','remove'),
    		'-',
    		// start
    		vcube.utils.actionToMenuItemConfig('vm','start'),
    		// pause
    		vcube.utils.actionToMenuItemConfig('vm','pause'),
    		// reset
    		vcube.utils.actionToMenuItemConfig('vm','reset'),
    		// stop
    		vcube.utils.actionToMenuItemConfig('vm','stop'),
    		'-',
    		// discard
    		vcube.utils.actionToMenuItemConfig('vm','discard'),
    		// show logs
    		vcube.utils.actionToMenuItemConfig('vm','logs'),
    		'-',
    		// refresh
    		vcube.utils.actionToMenuItemConfig('vm','refresh')
    	]
    	*/
    	
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
