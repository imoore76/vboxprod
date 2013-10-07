/*
 * Server summary tab controller
 */
Ext.define('vcube.controller.ServerTabConnector', {
	
    extend: 'Ext.app.Controller',
    
    refs : [{
    	selector: 'viewport > NavTree',
    	ref: 'NavTreeView'
    },{
    	selector: 'viewport > MainPanel > ServerTabs > ServerTabConnector',
    	ref: 'ServerTabConnectorView'
    }],
    
    /* Watch for events */
    init: function(){
    	
		// Connector state changes
    	/*
		this.application.on({
			'SessionStateChanged': this.updateServerActions,
			'MachineStateChanged': this.updateServerActions,
			scope: this
		});
		*/
		
		
        this.control({
	        'viewport > MainPanel > ServerTabs > ServerTabConnector' : {
	        	show: this.onTabShow,
	        	render: this.onTabRender
	        },
        	'viewport > NavTree' : {
        		select: this.onSelectItem
        	}
        });
        
        
    },
    
    /* True if Server data displayed is not current */
    dirty: true,
    
    /* When tab is rendered */
    onTabRender: function() {
    	
    	// Hold ref to selection model
    	this.navTreeSelectionModel = this.getNavTreeView().getSelectionModel();
    	
    },
    
    /* When tab is shown */
    onTabShow: function() {
    	
    	if(!this.dirty) return;
    	
    	this.showServerSummary(this.navTreeSelectionModel.getSelection()[0].raw.data.id);
    	
    },

    /* When item is selected */
    onSelectItem: function(row, record) {
    	
    	this.dirty = true;
    	
    	// Only load if Server is selected
    	if(!record || record.raw.data._type != 'server')
    		return;

    	this.showServerSummary(record.raw.data.id);
    },
    
    /* Get vm data and show summary */
    showServerSummary: function(vmid) {
    	
    	var summaryTab = this.getServerTabConnectorView();

    	if(!summaryTab.isVisible()) {
    		return;
    	}
    	
    	this.dirty = false;

		// batch of updates
		Ext.suspendLayouts();

    	serverData = this.navTreeSelectionModel.getSelection()[0].raw.data;
    	
    	Ext.each(summaryTab.items.items[0].items.items, function(item){
    		item.update(serverData);
    	});
    	
    	Ext.resumeLayouts(true);
    	

    }        
});
    	
