Ext.define('vcube.controller.VMTabConsole', {
    extend: 'Ext.app.Controller',
    refs : [{
    	selector: 'viewport > MainPanel > VMTabs',
    	ref: 'VMTabsView'
    },{
    	selector: 'viewport > MainPanel > VMTabs > VMTabConsole',
    	ref: 'VMTabConsoleView'
    }],
    
    /* True if loaded vm data is not current */
    dirty: true,
    
    /* Watch for events */
    init: function(){
    	
        /* Tree events */
        this.control({
        	'viewport > MainPanel > VMTabs' : {
        		vmloaded: this.vmloaded
        	},
        	'viewport > MainPanel > VMTabs > VMTabConsole' : {
        		show: this.loadVMData
        	}
        });
        
    },

    /* Load cached data */
    loadVMData: function() {
    	
    	/* data already loaded */
    	if(!this.dirty) return;
    	
		// batch of updates
		Ext.suspendLayouts();
		this.vmloaded(this.getVMTabsView().vmData);
		Ext.resumeLayouts(true);

    },
   
    /* VM data is loaded */
    vmloaded: function(data) {

    	var self = this;
    	var consoleTab  = self.getVMTabConsoleView();
    	
    	// If vm is inaccessible, disable this tab
    	if(!data.accessible) {
    		consoleTab.disable();
    		return;
    	} else {
    		consoleTab.enable();
    	}
    	
    	return;
    }

});
