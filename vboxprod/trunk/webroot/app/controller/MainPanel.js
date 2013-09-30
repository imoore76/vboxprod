/*
 * Main Panel Controller
 */
Ext.define('vcube.controller.MainPanel', {
    extend: 'Ext.app.Controller',
    
    // View references
    refs : [{
    	selector: 'viewport > NavTree',
    	ref: 'NavTreeView'
    },{
    	selector: 'viewport > MainPanel > Welcome',
    	ref: 'WelcomeView'
    },{
    	selector: 'viewport > MainPanel > GroupTabs',
    	ref: 'GroupTabsView'
    },{
    	selector: 'viewport > MainPanel > VMTabs',
    	ref: 'VMTabsView'
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
    	
    	var welcome = this.getWelcomeView();
    	var groupTabs = this.getGroupTabsView();
    	var vmTabs = this.getVMTabsView();
    	
    		
    	// VM selected
    	if(record.raw.data._type == 'vm') {
    		
    		if(vmTabs.isVisible()) return;
    		groupTabs.hide();
    		welcome.hide();
    		vmTabs.show();
    		
    		
    		
    	// Group Selected
    	} else if(record.raw.data._type == 'vmgroup'){
    		if(groupTabs.isVisible()) return;
    		welcome.hide();
    		vmTabs.hide();
    		groupTabs.show();
    	}
    	// Show welcome
    	else {
			if(welcome.isVisible()) return;
			groupTabs.hide();
			vmTabs.hide();
			welcome.show();
    	}
    }
    
 	
});