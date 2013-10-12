/*
 * Events and tasks controller
 */
Ext.define('vcube.controller.ServerTabTasksAndEvents', {
    extend: 'vcube.controller.XTasksAndEvents',
    
    // View references
    refs : [{
    	selector: 'viewport > #MainPanel > ServerTabs > TasksAndEventsTab',
    	ref: 'TasksAndEventsView'
    },{
    	selector: 'viewport > NavTree',
    	ref: 'NavTreeView'
    }],
    
    /* Store limit ? */
    storeLimit: 0,

    /* ref to selection model */
    navTreeSelectionModel: null,
    
    /* Ref to selected vm so that filter() is faster */
    selectedServerId : null,
    
    filter: function(eventData) {
    	return (eventData.connector_id == this.selectedServerId);
    },
    
    /* Watch for events */
    init: function() {
    	
    	this.control({
        	'viewport > #MainPanel > ServerTabs > TasksAndEventsTab' : {
	        	show: this.onTabShow,
    			render: function(panel) {
    				// Reconfigure panel with unique store instance
    				this.eventStore = panel.down('#events').getStore();
    				this.taskStore = panel.down('#tasks').getStore();
    			}
        	},
        	'viewport > NavTree' : {
        		selectionchange: this.onSelectionChange
        	}
        });
    	
    	// Populate when app starts
    	this.application.on({
    		'ConnectorUpdated': this.onConnectorUpdated,
    		scope: this
    	});


    	this.callParent(arguments);
    },

    onConnectorUpdated: function(eventData) {
    	
    	if(!(this.selectedServerId && eventData.connector_id == this.selectedServerId))
    		return;
    		
    	if(!this.getTasksAndEventsView().isVisible()) {
    		this.dirty = true;
    		return;
    	}

    	this.taskStore.each(function(s){
    		s.set('connector', eventData.connector_id);
    	});
    	this.eventStore.each(function(s){
    		s.set('connector', eventData.connector_id);
    	});

    },

    /* An selection in the tree has changed */
    onSelectionChange: function(panel, records) {
    	
    	this.dirty = true;
    	
    	if(records.length && records[0].raw.data._type == 'server') {

    		this.selectedServerId = record.raw.data.id;    		
    		this.populate();
    	
    	} else {
    	
    		this.selectedServerId = null;
    	}
    	

    },
    
    /* When tab is shown */
    onTabShow: function() {
    	
    	if(!this.dirty) return;
    	
    	this.populate();
    	
    },
    
    /* Populate events */
    populate: function() {
    	
    	// is this tab still visible?
    	if(!this.getTasksAndEventsView().isVisible()) {
    		this.dirty = true;
    		return;
    	}
    	
		this.taskStore.getProxy().extraParams = {'server' : this.selectedServerId};
		this.eventStore.getProxy().extraParams = {'server' : this.selectedServerId};

		this.callParent(arguments);
		
    }



});



 