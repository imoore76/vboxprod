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

    	/* Update info pane on these events */
    	this.updateInfoOnRecordChange = true;

    	/* Repopulate on Events*/
    	this.repopulateOn = [];
    	
    	/* Repopulate event attribute */
    	this.eventIdAttr = 'connector_id';
    	    	
        /* Populate data function returns a deferred or data */
        this.populateData = function(data) {
        	return vcube.utils.ajaxRequest('vbox/getStatus',{connector:data.id})
        };

    			
        this.control({
	        'viewport > #MainPanel > ServerTabs > ServerTabConnector' : {
	        	render: this.onTabRender
	        }
        });
        
        this.callParent();
        
    }

});
    	
