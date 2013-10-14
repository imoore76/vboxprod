/*
 * Server summary tab controller
 */
Ext.define('vcube.controller.ServerTabConnector', {
	
    extend: 'vcube.controller.XInfoTab',
    
    views: ['ConnectorAddEdit'],
    
    /* Watch for events */
    init: function(){

    	/* Setup sections */
    	this.sectionConfig = vcube.view.ServerTabConnector.sections;

    	/* Selection item type (vm|server|group) */
    	this.selectionItemType = 'server';

    	/* Update info pane on these events */
    	this.updateInfoOnRecordChange = true;

    	/* Repopulate on Events*/
    	this.repopulateOn = ['ConnectorStateChanged'];
    	
    	/* Repopulate event attribute */
    	this.eventIdAttr = 'connector_id';
    	    	
        /* Populate data function returns a deferred or data */
        this.populateData = function(data) {
        	if(data.state == vcube.app.constants.CONNECTOR_STATES['RUNNING']) {
        		return vcube.utils.ajaxRequest('vbox/getStatus',{connector:data.id});
        	} else {
        		return null;
        	}
        };

    			
        this.control({
	        'viewport > #MainPanel > ServerTabs > ServerTabConnector' : {
	        	render: this.onTabRender
	        },
	        'viewport > #MainPanel > ServerTabs > ServerTabConnector #editConnector' : {
	        	click: this.editConnector
	        }
        });
        
        this.callParent();
        
    },
    
    /* Edit connector */
    editConnector: function() {
    	
    	var self = this;
    	
    	Ext.create('vcube.view.ConnectorAddEdit',{
    		title: 'Edit Connector',
    		listeners: {
    			
    			/* Set values when window is shown */
    			show: function(pane) {
    				
    				var connectorData = this.getNavTreeView().getStore().getById(this.selectionNodeId).raw.data;
    				pane.down('#form').getForm().setValues(
						Ext.Object.merge({},connectorData,{
							state: (connectorData.state > vcube.app.constants.CONNECTOR_STATES['DISABLED'] ? vcube.app.constants.CONNECTOR_STATES['DISCONNECTED'] : connectorData.state)  
						})
    				);
    				
    				/* Save function */
    				pane.down('#save').on('click',function(btn){
    					
    					var win = btn.up('.window');
    					
    					win.setLoading(true);
    					
    					vcube.utils.ajaxRequest('connectors/updateConnector',btn.up('.form').getForm().getValues(), function(data) {
    						if(data == true) {
    							win.close();
    							return;
    						}
    						win.setLoading(false);
    					},function(){
    						win.setLoading(false);
    					});
    				});
    				
    			},
    			scope: this
    		}
    	}).show();
    	
    	
    }

});
    	
