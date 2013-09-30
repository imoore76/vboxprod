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
    	
    	/* Get redraw events from details sections */
		var redrawEvents = {};
		for(var i in vcube.view.VMTabDetails.vmDetailsSections) {
			
			if(typeof(i) != 'string') continue;
			
			console.log("This is.");
			console.log(this);
			
			if(vcube.view.VMTabDetails.vmDetailsSections[i].redrawOnEvents) {
				Ext.each(vcube.view.VMTabDetails.vmDetailsSections[i].redrawOnEvents,function(event){
					redrawEvents[event] = this.redrawEvent;
				});
			}

		}
		
		console.log(redrawEvents);
		this.application.on(Ext.apply(redrawEvents,{scope:this}));

    	
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
    
    /* Redraw events */
    redrawEvent : function(eventData) {
    	
    	
    	console.log("here1");
    	console.log(eventData);
    	console.log("this");
    	console.log(this);
    	if(eventData.machineId != this.getVMTabsView().vmData.id)
    		return;
    	
    	console.log("here2");
    	if(!self.getVMTabDetailsView().isVisible()) return;
    	
    	console.log("here3");
    	var sections = {};
		if(vcube.view.VMTabDetails.vmDetailsSections[i].redrawOnEvents && Ext.contains(vcube.view.VMTabDetails.vmDetailsSections[i].redrawOnEvents, eventData.eventType)) {
			sections[i] = true;
		}
		
		Ext.ux.Deferred.when(vcube.datamediator.getVMDataCombined(eventData.machineId)).done(function(data) {
			
			console.log("here4");
	    	if(data.id != this.getVMTabsView().vmData.id)
	    		return;
	    	
	    	console.log("here5");
	    	if(!this.getVMTabDetailsView().isVisible()) {
	    		this.dirty = true;
	    		return;
	    	}
	    	console.log("here6");

	    	for(var section in sections) {
	    		
	    		if(!typeof(section) == 'string') continue;
	    		
	    		this.getVMTabDetailsView().down('#'+section).remove(false)
	    		this.getVMTabDetailsView().add(vcube.view.VMTabs.sectionTable(vcube.view.VMTabDetails.vmDetailsSections[section], data, section));
	    		
	    		//var oldSection = this.getVMTabDetailsView().down('#'+section).remove();
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
			
			detailsTab.add(vcube.view.VMTabs.sectionTable(vcube.view.VMTabDetails.vmDetailsSections[i], data, i));

		}


    }
});
