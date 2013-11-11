/*
 * Update machine actions list
 */
Ext.define('vcube.controller.serveractions', {
	
	extend : 'Ext.app.Controller',
	
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
			}
        });

		// This is the master handler for all VM actions
		var self = this;
		Ext.each(vcube.actionpool.getActions('server'), function(action) {
			action.setHandler(self.actionHandler, self);
		});

	},
	
	/* On action click */
	actionHandler: function(btn) {
		vcube.actions.server[btn.itemId].action(this.navTreeSelectionModel);
	},
	
	/* Nav tree selection changed */
	onSelectionChangeNavTree: function(selectionModel, records) {
		
		var self = this;
		Ext.each(vcube.actionpool.getActionList('server'),function(actionName) {
			vcube.actionpool.getAction('server',actionName).setEnabledTest(selectionModel);
		});
		
	}	
});

