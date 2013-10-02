/*
 * VM summary tab controller
 */
Ext.define('vcube.controller.VMTabSummary', {
    extend: 'Ext.app.Controller',
    	
    refs : [{
    	selector: 'viewport > MainPanel > VMTabs',
    	ref: 'VMTabsView'
    },{
    	selector: 'viewport > NavTree',
    	ref: 'NavTreeView'
    },{
    	selector: 'viewport > MainPanel > VMTabs > VMTabSummary',
    	ref: 'VMTabSummaryView'
    }],
    
    /* Watch for events */
    init: function(){
    	
    	// Get redraw events from details sections
		var redrawEvents = {};
		for(var i in vcube.view.VMTabSummary.vmSummarySections) {
			
			if(typeof(i) != 'string') continue;
			
			var self = this;
			if(vcube.view.VMTabSummary.vmSummarySections[i].redrawOnEvents) {
				Ext.each(vcube.view.VMTabSummary.vmSummarySections[i].redrawOnEvents,function(event){
					redrawEvents[event] = self.onRedrawEvent;
				});
			}
			redrawEvents['scope'] = this;
		}		
		this.application.on(redrawEvents);
		
		// Special case for VM actions
		this.application.on({
			'SessionStateChanged': this.updateVMActions,
			'MachineStateChanged': this.updateVMActions,
			scope: this
		});
		
		
		// Redraw entire tab on machine data change
		this.application.on({
			'MachineDataChanged': this.onMachineDataChanged,
			scope: this
		})

        this.control({
	        'viewport > MainPanel > VMTabs > VMTabSummary' : {
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
    
    /* Holds preview dimension cache */
    resolutionCache : {},
    
    /* preview timers */
    previewTimers : {},

    /* When tab is shown */
    onTabShow: function() {
    	
    	if(!this.dirty) return;
    	
    	this.showVMSummary(this.navTreeSelectionModel.getSelection()[0].raw.data.id);
    	
    },

    /* Machine data changed, redraw */
    onMachineDataChanged: function(eventData) {
    	
    	// is this tab still visible?
    	if(!this.getVMTabSummaryView().isVisible()) {
    		this.dirty = true;
    		return;
    	}

    	// Is this VM still selected
    	if(!vcube.utils.isThisVMSelected(eventData.machineId, this.navTreeSelectionModel))
    		return;
    	
    	this.showVMSummary(eventData.machineId);

    },
    
    /* Redraw events */
    onRedrawEvent : function(eventData) {
    	
    	var self = this;

    	// is this tab still visible?
    	if(!this.getVMTabSummaryView().isVisible()) {
    		this.dirty = true;
    		return;
    	}

    	// Is this VM still selected
    	if(!vcube.utils.isThisVMSelected(eventData.machineId, this.navTreeSelectionModel))
    		return;
    	
    	// Special case for action menu
    	this.updateVMActions();
    	
    	// Compose a list of sections that want to redraw
    	// on this type of event
    	var sections = [];
    	for(var i in vcube.view.VMTabSummary.vmSummarySections) {
    		if(typeof(i) != 'string') continue;
			if(vcube.view.VMTabSummary.vmSummarySections[i].redrawOnEvents && Ext.Array.contains(vcube.view.VMTabSummary.vmSummarySections[i].redrawOnEvents, eventData.eventType)) {
				sections.push(i);
			}
    	}
    	
    	// Get fresh VM data
		vcube.jquery.when(vcube.vmdatamediator.getVMDataCombined(eventData.machineId)).done(function(data) {
			
			// Is this VM still selected?
			if(!vcube.utils.isThisVMSelected(data.id, self.navTreeSelectionModel))
	    		return;
	    	
	    	// Is this tab still visible
	    	if(!self.getVMTabSummaryView().isVisible()) {
	    		self.dirty = true;
	    		return;
	    	}

	    	// Redraw each section that wants to be redrawn
	    	var target = self.getVMTabSummaryView().down('#summaryTables');
	    	Ext.each(target.items.items, function(section, idx) {
	    		
	    		if(!Ext.Array.contains(sections, section.itemId)) {
	    			return;
	    		}
	    		
	    		target.remove(section, true);
	    		
	    		target.insert(idx, vcube.view.VMTabs.sectionTable(vcube.view.VMTabSummary.vmSummarySections[section.itemId], data, section.itemId));
	    		
	    	});
	    	
	    	self.getVMTabSummaryView().doLayout();
			
		});
    	
    },

    /* When item is selected */
    onSelectItem: function(row, record) {
    	
    	this.dirty = true;
    	
    	// Only load if VM is selected
    	if(!record || record.raw.data._type != 'vm')
    		return;

    	this.showVMSummary(record.raw.data.id);
    },
    
    /* Update VM actions */
	updateVMActions: function(eventData) {
		
    	// is this tab still visible?
    	if(eventData && !this.getVMTabSummaryView().isVisible()) {
    		this.dirty = true;
    		return;
    	}

    	// Is this VM still selected
    	if(eventData && !vcube.utils.isThisVMSelected(eventData.machineId, this.navTreeSelectionModel))
    		return;

		var self = this;
		
		Ext.each(this.getVMTabSummaryView().down('#vmactions').items.items, function(item) {
			if(vcube.vmactions[item.itemId].enabled(self.navTreeSelectionModel)) item.enable();
			else item.disable();
		});		
	},

    
    /* Get vm data and show summary */
    showVMSummary: function(vmid) {

    	
    	var summaryTab = this.getVMTabSummaryView();

    	if(!summaryTab.isVisible()) {
    		return;
    	}
    	
    	this.dirty = false;
    	
    	summaryTab.setLoading(true);
    	
    	var self = this;
    	
    	console.log("Getting fresh");

    	vcube.jquery.when(vcube.vmdatamediator.getVMDataCombined(vmid)).done(function(data) {

    		console.log("Got freshy");
    		summaryTab.setLoading(false);
    		
    		if(!summaryTab.isVisible()) return;

    		// Is this VM still selected
        	if(!vcube.utils.isThisVMSelected(data.id, self.navTreeSelectionModel))
        		return;
    		
    		// batch of updates
    		Ext.suspendLayouts();
    		
    		var vmid = data.id;
    		
    		// Check for cached resolution
    		if(self.resolutionCache[vmid]) {				
    			height = self.resolutionCache[vmid].height;
    		} else {
    			height = parseInt(previewWidth / previewAspectRatio);
    		}

    		
    		// Draw preview and resize panel
    		vcube.previewbox.drawPreview(document.getElementById('vboxPreviewBox'), null, previewWidth, height);
    		
    		
    		var __vboxDrawPreviewImg = new Image();			
    		__vboxDrawPreviewImg.onload = function() {

    			var width = previewWidth;
    			
    			// Set and cache dimensions
    			if(this.height > 0) {
    				
    				// If width != requested width, it is scaled
    				if(this.width != previewWidth) {
    					height = this.height * (previewWidth / this.width);
    				// Not scaled
    				} else {					
    					height = this.height;							
    				}

    				self.resolutionCache[vmid] = {
    					'height':height
    				};

    			// Height of image is 0
    			} else {
    				
    				// Check for cached resolution
    				if(self.resolutionCache[vmid]) {				
    					height = self.resolutionCache[vmid].height;
    				} else {
    					height = parseInt(width / previewAspectRatio);
    				}
    				
    				// Clear interval if set
    				var timer = self.previewTimers[vmid];
    				if(timer) window.clearInterval(timer);
    				
    			}
    			
    			// Get fresh VM data
    			var vm = vcube.vmdatamediator.getVMData(vmid);
    			
    			// Return if this is stale
    			if(!vm) {
    				var timer = self.previewTimers[vmid];
    				if(timer) window.clearInterval(timer);
    				self.previewTimers[vmid] = null;
    				return;
    			}
    			
    			// Canvas redraw
    			vcube.previewbox.drawPreview(document.getElementById('vboxPreviewBox'), (this.height <= 1 ? null : this), width, height);
    			
    			summaryTab.down('#PreviewPanel').doLayout();
    		
    		};

    		if(data.accessible) {
    			
    			// Update disabled? State not Running or Saved
    			if(!previewUpdateInterval || (!vcube.utils.vboxVMStates.isRunning(data) && !vcube.utils.vboxVMStates.isSaved(data))) {
    				__vboxDrawPreviewImg.height = 0;
    				__vboxDrawPreviewImg.onload();
    			} else {
    				// Running VMs get random numbers.
    				// Saved are based on last state change to try to let the browser cache Saved screen shots
    				var randid = data.lastStateChange;
    				if(vcube.utils.vboxVMStates.isRunning(data)) {
    					var currentTime = new Date();
    					randid = Math.floor(currentTime.getTime() / 1000);
    				}
    				__vboxDrawPreviewImg.src = 'vbox/machineGetScreenShot?width='+previewWidth+'&vm='+vmid+'&randid='+randid+'&server='+data._serverid;
    				
    			}
    		}
    		

    		/* Update action menu */
    		self.updateVMActions();
    		
    		summaryTab.down('#PreviewPanel').doLayout();
    		
    		summaryTab.down('#baseinfo').update(data);

    		// Summary tab tables
    		var summaryTabTables = summaryTab.down('#summaryTables');
    		summaryTabTables.removeAll();
    		for(var i in vcube.view.VMTabSummary.vmSummarySections) {

    			if(typeof(i) != 'string') continue;
    			
    			if(!vcube.view.VMTabSummary.vmSummarySections[i].condition(data)) continue;
    			
    			summaryTabTables.add(vcube.view.VMTabs.sectionTable(vcube.view.VMTabSummary.vmSummarySections[i], data, i));
    		
    		}
    		

    		Ext.resumeLayouts(true);
    		    		
    	});

    }        
});
