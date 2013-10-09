/*
 * Server summary tab controller
 */
Ext.define('vcube.controller.ServerTabConnector', {
	
    extend: 'vcube.controller.XInfoTab',
    
    /* Watch for events */
    init: function(){

    	/* Setup sections */
    	this.sectionConfig = vcube.view.ServerTabConnector.sections;

    	/* Selection item type (vm|server|group) */
    	this.selectionItemType = 'server';
    	
    	/* Repopulate on Events*/
    	this.repopulateOn = []; //['MachineDataChanged'];
    	
    	/* Repopulate event attribute */
    	this.eventIdAttr = 'connector_id';
    	    	
        /* Populate data function returns a deferred or data */
        this.populateData = function(data) {
        	return vcube.utils.ajaxRequest('vbox/getStatus',{connector:data.id})
        };

    	
		// Special case for VM actions
        /*
		this.application.on({
			'SessionStateChanged': this.updateVMActions,
			'MachineStateChanged': this.updateVMActions,
			scope: this
		});
		*/
		
		
        this.control({
	        'viewport > #MainPanel > ServerTabs > ServerTabConnector' : {
	        	render: this.onTabRender
	        }
        });
        
        this.callParent();
        
    }

});
    	
