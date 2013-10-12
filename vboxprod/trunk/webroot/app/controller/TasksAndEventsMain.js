/*
 * Events and tasks controller
 */
Ext.define('vcube.controller.TasksAndEventsMain', {
    extend: 'vcube.controller.XTasksAndEvents',
    
    /* Store limit ? */
    storeLimit: 25,
    
    /* Watch for events */
    init: function(){
    	
    	// Initialize stores on render of the panel
    	this.control({
    		
    		'TasksAndEventsMain' : {
    			
    			render: function(panel) {
    				// Reconfigure panel with unique store instance
    				this.eventStore = panel.down('#events').getStore();
    				this.taskStore = panel.down('#tasks').getStore();
    			}
    		}
    	});
    	
    	// Populate when app starts
    	this.application.on({
    		'start' : this.populate,
    		'ConnectorUpdated': this.onConnectorUpdated,
    		scope: this
    	});
    	
    	this.callParent(arguments);
    },
    
    onConnectorUpdated: function() {
    	this.taskStore.each(function(s){
    		s.set('connector', s.get('connector'));
    	});
    	this.eventStore.each(function(s){
    		s.set('connector', s.get('connector'));
    	});

    }
});



 