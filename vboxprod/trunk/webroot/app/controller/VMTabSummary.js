/*
 * VM summary tab controller
 */
Ext.define('vcube.controller.VMTabSummary', {
    extend: 'vcube.controller.XInfoTab',
    	

    /* Watch for events */
    init: function(){
    	
    	/* Selection item type (vm|server|group) */
    	this.selectionItemType = 'vm';
    	
    	/* Repopulate on Events*/
    	this.repopulateOn = ['MachineDataChanged'];
    	
    	/* Repopulate event attribute */
    	this.eventIdAttr = 'machineId';
    	
    	/* Setup sections */
    	this.sectionConfig = vcube.view.VMTabSummary.vmSummarySections;
    	
        /* Populate data function returns a deferred or data */
        this.populateData = function(data) {
        	return vcube.vmdatamediator.getVMDataCombined(data.id);
        };

    	
		// Special case for VM actions
		this.application.on({
			'SessionStateChanged': this.updateVMActions,
			'MachineStateChanged': this.updateVMActions,
			scope: this
		});
		
		
        this.control({
	        'viewport > #MainPanel > VMTabs > VMTabSummary' : {
	        	render: this.onTabRender
	        },
	        'viewport > #MainPanel > VMTabs > VMTabSummary #vmactions > button' : {
	        	click: this.onActionButtonClick
        	}
        });
        
        this.callParent();
        
    },
    
    /* Holds preview dimension cache */
    resolutionCache : {},
    
    /* preview timers */
    previewTimers : {},

    /* When an action button is clicked */
    onActionButtonClick: function(button) {
    	vcube.vmactions[button.itemId].click(this.navTreeSelectionModel);
    },
    


    /* Update VM actions */
	updateVMActions: function(eventData) {
		
		console.log(this.controlledTabView);
		
    	// is this tab still visible?
    	if(eventData && !this.controlledTabView.isVisible()) {
    		this.dirty = true;
    		return;
    	}

    	// Is this VM still selected
    	if(eventData && !eventData.machineId == this.navTreeSelectionModel.getSelection()[0].raw.data.id)
    		return;

		var self = this;
		
		Ext.each(this.controlledTabView.down('#vmactions').items.items, function(item) {
			if(vcube.vmactions[item.itemId].enabled(self.navTreeSelectionModel)) item.enable();
			else item.disable();
		});		
	},

    
});
