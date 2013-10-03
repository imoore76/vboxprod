/**
 * Main viewport
 */
Ext.define('vcube.view.Viewport', {
    extend: 'Ext.container.Viewport',
    
    requires: [
           'vcube.view.EventsAndTasks',
           'vcube.view.MainPanel',
           'vcube.view.NavTree',
           'vcube.view.Menubar',
   ],
   
   layout: 'border',
   
   items : [{
	   region: 'south',
	   height: 100,
	   xtype: 'EventsAndTasks',
	   split: true
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