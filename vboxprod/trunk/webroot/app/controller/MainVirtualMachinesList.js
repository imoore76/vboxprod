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
    	
		// VMs added to main VM store...
    	vcube.storemanager.getStore('vm').on('add', this.onVMStoreRecordsAdded, this);
    	
    	this.callParent(arguments);
    },
    
    onVMStoreRecordsAdded: function(store, records) {
		this.vmStore.add(records);
    }
    

});


