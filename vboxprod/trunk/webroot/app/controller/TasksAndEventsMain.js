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
    				this.eventTabView = panel.down('#events').getView();
    				this.taskTabView = panel.down('#tasks').getView();
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
    
    onConnectorUpdated: function(eventData) {
    	
    	var self = this;
    	

    	
    	this.taskStore.each(function(s,idx){
    		if(s.get('connector') == eventData.connector_id) {
    			//self.taskTabView.refreshNode(idx);
    			//s.set('connector', eventData.connector_id);
    		}
    	});
    	
    	this.eventStore.each(function(s, idx){
    		if(s.get('connector') == eventData.connector_id) {
    			self.eventTabView.refreshNode(idx);
    			//s.set('connector', eventData.connector_id);
    		}
    	});

    }
});



 