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
    	selector: 'viewport > #MainPanel > Welcome',
    	ref: 'WelcomeView'
    },{
    	selector: 'viewport > #MainPanel > GroupTabs',
    	ref: 'GroupTabsView'
    },{
    	selector: 'viewport > #MainPanel > ServerTabs',
    	ref: 'ServerTabsView'
    },{
    	selector: 'viewport > #MainPanel > VMTabs',
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
    	var serverTabs = this.getServerTabsView();
    	
    		
    	// VM selected
    	if(record.raw.data._type == 'vm') {
    		
    		if(vmTabs.isVisible()) return;
    		groupTabs.hide();
    		welcome.hide();
    		serverTabs.hide();
    		vmTabs.show();
    		
    		
    		
    	// Group Selected
    	} else if(record.raw.data._type == 'vmgroup'){
    		if(groupTabs.isVisible()) return;
    		welcome.hide();
    		serverTabs.hide();
    		vmTabs.hide();
    		groupTabs.show();
    		
    	// Server selected
    	} else if(record.raw.data._type == 'server') {
    		if(serverTabs.isVisible()) return;
    		welcome.hide();
    		vmTabs.hide();
    		groupTabs.hide();
    		serverTabs.show();
    		
    		
    		
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