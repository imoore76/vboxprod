Ext.define('vcube.controller.VMTabDetails', {
    
	extend: 'Ext.app.Controller',
	
    refs : [{
    	selector: 'viewport > MainPanel > VMTabs',
    	ref: 'VMTabsView'
    },{
    	selector: 'viewport > MainPanel > VMTabs > VMTabDetails',
    	ref: 'VMTabDetailsView'
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
        	'viewport > MainPanel > VMTabs > VMTabDetails' : {
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
    	var detailsTab  = self.getVMTabDetailsView();
    	
    	// If vm is inaccessible, disable this tab
    	if(!data.accessible) {
    		detailsTab.disable();
    		return;
    	} else {
    		detailsTab.enable();
    	}
    	
    	// No need to load everything if the
    	// tab isn't visible
    	if(!detailsTab.isVisible()) {
    		self.dirty = true;
    		return;
    	}
    	self.dirty = false;
    	
    	detailsTab.removeAll(true);
    
		// Details tab tables
		for(var i in vcube.view.VMTabDetails.vmDetailsSections) {
			
			if(typeof(i) != 'string') continue;
			
			detailsTab.add(vcube.view.VMTabs.sectionTable(vcube.view.VMTabDetails.vmDetailsSections[i], data));

		}


    }
});
