/*
 * Events and tasks controller
 */
Ext.define('vcube.controller.VMTasksAndEvents', {
    extend: 'vcube.controller.XTasksAndEventsTab',
    
    
    /* Nav tree selection data._type field */
    selectionType: 'vm',

    /* Paramater to add to proxy */
    requestIdProperty: 'vm',
    
    logDataProperty: 'machine',
   

    /* Watch for events */
    init: function() {
    	
    	this.control({
        	'viewport > #MainPanel > VMTabs > TasksAndEventsTab' : {
        		show: this.onShow,
    			render: function(panel) {
    				
    				// Reconfigure panel with unique store instance
    				this.eventStore = panel.down('#events').getStore();
    				this.taskStore = panel.down('#tasks').getStore();
    				
    				this.controlledTab = panel;
    				
    				this.onRender(panel);
    			}
        	}
        });

    	this.callParent(arguments);
    } 

});



 