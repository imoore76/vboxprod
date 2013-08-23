Ext.define('vboxprod.view.MainPanel', {
	
    extend: 'Ext.panel.Panel',
    
    requires: [           
      'vboxprod.view.Welcome',
      'vboxprod.view.GroupTabs',
      'vboxprod.view.VMTabs',
    ],
    
    alias: 'widget.MainPanel',
    defaults: {
    	hidden: true,
    	flex: 1,
    	border: false
    },
    items: [{
    	xtype: 'Welcome',
    	hidden: false
    },{
    	xtype: 'GroupTabs'
    },{
    	xtype: 'VMTabs'
    }]
});