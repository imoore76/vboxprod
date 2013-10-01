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

    	return;
    	
    	// Only load if VM is selected
    	if(!record || record.raw.data._type != 'vm')
    		return;
    	
    	var tabPanel = this.getVMTabsView();
    	if(record.raw.data.state == 'Inaccessible') {
    		tabPanel.fireEvent('vmloaded', record.raw.data);
    		return;
    	}
    	
    	tabPanel.setLoading(true);
    	
    	var self = this;
    	
    	Ext.ux.Deferred.when(vcube.vmdatamediator.getVMDetails(record.raw.data.id)).done(function(data) {
    		
    		// batch of updates
    		Ext.suspendLayouts();
    		
    		Ext.apply(data, record.raw.data);
    		tabPanel.vmData = data;
    		tabPanel.fireEvent('vmloaded', data);
    		
    		Ext.resumeLayouts(true);
    		
    		tabPanel.setLoading(false);

    	});


    }
    
 	
});