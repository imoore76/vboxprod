/*
 * Events and tasks controller parent class
 */
Ext.define('vcube.controller.EventsAndTasks', {
    extend: 'Ext.app.Controller',
    
    /* Store limit ? */
    storeLimit: 0,
    
    /* Filter for events */
    filter: function() { return true; },
    
    /* Watch for events */
    init: function(){
    	
    	// Initialize stores on render of the panel
    	this.control({
    		
    		'EventsAndTasks' : {
    			
    			render: function(panel) {
    				
    				// Create task store
    				this.taskStore = Ext.create('Ext.data.Store',{
    		    		autoload: false,
    		    		proxy: {
    		    			type: 'vcubeAjax',
    		    			url: 'tasklog/getTasks',
    		    	    	reader: {
    		    	    		type: 'vcubeJsonReader'
    		    	    	}
    		    		},
    		    		fields : [
    		    		   {name: 'id', type: 'int'},
    		    		   {name: 'name', type: 'string'},
    		    		   {name: 'machine', type: 'string'},
    		    		   {name: 'user', type: 'string'},
    		    		   {name: 'status', type: 'int'},
    		    		   {name: 'details', type: 'string'},
    		    		   {name: 'connector', type: 'int'},
    		    		   {name: 'started', type: 'date', dateFormat: 'Y-m-d H:i:s'},
    		    		   {name: 'completed', type: 'date', dateFormat: 'Y-m-d H:i:s'}
    		    		]
    		    	});
    				
    				// Event store
    				this.eventStore = Ext.create('Ext.data.Store',{
    		    		autoload: false,
    		    		proxy: {
    		    			type: 'vcubeAjax',
    		    			url: 'eventlog/getEvents',
    		    	    	reader: {
    		    	    		type: 'vcubeJsonReader'
    		    	    	}
    		    		},
    		    		fields : [
    		    		   {name: 'name', type: 'string'},
    		    		   {name: 'severity', type: 'int'},
    		    		   {name: 'details', type: 'string'},
    		    		   {name: 'machine', type: 'string'},
    		    		   {name: 'connector', type: 'int'},
    		    		   {name: 'time', type: 'date', dateFormat: 'Y-m-d H:i:s'}
    		    		]
    		    	});
    				
    				// Reconfigure panel with unique store instance
    				panel.down('#events').reconfigure(this.eventStore);
    				panel.down('#tasks').reconfigure(this.taskStore);
    			}
    		}
    	});
    	
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



 