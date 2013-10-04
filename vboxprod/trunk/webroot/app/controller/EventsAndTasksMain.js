/*
 * Events and tasks controller
 */
Ext.define('vcube.controller.EventsAndTasksMain', {
    extend: 'vcube.controller.EventsAndTasks',
    
    /* Store limit ? */
    storeLimit: 25,
    
    /* Watch for events */
    init: function(){
    	
    	console.log("In main init");
    	
    	// Redraw entire tab on machine data change
    	this.application.on({
    		'start' : this.populate,
    		scope: this
    	});
    	
    	this.callParent(arguments);
    },
    
    populate: function() {
    	console.log("In main populate");
    	this.callParent(arguments);
    }
});



 