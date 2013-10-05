Ext.define('vcube.view.MainPanel', {
	
    extend: 'Ext.panel.Panel',
    
    requires: [           
      'vcube.view.Welcome',
      'vcube.view.GroupTabs',
      'vcube.view.VMTabs',
      'vcube.view.ServerTabs'
    ],
    
    alias: 'widget.MainPanel',
    defaults: {
    	hidden: true,
    	flex: 1,
    	border: false,
    	layout: 'fit'
    },
    items: [{
    	xtype: 'Welcome',
    	hidden: false
    },{
    	xtype: 'ServerTabs'
    },{
    	xtype: 'GroupTabs'
    },{
    	xtype: 'VMTabs'
    }]
});