/*
 * VM summary tab controller
 */
Ext.define('vcube.controller.VMSummary', {

	extend: 'vcube.controller.XInfoTab',
	
	requires: ['vcube.widget.PreviewMonitor'],
	
    
    /* Watch for events */
    init: function(){

    	/* Setup sections */
    	this.sectionConfig = vcube.view.VMSummary.sections;

    	/* Selection item type (vm|server|group) */
    	this.selectionItemType = 'vm';
    	
    	/* Repopulate on Events*/
    	this.repopulateOn = [];
    	
    	/* Repopulate event attribute */
    	this.eventIdAttr = 'machineId';
    	    	
        /* Populate data function returns a deferred or data */
        this.populateData = function(data) {
        	return vcube.storemanager.getStoreRecordData('vm',data.id);
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
    				var data = vcube.storemanager.getStoreRecordData('vm', this.selectionItemId);

					if(!vcube.utils.vboxVMStates.isEditable(data)) {
						win.down('#vmname').disable();
					}

					win.down('#form').getForm().setValues({
						id: data.id,
						icon: data.icon,
						description: data.description,
						name: data.name
					});
    					
    			},
    			scope: this
    		}
    	}).show();
    	
    	
    },

    /**
     * Custom drawSections to handle preview monitor
     */
    drawSections: function(data) {
    
		this.controlledTabView.down('#PreviewMonitor').reconfigure(data.id);

    	this.callParent(arguments);

    }

    
});
