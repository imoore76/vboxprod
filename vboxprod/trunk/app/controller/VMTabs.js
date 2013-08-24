/*
 * VM Tabs Controller
 */
Ext.define('vboxprod.controller.VMTabs', {
    extend: 'Ext.app.Controller',
    
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
        	'NavTree' : {
        		select: this.selectItem
        	}
        });
    },
    
    /* An item is selected */
    selectItem: function(row,record,index,eOpts) {

    	// Only load if VM is selected
    	if(!record || !record.get('leaf'))
    		return;
    	
    	var tabPanel = this.getVMTabsView();

    	// Summary tab items
    	var summaryTab = tabPanel.getComponent('SummaryTab');

    	// Draw preview and resize panel
    	vboxDrawPreviewCanvas(document.getElementById('vboxPreviewBox'), null, 200, 150);
    	summaryTab.down('#PreviewPanel').doLayout();

    	
    	
    	summaryTab.getForm().setValues(record.raw);
    	
    	summaryTab.down('#baseinfo').update(record.raw);
    	//summaryTab.down('#state').update(record.raw);
    	
    	

    }
    
 	
});