/**
 * Main viewport
 */
Ext.define('vboxprod.view.Viewport', {
    extend: 'Ext.container.Viewport',
    
    requires: [
           'vboxprod.view.ProgressOps',
           'vboxprod.view.MainPanel',
           'vboxprod.view.NavTree',
           'vboxprod.view.Menubar',
   ],
   
   layout: 'border',
   
   items : [{
	   region: 'south',
	   height: 100,
	   xtype: 'ProgressOps',
	   split: true,
	   html: 'ProgressOps'
   },{
	   region: 'west',
	   split: true,
	   xtype: 'NavTree'
   },{
	   region: 'north',
	   xtype: 'Menubar',
	   border: false
   },{
	   region: 'center',
	   xtype: 'MainPanel',
	   layout: 'fit',
	   flex: 1
   }]
});           