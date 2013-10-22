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
    		
    	},
    	
    	machineContextMenuItems: [
    	
    	    // settings
    		vcube.actionpool.getAction('machine','settings'),
    		// clone
    		vcube.actionpool.getAction('machine','clone'),
    		// remove
    		vcube.actionpool.getAction('machine','remove'),
    		'-',
    		// start
    		vcube.actionpool.getAction('machine','start'),
    		// pause
    		vcube.actionpool.getAction('machine','pause'),
    		// reset
    		vcube.actionpool.getAction('machine','reset'),
    		// stop
    		Ext.Object.merge({},vcube.actionpool.getActionsAsBase('machine',['stop'])[0],{
    			menu: vcube.actionpool.getActions('machine',['savestate','powerbutton','poweroff'])
    		}),
    		
    		'-',
    		// discard
    		vcube.actionpool.getAction('machine','discard'),
    		// show logs
    		vcube.actionpool.getAction('machine','logs'),
    		'-',
    		// refresh
    		vcube.actionpool.getAction('machine','refresh')
	]
    	
    	
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
