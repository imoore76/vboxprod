/*
 * Events and tasks controller
 */
Ext.define('vcube.controller.GroupVirtualMachinesList', {
    extend: 'vcube.controller.XVirtualMachinesList',
    
    /* Nav tree selection type field */
    selectionType: 'vmgroup',

    /* VM record property which must match selection id */
	vmPropertyFilterProperty: 'group_id',
	
	// Hold nav tree ref so that we only have to get this once
	refs : [{
		selector : 'viewport > NavTree',
		ref : 'NavTreeView'
	}],

	/* vmids in this group */
	groupVMs: [],

    /* Watch for events */
    init: function() {

    	this.control({
    		
        	'viewport > #MainPanel > GroupTabs > VirtualMachinesList' : {
    			render: function(panel) {
    				this.setControlledList(panel)
    			}
        	},
    	
    		'viewport > NavTree' : {
    			selectionchange: this.onNavTreeSelectionChange
    		}
        });
    	
    	this.callParent(arguments);
    },
    
    /* Get sub vms when selection changes */
    onNavTreeSelectionChange: function(sm, records) {
    	
    	if(records.length && records[0].get('type') == this.selectionType) {

    		var vmIdList = [];
    		
    		var store = this.getNavTreeView().getStore();
    		
    		function getVMChildren(node) {
    			node.eachChild(function(record){
    				if(record.get('type') == 'vm') {
    					vmIdList.push(record.get('id'));
    				} else if(record.get('type') == 'vmgroup') {
    					vmIdList = vmIdList.concat(getVMChildren(store.getNodeById(record.get('id'))))
    				}    				
    			});
    		}
    		
    		getVMChildren(this.getNavTreeView().getStore().getNodeById('vmgroup-' + records[0].get('rawid')));
    		
    		this.groupVMs = vmIdList;
    		
    	}

    },
    
    /* vms would be any group or sub-group vms */
    getVMData: function(vm) {
    	
    	// Get all child vms of this node
    	var self = this;
    	return vcube.vmdatamediator.getVMDataByFilter(function(vm) {
    		return Ext.Array.contains(self.groupVMs, vm.id);
    	});
    	
    }

});


