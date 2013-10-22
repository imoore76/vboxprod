/*
 * VM summary tab controller
 */
Ext.define('vcube.controller.VMSummary', {

	extend: 'vcube.controller.XInfoTab',
	
    
    /* Watch for events */
    init: function(){

    	/* Setup sections */
    	this.sectionConfig = vcube.view.VMSummary.sections;

    	/* Selection item type (vm|server|group) */
    	this.selectionItemType = 'vm';
    	
    	/* Repopulate on Events*/
    	this.repopulateOn = ['MachineDataChanged','MachineIconChanged'];
    	
    	/* Repopulate event attribute */
    	this.eventIdAttr = 'machineId';
    	    	
        /* Populate data function returns a deferred or data */
        this.populateData = function(data) {
        	return vcube.vmdatamediator.getVMDataCombined(data.id);
        };
        
    	
        this.control({
	        'viewport > #MainPanel > VMTabs > VMSummary' : {
	        	render: this.onTabRender
	        },
	        'viewport > #MainPanel > VMTabs > VMSummary #edit' : {
	        	click: this.editVM
	        }

        });
        
        this.callParent();
        
    },

    /* Edit vm */
    editVM: function() {
    	
    	var self = this;
    	
    	Ext.create('vcube.view.VMSummary.Edit',{
    		listeners: {
    			
    			/* Set values when window is shown */
    			show: function(win) {
    				
    				/* Save function */
    				win.down('#save').on('click',function(btn){
    					
    					win.setLoading(true);
    					
    					Ext.ux.Deferred.when(vcube.utils.ajaxRequest('vbox/machineSaveSummary',Ext.apply(btn.up('.form').getForm().getValues(), vcube.utils.vmAjaxParams(self.selectionItemId))))
    						.done(function(data) {
	    						if(data == true) {
	    							win.close();
	    							return;
	    						}
	    					})
	    					.always(function(){
	    						win.setLoading(false);
	    					});    						
    				});

    				
    				
    				/* Load data */
    				win.setLoading(true);

    				Ext.ux.Deferred.when(vcube.vmdatamediator.getVMDataCombined(this.selectionItemId)).done(function(data){
    					
    					win.setLoading(false);

    					if(!vcube.utils.vboxVMStates.isEditable(data)) {
    						win.down('#vmname').disable();
    					}

    					win.down('#form').getForm().setValues({
    						id: data.id,
    						icon: data.icon,
    						description: data.description,
    						name: data.name
    					});
    					
    				
    				}).fail(function(){
    					win.setLoading(false);
    				});
    				
    			},
    			scope: this
    		}
    	}).show();
    	
    	
    },
    
    /* Holds preview dimension cache */
    resolutionCache : {},
    
    /* preview timers */
    previewTimers : {},

    drawSections: function(data) {
    
    	// refs
    	var self = this;    	
		var vmid = data.id;
		
		var previewWidth = 210;
		var previewAspectRatio = 1.6;
		
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
			
			self.controlledTabView.down('#PreviewPanel').doLayout();
		
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
		
		self.controlledTabView.down('#PreviewPanel').doLayout();
		
		    		

    	this.callParent(arguments);
    }

    
});
