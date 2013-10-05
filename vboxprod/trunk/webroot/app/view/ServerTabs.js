Ext.define('vcube.view.ServerTabs', {
    extend: 'Ext.tab.Panel',
    alias: 'widget.ServerTabs',
    
	requires: [
       'vcube.view.TasksAndEventsTab'
     ],

    defaults: {
    	border: false,
    	layout: 'fit',
    	padding: 5
    },    
    items: [{
        title: 'Group Tab 1'
    },{
    	xtype: 'TasksAndEventsTab'
    }]
});