/*
 * VM Tabs Controller
 */

var previewWidth = 200;
var previewAspectRatio = 1.6;
var previewUpdateInterval = 3;

Ext.define('vcube.controller.VMTabs', {
	
    extend: 'Ext.app.Controller',
    
    // Hold nav tree ref so that we only have to get this once
    refs : [{
    	selector: 'viewport > NavTree',
    	ref: 'NavTreeView'
    },{
    	selector: 'viewport > #MainPanel > VMTabs',
    	ref: 'VMTabsView'
    }],
    
    
    /* Watch for events */
    init: function(){
    	
        /* Tree events */
        this.control({
        	'viewport > NavTree' : {
        		selectionchange: this.onSelectionChange
        	}
        });
        
    },
    
    /* An selection in the tree has changed */
    onSelectionChange: function(panel, records) {

    	if(records.length) record = records[0];
    	else return;
    	
    	// Only load if VM is selected
    	if(!record || record.get('type') != 'vm')
    		return;

    	// Only show summary tab if this is not accessible
    	if(vcube.storemanager.getStoreRecord('vm',record.get('rawid')).state == 'Inaccessible') {
    		this.getVMTabsView().setActiveTab(0);
    	}

    }
    
 	
});