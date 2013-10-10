Ext.define('vcube.view.ServerTabs', {
    extend: 'Ext.tab.Panel',
    alias: 'widget.ServerTabs',
    
	requires: [
       'vcube.widget.SectionTable',
	   'vcube.view.ServerTabConnector',
	   'vcube.view.ServerTabHost',
	   'vcube.view.VirtualMachinesList',
       'vcube.view.TasksAndEventsTab'
     ],

    defaults: {
    	border: false,
    	padding: 5
    },    
    items: [{
    	xtype: 'ServerTabConnector'
    },{
    	xtype: 'ServerTabHost',
    },{
    	xtype: 'VirtualMachinesList'
    },{
    	xtype: 'TasksAndEventsTab'
    }]
});