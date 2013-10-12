Ext.define('vcube.controller.VMTabConsole', {
    extend: 'Ext.app.Controller',
    refs : [{
    	selector: 'viewport > #MainPanel > VMTabs',
    	ref: 'VMTabsView'
    },{
    	selector: 'viewport > NavTree',
    	ref: 'NavTreeView'
    },{
    	selector: 'viewport > #MainPanel > VMTabs > VMTabConsole',
    	ref: 'VMTabConsoleView'
    }],
    
    /* True if loaded vm data is not current */
    dirty: true,
    
    /* Watch for events */
    init: function(){
    	
        this.control({
	        'viewport > #MainPanel > VMTabs > VMTabConsole' : {
	        	show: this.onTabShow,
	        	render: function() {
	        		this.navTreeSelectionModel = this.getNavTreeView().getSelectionModel();	        		
	        	}
	        },
        	'viewport > NavTree' : {
        		selectionchange: this.onSelectionChange
        	}
        });
        
    },

    navTreeSelectionModel: null,
    
    onTabShow: function() {
    	
    },
    
    /* An selection in the tree has changed */
    onSelectionChange: function(panel, records) {

    	if(records.length) record = records[0];
    	else return;
    	
    	// Only load if VM is selected
    	if(!record || record.raw.data._type != 'vm')
    		return;

    	if(!vcube.utils.vboxVMStates.isRunning(record.raw.data)) {
    		this.getVMTabConsoleView().disable();
    	} else {
    		this.getVMTabConsoleView().enable();
    	}
    	
    	if(!this.getVMTabConsoleView().isVisible()) return;
    	
    }
});
