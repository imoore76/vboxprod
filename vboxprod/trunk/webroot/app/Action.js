Ext.define('vcube.Action',{
	
	extend: 'Ext.Action',
	
	// Name of this action
	name: null,
	
	// Base icon string
	iconBase: null,
	
	// Modify incoming components
	addComponent : function(comp){
		
		// Todo - change icon size based on scale of toolbar if
		// this is a button
		comp.icon = this.initialConfig.icon;
		comp.text = this.initialConfig.text;
		comp.handler = this.initialConfig.handler;
		comp.scope = this.initialConfig.scope;
		
		this.callParent(arguments);
		
    },

	setEnabledTest: function() {
		this.setDisabled(!this.enabled_test.apply(this, arguments));
	},
	
	constructor: function(config, itemId) {
		
		this.enabled_test = config.enabled_test||function(){return true};
		this.name = config.itemId = itemId;
		this.iconBase = config.icon;
		config.icon = 'images/vbox/' + config.icon + '_16px.png';

		this.callParent(arguments);

	}
});