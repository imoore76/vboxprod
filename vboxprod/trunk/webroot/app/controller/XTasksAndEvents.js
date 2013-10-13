/*
 * Events and tasks controller parent class
 */
Ext.define('vcube.controller.XTasksAndEvents', {
    extend: 'Ext.app.Controller',
    
    statics: {
    	cancelProgress: function(progress_id, connector_id) {
    		vcube.utils.ajaxRequest("vbox/progressCancel",{progress:progress_id, connector: connector_id});
    	},    	
    },
    
    /* Store limit ? */
    storeLimit: 0,
    
    
    /* Watch for events */
    init: function() {
    	
    	// Redraw entire tab on machine data change
    	this.application.on({
    		'eventLogEntry': this.onEventLogEntry,
    		'taskLogEntry' : this.onTaskLogEntry,
    		'taskLogUpdate' : this.onTaskLogUpdate,
    		scope: this
    	});
    },
    
    
    /* These will be filled later */
    eventStore : null,
    taskStore: null,
        
    
    /* Populate stores */
    populate: function() {
    	
    	this.eventStore.removeAll();
    	this.taskStore.removeAll();
    	
    	this.eventStore.load();
    	this.taskStore.load();
    	
    },
    
    /* Trim store if there is a limit set */
    trimStore: function(store) {
    	if(!this.storeLimit) return;    	
    	store.remove(store.getRange(this.storeLimit));
    },
    
    /* Event log entry event */
    onEventLogEntry: function(event) {
    	
    	if(!(this.eventStore)) return;
    	this.eventStore.insert(0,event.eventData);
    	this.trimStore(this.eventStore);
    },
    
    /* Task log entry event */
    onTaskLogEntry: function(event) {
    	
    	if(!(this.taskStore)) return;
    	
    	this.taskStore.insert(0,event.eventData);
    	this.trimStore(this.taskStore);
    	
    },

    /* Task log update event */
    onTaskLogUpdate: function(event) {

    	if(!(this.taskStore)) return;

    	var record = this.taskStore.getById(event.eventData.id);
    	if(!record) {
    		this.onTaskLogEntry(event);
    		return;
    	}
    	record.raw = event.eventData;
    	record.set({
    		'completed': event.eventData['completed'],
    		'details': event.eventData['details'],
    		'machine': event.eventData['machine'],
    		'name': event.eventData['name'],
    		'status': event.eventData['status'],
    		'progress': event.eventData['progress']
    	});
    }

    
});



 