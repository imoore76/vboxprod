/**
 * Progress operation window
 */
Ext.define('vcube.widget.SettingsDialog',{

	extend: 'Ext.window.Window',
	alias: 'widget.SettingsDialog',
	
	requires: ['vcube.widget.SettingsPane'],
	
    title: vcube.utils.trans('Settings'),
    icon: 'images/vbox/settings_16px.png',
    layout:'fit',
    width:600,
    height: 530,
    closable: true,
    modal: true,
    resizable: true,
    plain: true,
    border: false,

    constructor: function(options) {
    	
    	/*
    	for(var i = 0; i < options.panes.length; i++) {
    		
    	}
    	*/
    	console.log(this);
    	
    	this.callParent(arguments);
    	
    },
    
    items: [{
    	layout: {
    	    type: 'hbox',
    	    pack: 'start',
    	    align: 'stretch'
    	},
    	items: [{
    		itemId: 'linklist',
    		cls: 'settingsLinkList',
    		defaults: {
    			xtype: 'button',
    			margin: '4 0 4 0',
    			border: false
    		},
    		layout: {
    			type: 'vbox',
    			pack: 'start'
    		},
    		items: [{text:'button1',icon:'images/vbox/cd_16px.png'}]
    	},{
    		itemId: 'settingsPane',
    		flex: 1,
    		layout: 'fit',
    		defaults : { 
    			xtype: 'SettingsPane'
    		},
    		items: [{
    			title: 'Pane...'
    		}]
    	}]
    }]
	
});