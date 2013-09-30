/*
 * VM Tabs Controller
 */

var previewWidth = 200;
var previewAspectRatio = 1.6;
var previewUpdateInterval = 3;

Ext.define('vcube.controller.VMTabs', {
    extend: 'Ext.app.Controller',
    
    models: ['Snapshot'],
    
    // Hold nav tree ref so that we only have to get this once
    refs : [{
    	selector: 'viewport > NavTree',
    	ref: 'NavTreeView'
    },{
    	selector: 'viewport > MainPanel > VMTabs',
    	ref: 'VMTabsView'
    }],
    
    /* Watch for events */
    init: function(){
    	
        /* Tree events */
        this.control({
        	'viewport > NavTree' : {
        		select: this.selectItem
        	}
        });
        
    },
    
    /* Holds preview dimension cache */
    resolutionCache : {},
    
    /* preview timeers */
    previewTimers : {},
    
    /* An item is selected */
    selectItem: function(row,record,index,eOpts) {

    	
    	// Only load if VM is selected
    	if(!record || !record.get('leaf'))
    		return;
    	
    	var tabPanel = this.getVMTabsView();
    	var summaryTab = tabPanel.getComponent('SummaryTab');
    	var detailsTab  = tabPanel.getComponent('DetailsTab');
    	
    	
    	tabPanel.setLoading(true);
    	
    	detailsTab.removeAll(true);
    	
    	var self = this;
    	
    	Ext.ux.Deferred.when(vcube.vmdatamediator.getVMDetails(record.raw.data.id)).done(function(data) {
    		
    		// batch of updates
    		Ext.suspendLayouts();
    		    
    		Ext.apply(data, record.raw.data);
    		tabPanel.rawData = data;
    		
			// Check for cached resolution
			if(self.resolutionCache[vmid]) {				
				height = self.resolutionCache[vmid].height;
			} else {
				height = parseInt(previewWidth / previewAspectRatio);
			}

    		
    		// Draw preview and resize panel
    		vcube.previewbox.drawPreview(document.getElementById('vboxPreviewBox'), null, previewWidth, height);
    		
    		var vmid = data.id;
    		
			// Get fresh VM data
			var vm = vcube.vmdatamediator.getVMData(vmid);
			
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

			// Update disabled? State not Running or Saved
			if(!previewUpdateInterval || (!vcube.utils.vboxVMStates.isRunning(vm) && !vcube.utils.vboxVMStates.isSaved(vm))) {
				__vboxDrawPreviewImg.height = 0;
				__vboxDrawPreviewImg.onload();
			} else {
				// Running VMs get random numbers.
				// Saved are based on last state change to try to let the browser cache Saved screen shots
				var randid = vm.lastStateChange;
				if(vcube.utils.vboxVMStates.isRunning(vm)) {
					var currentTime = new Date();
					randid = Math.floor(currentTime.getTime() / 1000);
				}
				__vboxDrawPreviewImg.src = 'vbox/machineGetScreenShot?width='+previewWidth+'&vm='+vmid+'&randid='+randid+'&server='+vm._serverid;
				
			}
			


    		summaryTab.down('#PreviewPanel').doLayout();
    		
    		summaryTab.down('#baseinfo').update(data);

    		// Summary tab tables
    		var summaryTabTables = summaryTab.down('#summaryTables');
    		summaryTabTables.removeAll();
    		for(var i in vcube.view.VMTabs.vmSummarySections) {

    			if(typeof(i) != 'string') continue;
    			
    			summaryTabTables.add(vcube.view.VMTabs.sectionTable(vcube.view.VMTabs.vmSummarySections[i], data));
    		
    		}
    		
    		// Details tab tables
    		for(var i in vcube.view.VMTabs.vmDetailsSections) {
    			
    			if(typeof(i) != 'string') continue;
    			
    			detailsTab.add(vcube.view.VMTabs.sectionTable(vcube.view.VMTabs.vmDetailsSections[i], data));

    		}
    		
    		Ext.resumeLayouts(true);
    		
    		tabPanel.setLoading(false);
    	})

    	// Summary tab items


    	
    	

    }
    
 	
});