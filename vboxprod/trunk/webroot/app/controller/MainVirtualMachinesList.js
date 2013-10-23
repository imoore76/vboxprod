/*
 * Events and tasks controller
 */
Ext.define('vcube.controller.MainVirtualMachinesList', {
    extend: 'vcube.controller.XVirtualMachinesList',
    
    /* Nav tree selection type field */
    selectionType: 'vmsFolder',

    /* VM record property which must match selection id */
	vmPropertyFilterProperty: null, // no filter

    /* Watch for events */
    init: function() {


    	this.control({
    		
        	'viewport > #MainPanel > VirtualMachinesList' : {
    			render: function(panel) {
    				this.setControlledList(panel)
    			}
        	}
        });
    	
		// Special case for VM actions
		this.application.on({
			'MachinesAdded': this.onMachinesAdded,
			scope: this
		});
    	

    	
    	this.callParent(arguments);
    },
    
    onMachinesAdded: function(eventData) {
		this.vmStore.add(eventData.machines);
    }
    

});


