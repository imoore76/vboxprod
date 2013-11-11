/**
 * Server actions
 */
Ext.define('vcube.actions.server',{

	statics: {
		
		'new': {
			
			action: function(selectionModel) {
				
			}
		},
		
		add: {
			
			action: function(selectionModel) {
				
				var serverId = selectionModel.getSelection()[0].get('rawid');

				var browser = Ext.create('vcube.widget.fsbrowser',{
	    			serverId: serverId,
	    			title: 'Select a machine to add...',
	    			pathType: 'addMachine',
	    			savePath: true,
	    			fileTypes: ['vbox','xml']
	    		});
	    		
	    		Ext.ux.Deferred.when(browser.browse()).done(function(f) {
	    			vcube.utils.ajaxRequest('vbox/machineAdd',{connector:serverId,file:f});
	    		});

			}
			
		},
		
		settings: {
			action: function(selectionModel) {
				
			}
		},
		
		/** Delete / Remove a server */
		'remove': {
			action: function(selectionModel) {
				
			}
		}
	}
	
});
