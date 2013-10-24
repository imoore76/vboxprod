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
    },{
    	selector: 'viewport > #MainPanel > VirtualMachinesList',
    	ref: 'VMListsView'
    }],
    
    /* Watch for events */
    init: function(){
    	
        /* Tree events */
        this.control({
        	'NavTree' : {
        		selectionchange: this.onSelectionChange
        	}
        });
    },
    
    /* An selection in the tree has changed */
    onSelectionChange: function(panel, records) {
    	
    	var welcome = this.getWelcomeView();
    	var groupTabs = this.getGroupTabsView();
    	var vmTabs = this.getVMTabsView();
    	var serverTabs = this.getServerTabsView();
    	var vmList = this.getVMListsView();
    	
    	if(records.length) {
    		
    		record = records[0];
    		
    	} else {
    		
    		if(welcome.isVisible()) return;
    		serverTabs.hide();
    		groupTabs.hide();
    		vmTabs.hide();
    		vmList.hide();
    		welcome.show();
    		return;

    	}
    	
    	switch(record.get('type')) {

    		case 'vm':
	    		if(vmTabs.isVisible()) return;
	    		groupTabs.hide();
	    		welcome.hide();
	    		serverTabs.hide();
	    		vmList.hide();
	    		vmTabs.show();
	    		break;
	    	
    		case 'vmgroup':
    			if(groupTabs.isVisible()) return;
    			welcome.hide();
    			serverTabs.hide();
    			vmTabs.hide();
    			vmList.hide();
    			groupTabs.show();
	    		break;

    		case 'server':
    			if(serverTabs.isVisible()) return;
    			welcome.hide();
    			vmTabs.hide();
    			groupTabs.hide();
    			vmList.hide();
    			serverTabs.show();
	    		break;

    		case 'vmsFolder':
    			serverTabs.hide();
    			groupTabs.hide();
    			vmTabs.hide();
    			welcome.hide();
    			vmList.show();
	    		break;
    	}
    		    		
    		
    }
    
 	
});