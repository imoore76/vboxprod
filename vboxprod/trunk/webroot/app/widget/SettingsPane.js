/**
 * Settings pane widget
 */
Ext.define('vcube.widget.SettingsPane', {
	
	extend: 'Ext.panel.Panel',
    
	alias: 'widget.SettingsPane',
    cls: 'settingsPane',
    
    layout: 'vbox',
    items: [{
    	tpl: new Ext.XTemplate('<h3 align="left">{0}</h3>')
    },{
    	itemId: 'content'
    }],
    
    constructor: function(options) {
    	console.log(this);
    	
    	this.callParent(arguments);
    }
    
});
    
