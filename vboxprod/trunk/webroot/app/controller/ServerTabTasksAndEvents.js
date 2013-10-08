/*
 * Events and tasks controller
 */
Ext.define('vcube.controller.ServerTabTasksAndEvents', {
    extend: 'vcube.controller.TasksAndEvents',
    
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
        		select: this.onSelectItem
        	}
        });

    	this.callParent(arguments);
    },
    
    /* When item is selected */
    onSelectItem: function(row, record) {
    	
    	this.dirty = true;
    	
    	// Only load if Server is selected
    	if(!record || record.raw.data._type != 'server')
    		return;

    	this.selectedServerId = record.raw.data.id;
    	
    	this.populate();
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



 