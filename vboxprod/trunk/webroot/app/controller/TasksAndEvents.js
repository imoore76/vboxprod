/*
 * Events and tasks controller parent class
 */
Ext.define('vcube.controller.TasksAndEvents', {
    extend: 'Ext.app.Controller',
    
    /* Store limit ? */
    storeLimit: 0,
    
    /* Filter for events */
    filter: function() { return true; },
    
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
    
    populate: function() {
    	this.eventStore.removeAll();
    	this.taskStore.removeAll();
    	this.eventStore.load();
    	this.taskStore.load();
    },
    
    trimStore: function(store) {
    	if(!this.storeLimit) return;    	
    	store.remove(store.getRange(this.storeLimit));
    },
    
    onEventLogEntry: function(event) {
    	
    	if(!this.filter(event.eventData)) return;
    	
    	this.eventStore.insert(0,event.eventData);
    	this.trimStore(this.eventStore);
    },
    
    onTaskLogEntry: function(event) {
    	
    	if(!this.filter(event.eventData)) return;
    	
    	this.taskStore.insert(0,event.eventData);
    	this.trimStore(this.taskStore);
    	
    },

    onTaskLogUpdate: function(event) {

    	if(!this.filter(event.eventData)) return;
    	
    	var record = this.taskStore.getById(event.eventData.id);
    	if(!record) {
    		this.onTaskLogEntry(event);
    		return;
    	}
    	Ext.each(['completed','details','machine','name','status'], function(k){
    		record.set(k, event.eventData[k]);
    	});
    }

    
});



 