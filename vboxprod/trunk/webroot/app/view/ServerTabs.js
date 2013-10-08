Ext.define('vcube.view.ServerTabs', {
    extend: 'Ext.tab.Panel',
    alias: 'widget.ServerTabs',
    
	requires: [
	   'vcube.view.ServerTabConnector',
	   'vcube.view.SectionTable',
	   'vcube.view.VirtualMachinesList',
       'vcube.view.TasksAndEventsTab'
     ],

    defaults: {
    	border: false,
    	layout: 'fit',
    	padding: 5
    },    
    items: [{
    	xtype: 'ServerTabConnector'
    },{
    	xtype: 'VirtualMachinesList'
    },{
    	xtype: 'TasksAndEventsTab'
    }]
});