Ext.define('vboxprod.view.Menubar', {
	extend: 'Ext.panel.Panel',
    alias: 'widget.Menubar',
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
	    		          vboxprodActions.global.preferences,
	    		          '-',
	    		          {text:'Logout',itemId:'logout'}
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