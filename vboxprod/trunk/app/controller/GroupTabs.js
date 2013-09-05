/*
 * Group Tabs Controller
 */
Ext.define('vboxprod.controller.GroupTabs', {
    extend: 'Ext.app.Controller',
    
    // Hold nav tree ref so that we only have to get this once
    refs : [{
    	selector: 'viewport > NavTree',
    	ref: 'NavTreeView'
    }],
    
    /* Watch for events */
    init: function(){
    	
        /* Tree events */
        this.control({
        	'NavTree' : {
        		select: this.selectItem
        	}
        });
    },
    
    /* An item is selected */
    selectItem: function(row,record,index,eOpts) {

    	// Only load if group is selected
    	if(!record || record.get('leaf'))
    		return;

    }
    
 	
});