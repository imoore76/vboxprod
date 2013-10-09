/**
 * Virtual Machine tabs
 * 
 */

Ext.define('vcube.view.VMTabs', {
    
	extend: 'Ext.tab.Panel',
    
	alias: 'widget.VMTabs',
	
	requires: [
               'vcube.view.VMTabSummary',
               'vcube.view.VMTabDetails',
               'vcube.view.VMTabSnapshots',
               'vcube.view.VMTabConsole',
               'vcube.widget.SectionTable',
               'vcube.view.TasksAndEventsTab'
             ],
	
    defaults: {
    	border: false,
    	padding: 5
    },    
    items: [{
    	xtype: 'VMTabSummary'
    },{
    	xtype: 'VMTabDetails'
    },{
    	xtype: 'VMTabSnapshots'
    },{
    	xtype: 'TasksAndEventsTab'
    },{
    	xtype: 'VMTabConsole'
    }]
});