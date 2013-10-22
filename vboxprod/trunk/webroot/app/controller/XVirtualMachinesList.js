/*
 * Events and tasks tab controller parent class
 */
Ext.define('vcube.controller.XVirtualMachinesList', {
	extend: 'Ext.app.Controller',


    /* Nav tree selection type and ID holder */
    selectionType: null,
    selectionId: null,
    
    /* virtual machine id list */
    vmList: [],
    
    /* machine list store */
    vmStore: null,
    
    /* Initially dirty */
    dirty: true,
    
    /* Pane that we are controlling */
    controlledList: null,
    
    /* VM record property which must match selection id */
    vmPropertyFilterProperty: null,
    
    init: function() {

    	this.controlledList = null;
    	this.vmList = [];

    	this.control({
    		'viewport > NavTree' : {
    			selectionchange: this.onSelectionChange
    		}
    	});
    	
		// Special case for VM actions
		this.application.on({
			'SessionStateChanged': this.onMachineChanged,
			'MachineStateChanged': this.onMachineChanged,
			'MachineDataChanged': this.onMachineChanged,
			scope: this
		});
    	
    	this.callParent(arguments);

    },
    
    setControlledList: function(list) {
    	
    	this.controlledList = list;
		
    	this.controlledList.on({'show':this.onShow,scope:this});
    	
    	this.vmStore = list.down('gridpanel').getStore();
		
    	this.vmStore.on({
			'clear': function() {
				this.vmList = [];
			},
			'add': function(store,records) {
				var vmids = [];
				Ext.each(records, function(r) {
					vmids.push(r.get('id'));
				});
				this.vmList = vmids;
			},
			'remove': function(store, record) {
				var rvmid = record.get('id');
				this.vmList = Ext.Array.filter(this.vmList, function(vmid){
					return (vmid != rvmid);
				});
			},
			scope: this
		});
    },
    

    onMachineChanged: function(eventData) {
    	
    	
    	if(!Ext.Array.contains(this.vmList, eventData.machineId)) return;
    	
    	console.log(this.vmStore.getById(eventData.machineId));
    	
    	this.vmStore.getById(eventData.machineId).set(vcube.vmdatamediator.getVMData(eventData.machineId));
    	
    },


    /* When tab is shown */
    onShow: function() {
    	
    	if(!this.dirty) return;
    	
    	this.populate();

    },

    /* Filter for VMs in list */
    machineListFilter: function(vm) {
    	return (!this.vmPropertyFilterProperty || vm[this.vmPropertyFilterProperty] == this.selectionId)
    },

    /* An selection in the tree has changed */
    onSelectionChange: function(panel, records) {
    	
    	this.dirty = true;
    	
    	if(records.length && records[0].raw.data._type == this.selectionType) {

    		this.selectionId = records[0].raw.data.id;    		
    		this.populate();
    	
    	} else {
    	
    		this.selectionId = null;
    	}
    	

    },
    
    /* Get VM data */
    getVMData: function() {
    	return vcube.vmdatamediator.getVMDataByFilter(this.machineListFilter, this);
    },
    
    /* Populate events */
    populate: function() {
    	
    	// is this tab still visible?
    	if(!(this.controlledList && this.controlledList.isVisible())) {
    		this.dirty = true;
    		return;
    	}
    	
    	this.dirty = false;
    	
    	this.vmStore.removeAll();
    	
    	this.vmStore.add(this.getVMData());
    	
		
    }




});