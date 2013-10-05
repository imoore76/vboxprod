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
        title: 'Server',
        icon: 'images/vbox/OSE/VirtualBox_cube_42px.png',
        iconCls: 'icon16'
    },{
    	xtype: 'TasksAndEventsTab'
    }]
});