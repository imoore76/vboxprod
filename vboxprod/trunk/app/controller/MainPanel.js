/*
 * Main Panel Controller
 */
Ext.define('vboxprod.controller.MainPanel', {
    extend: 'Ext.app.Controller',
    
    // Hold nav tree ref so that we only have to get this once
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
    	
    	this.getWelcomeView().hide();
    	this.getGroupTabsView().hide();
    	this.getVMTabsView().hide();
    	
    	// Show welcome
    	if(!record) {
    		this.getWelcomeView().show();
    	// VM selected
    	} else if(record.get('leaf')) {
    		this.getVMTabsView().show();
    	// Group Selected
    	} else {
    		this.getGroupTabsView().show();
    	}
    	console.log(record.get('leaf'));
    	if(record && record.raw && record.raw) {
    		
    	}
    }
    
 	
});