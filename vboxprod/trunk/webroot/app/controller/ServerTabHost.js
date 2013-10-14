/*
 * Server summary tab controller
 */
Ext.define('vcube.controller.ServerTabHost', {
	
    extend: 'vcube.controller.XInfoTab',
    
    /* Watch for events */
    init: function(){

    	/* Setup sections */
    	this.sectionConfig = vcube.view.ServerTabHost.sections;

    	/* Selection item type (vm|server|group) */
    	this.selectionItemType = 'server';
    	
    	/* Repopulate on Events*/
    	this.repopulateOn = ['ConnectorStateChanged'];
    	
    	/* Repopulate event attribute */
    	this.eventIdAttr = 'connector_id';
    	    	
        /* Populate data function returns a deferred or data */
        this.populateData = function(data) {
        	if(data.state != vcube.app.constants.CONNECTOR_STATES['RUNNING']) {
        		return null;
        	}
        	return vcube.utils.ajaxRequest('vbox/hostGetDetails',{connector:data.id})
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
	        'viewport > #MainPanel > ServerTabs > ServerTabHost' : {
	        	render: this.onTabRender
	        }
        });
        
        this.callParent();
        
    }

});
    	
