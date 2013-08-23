Ext.define('vboxprod.view.VMMenubar', {
	extend: 'Ext.panel.Panel',
    alias: 'widget.VMMenubar',
    items: [{
        xtype: 'toolbar',
        dock: 'top',
	    items : [
	       {
	    	   'xtype':'button',
	    	   'text':'File',
	    		'menu' : [
	    		          vboxprodActions.global.vmm,
	    		          '-',
	    		          vboxprodActions.global.importappliance,
	    		          vboxprodActions.global.exportappliance,
	    		          '-',
	    		          vboxprodActions.global.preferences
	    		]
	       },
	       {
	    	   'xtype':'button',
	    	   'text':'Machine',
	    	   'menu' : []
	       },{
	    	   'xtype':'button',
	    	   'text':'Group',
	    	   'menu' : []
	       },{
	    	   'xtype':'button',
	    	   'text':'Help',
	    	   'menu' : []
	       }

	    ]
    }]
});