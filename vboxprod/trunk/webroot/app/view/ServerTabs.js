Ext.define('vcube.view.ServerTabs', {
    extend: 'Ext.tab.Panel',
    alias: 'widget.ServerTabs',
    
	requires: [
       'vcube.widget.SectionTable',
	   'vcube.view.ServerConnector',
	   'vcube.view.ServerHost',
	   'vcube.view.VirtualMachinesList',
       'vcube.view.TasksAndEventsTab'
     ],

    defaults: {
    	border: false,
    	padding: 5
    },    
    items: [{
    	xtype: 'ServerConnector'
    },{
    	xtype: 'ServerHost',
    },{
    	xtype: 'VirtualMachinesList'
    },{
    	xtype: 'TasksAndEventsTab'
    }]
});