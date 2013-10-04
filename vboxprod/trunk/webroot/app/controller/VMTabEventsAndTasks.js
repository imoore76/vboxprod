/*
 * Events and tasks controller
 */
Ext.define('vcube.controller.VMTabEventsAndTasks', {
    extend: 'vcube.controller.EventsAndTasks',
    
    // View references
    refs : [{
    	selector: 'viewport > MainPanel > VMTabs > EventsAndTasks',
    	ref: 'EventsAndTasksView'
    },{
    	selector: 'viewport > NavTree',
    	ref: 'NavTreeView'
    }],
    
    /* Store limit ? */
    storeLimit: 0,

    /* ref to selection model */
    navTreeSelectionModel: null,
    
    /* Ref to selected vm so that filter() is faster */
    selectedVMId : null,
    
    filter: function(eventData) {
    	console.log("Hit filter with:");
    	console.log(eventData);
    	return (eventData.machine == this.selectedVMId);
    },
    
    /* Watch for events */
    init: function() {
    	
    	console.log("In vmtab init");
    	
        this.control({
        	'viewport > MainPanel > VMTabs > EventsAndTasks' : {
	        	show: this.onTabShow
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
    	
    	// Only load if VM is selected
    	if(!record || record.raw.data._type != 'vm')
    		return;

    	this.selectedVMId = record.raw.data.id;
    	
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
    	if(!this.getEventsAndTasksView().isVisible()) {
    		this.dirty = true;
    		return;
    	}
    	
		this.taskStore.getProxy().extraParams = {'vm' : this.selectedVMId};
		this.eventStore.getProxy().extraParams = {'vm' : this.selectedVMId};

		this.callParent(arguments);
    }



});



 