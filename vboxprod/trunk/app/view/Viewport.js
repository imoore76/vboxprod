/**
 * Main viewport
 */
Ext.define('vboxprod.view.Viewport', {
    extend: 'Ext.container.Viewport',
    requires: [
           'vboxprod.view.ProgressOps',
           'vboxprod.view.VMToolbar',
           'vboxprod.view.MainPanel',
           'vboxprod.view.NavTree',
           'vboxprod.view.VMMenubar',
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
	   xtype: 'VMMenubar'
		
   },{
	   region : 'north',
	   xtype: 'VMToolbar'
   },{
	   region: 'center',
	   xtype: 'MainPanel',
	   layout: 'fit',
	   flex: 1
   }]
});           