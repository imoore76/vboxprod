Ext.define('vcube.controller.VMTabDetails', {
    
	extend: 'Ext.app.Controller',
	
    refs : [{
    	selector: 'viewport > MainPanel > VMTabs',
    	ref: 'VMTabsView'
    },{
    	selector: 'viewport > NavTree',
    	ref: 'NavTreeView'
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
			
			var self = this;
			if(vcube.view.VMTabDetails.vmDetailsSections[i].redrawOnEvents) {
				Ext.each(vcube.view.VMTabDetails.vmDetailsSections[i].redrawOnEvents,function(event){
					redrawEvents[event] = self.onRedrawEvent;
				});
			}
			redrawEvents['scope'] = this;
		}		
		this.application.on(redrawEvents);
		
		// Redraw entire tab on machine data change
		this.application.on({
			'MachineDataChanged': this.onMachineDataChanged,
			scope: this
		});
		
        this.control({
	        'viewport > MainPanel > VMTabs > VMTabDetails' : {
	        	show: this.onTabShow,
	        	render: function() {
	        		this.navTreeSelectionModel = this.getNavTreeView().getSelectionModel();
	        	}
	        },
        	'viewport > NavTree' : {
        		select: this.onSelectItem
        	}
        });
        
        
    },
    
    /* Nav tree selection model cache */
    navTreeSelectionModel : null,
    
    /* True if VM data displayed is not current */
    dirty: true,
    
    /* When tab is shown */
    onTabShow: function() {
    	
    	if(!this.dirty) return;
    	
    	this.showVMDetails(this.navTreeSelectionModel.getSelection()[0].raw.data.id);
    	
    },
    
    /* When item is selected */
    onSelectItem: function(row, record) {
    	
    	this.dirty = true;
    	
    	// Only load if VM is selected
    	if(!record || record.raw.data._type != 'vm')
    		return;

    	this.showVMDetails(record.raw.data.id);
    },
    
    /* Machine data changed, redraw */
    onMachineDataChanged: function(eventData) {
    	
    	// is this tab still visible?
    	if(!this.getVMTabDetailsView().isVisible()) {
    		this.dirty = true;
    		return;
    	}

    	// Is this VM still selected
    	if(!vcube.utils.isThisVMSelected(eventData.machineId, this.navTreeSelectionModel))
    		return;
    	
    	this.showVMDetails(eventData.machineId);

    },
  
    /* Redraw events */
    onRedrawEvent : function(eventData) {
    	
    	var self = this;

    	// is this tab still visible?
    	if(!this.getVMTabDetailsView().isVisible()) {
    		this.dirty = true;
    		return;
    	}

    	// Is this VM still selected
    	if(!vcube.utils.isThisVMSelected(eventData.machineId, this.navTreeSelectionModel))
    		return;
    	
    	
    	// Compose a list of sections that want to redraw
    	// on this type of event
    	var sections = [];
    	for(var i in vcube.view.VMTabDetails.vmDetailsSections) {
    		if(typeof(i) != 'string') continue;
			if(vcube.view.VMTabDetails.vmDetailsSections[i].redrawOnEvents && Ext.Array.contains(vcube.view.VMTabDetails.vmDetailsSections[i].redrawOnEvents, eventData.eventType)) {
				sections.push(i);
			}
    	}
    	
    	// Get fresh VM data
		Ext.ux.Deferred.when(vcube.vmdatamediator.getVMDataCombined(eventData.machineId)).done(function(data) {
			
			// Is this VM still selected?
			if(!vcube.utils.isThisVMSelected(data.id, self.navTreeSelectionModel))
	    		return;
	    	
	    	// Is this tab still visible
	    	if(!self.getVMTabDetailsView().isVisible()) {
	    		self.dirty = true;
	    		return;
	    	}

	    	// Redraw each section that wants to be redrawn
	    	Ext.each(self.getVMTabDetailsView().items.items, function(section, idx) {
	    		
	    		if(!Ext.Array.contains(sections, section.itemId)) {
	    			return;
	    		}
	    		
	    		self.getVMTabDetailsView().remove(section, true);
	    		
	    		self.getVMTabDetailsView().insert(idx, Ext.create('vcube.view.SectionTable',{
	    			sectionCfg: vcube.view.VMTabDetails.vmDetailsSections[section.itemId],
	    			'data':data,
	    			'name':section.itemId}));
	    		
	    	});
	    	
	    	self.getVMTabDetailsView().doLayout();
			
		});
    	
    },

    /* Load cached data */
    showVMDetails: function(vmid) {
    	
    	var data = vcube.vmdatamediator.getVMData(vmid);
    	
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
    	
    	    	
    	detailsTab.setLoading(true);
    	
    	var self = this;
    	
    	Ext.ux.Deferred.when(vcube.vmdatamediator.getVMDataCombined(vmid)).done(function(data) {
    		
    		detailsTab.setLoading(false);
    		
    		if(!detailsTab.isVisible()) return;
    		if(!vcube.utils.isThisVMSelected(data.id, self.navTreeSelectionModel)) return;
    		
    		// batch of updates
    		Ext.suspendLayouts();
    	
    		detailsTab.removeAll(true);

			// Details tab tables
			for(var i in vcube.view.VMTabDetails.vmDetailsSections) {
				
				if(typeof(i) != 'string') continue;
				
				detailsTab.add(Ext.create('vcube.view.SectionTable',{
					sectionCfg : vcube.view.VMTabDetails.vmDetailsSections[i],
					'data': data,
					'name': i}));
	
			}

			Ext.resumeLayouts(true);
    	})
    }
});
