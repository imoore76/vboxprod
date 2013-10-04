/*
 * Events and tasks controller
 */
Ext.define('vcube.controller.EventsAndTasks', {
    extend: 'Ext.app.Controller',
    
    // View references
    refs : [{
    	selector: 'EventsAndTasks',
    	ref: 'EventsAndTasks'
    }],
    
    /* Watch for events */
    init: function(){
    	
        /* Tree events */
    	/*
        this.control({
        	'EventsAndTasks' : {
        		select: this.selectItem
        	}
        });
        */

    	// Redraw entire tab on machine data change
    	this.application.on({
    		'eventLogEntry': this.onEventLogEntry,
    		scope: this
    	});
    },
    
    
    /* These will be filled later */
    eventLogGrid : null,
    taskLogGrid: null,
    
    onEventLogEntry: function(event) {
    	
    	this.getEventsAndTasks().down('#events').getStore().add(event.eventData);
    }
    
});



 