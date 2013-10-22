/*
 * Events and tasks controller
 */
Ext.define('vcube.controller.MainVirtualMachinesList', {
    extend: 'vcube.controller.XVirtualMachinesList',
    
    /* Nav tree selection data._type field */
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
    	
    	this.callParent(arguments);
    }

});


