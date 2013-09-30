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
    	
        /* Tree events */
        this.control({
        	'viewport > MainPanel > VMTabs' : {
        		vmloaded: this.vmloaded
        	},
	        'viewport > MainPanel > VMTabs > VMTabSummary' : {
	        	show: this.loadVMData
	        }
        });
        
    },
    
    /* True if VM data displayed is not current */
    dirty: true,
    
    /* Holds preview dimension cache */
    resolutionCache : {},
    
    /* preview timeers */
    previewTimers : {},

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
    	var summaryTab = this.getVMTabSummaryView();
    	
    	// If vm is inaccessible, select this tab
    	if(!data.accessible) {
    		this.getVMTabsView().setActiveTab(0);    		
    	}

    	if(!summaryTab.isVisible()) {
    		self.dirty = true;
    		return;
    	}
    	self.dirty = false;

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
				var randid = vm.lastStateChange;
				if(vcube.utils.vboxVMStates.isRunning(data)) {
					var currentTime = new Date();
					randid = Math.floor(currentTime.getTime() / 1000);
				}
				__vboxDrawPreviewImg.src = 'vbox/machineGetScreenShot?width='+previewWidth+'&vm='+vmid+'&randid='+randid+'&server='+vm._serverid;
				
			}
		}
		


		// Update actions
		var sm = self.getNavTreeView().getSelectionModel();
		Ext.each(summaryTab.down('#vmactions').items.items, function(item) {
			if(vcube.vmactions[item.itemId].enabled(sm)) item.enable();
			else item.disable();
		});
		
		summaryTab.down('#PreviewPanel').doLayout();
		
		summaryTab.down('#baseinfo').update(data);

		// Summary tab tables
		var summaryTabTables = summaryTab.down('#summaryTables');
		summaryTabTables.removeAll();
		for(var i in vcube.view.VMTabSummary.vmSummarySections) {

			if(typeof(i) != 'string') continue;
			
			console.log(i);
			
			if(!vcube.view.VMTabSummary.vmSummarySections[i].condition(data)) continue;
			
			summaryTabTables.add(vcube.view.VMTabs.sectionTable(vcube.view.VMTabSummary.vmSummarySections[i], data));
		
		}
		
    }
        
});
