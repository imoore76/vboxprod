/**
 * Virtual Machine tabs
 * 
 */

Ext.define('vcube.view.VMTabs', {
    
	extend: 'Ext.tab.Panel',
    
	alias: 'widget.VMTabs',
	
	requires: [
               'vcube.view.VMSummary',
               'vcube.view.VMDetails',
               'vcube.view.VMSnapshots',
               'vcube.view.VMConsole',
               'vcube.widget.SectionTable',
               'vcube.view.TasksAndEventsTab'
             ],
	
    defaults: {
    	border: false,
    	padding: 5
    },    
    items: [{
    	xtype: 'VMSummary'
    },{
    	xtype: 'VMDetails'
    },{
    	xtype: 'VMSnapshots'
    },{
    	xtype: 'TasksAndEventsTab'
    },{
    	xtype: 'VMConsole'
    }]
});