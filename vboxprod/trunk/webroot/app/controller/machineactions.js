/*
 * Update machine actions list
 */
Ext.define('vcube.controller.machineactions', {
	
	extend : 'Ext.app.Controller',
	
	// ids of selected vms
	selectedVMIds : [],
	
	// Current selection model we are using
	selectionModel: null,
	
	// Main nav-tree selection model
	navTreeSelectionModel: null,
	
	/* Watch nav tree and vm list selections */
	init : function() {

        this.control({
        	
        	// Main navigation tree
			'viewport > NavTree' : {
				render: function(panel) {
					this.navTreeSelectionModel = panel.getView().getSelectionModel();
				},
				selectionchange: this.onSelectionChangeNavTree
			},
			
			// Any Virtual machine list
			'VirtualMachinesList': {
				selectionchange: this.onSelectionChange,
				show: function(panel) {
					
				}
			},
			
			'VirtualMachinesList > gridpanel': {
				show: function(panel) {
					if(!panel.getSelectionModel().getSelection().length)
				}
			}
        });
        
		// Special case for VM actions
		this.application.on({
			'SessionStateChanged': this.onMachineChange,
			'MachineStateChanged': this.onMachineChange,
			scope: this
		});

		// This is the master handler for all VM actions
		var self = this;
		Ext.each(vcube.actionpool.getActions('machine'), function(action) {
			action.setHandler(self.actionHandler, self);
		});

		
        
	},
	
	/* On action click */
	actionHandler: function(btn) {
		vcube.actions.machine[btn.itemId].action(this.selectionModel, this.navTreeSelectionModel);
	},
	
	/* Update vm action list */
	onMachineChange: function(eventData) {
		
		
    	// Is this VM still selected
    	if(!Ext.Array.contains(this.selectedVMIds, eventData.machineId))
    		return;
    	
    	this.updateVMActions();

	},
	
	/* Nav tree selection changed */
	onSelectionChangeNavTree: function(selectionModel, records) {
		
		if(records.length && records[0].raw.data._type == 'vm') {
			this.onSelectionChange(selectionModel, records);
		} 
	},
	
	/* Selection has changed, update actions and hold VM ids */
	onSelectionChange: function(selectionModel, records) {

		
		// getView() should work here, but doesn't.. not sure why
		this.selectionModel = selectionModel;
		
		var vmids = [];
		Ext.each(records, function(r) {
			vmids.push(r.get('id'));
		});
		this.selectedVMIds = vmids;

		this.updateVMActions();
		
	},
	
	/* Update actions */
	updateVMActions: function() {
		
		var self = this;
		Ext.each(vcube.actionpool.getActionList('machine'),function(actionName) {
			vcube.actionpool.getAction('machine',actionName).setEnabledTest(self.selectionModel);
		});

	}

});

