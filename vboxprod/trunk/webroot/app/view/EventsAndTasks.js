/*
 * Events and tasks tabs
 */
Ext.define('vcube.view.EventsAndTasks', {
	extend: 'Ext.tab.Panel',
    alias: 'widget.EventsAndTasks',
    filter: null,
    items: [{
    	title: 'Events',
    	xtype: 'gridpanel',
    	itemId: 'events',
    	columns: [
    		{ header: 'Name', dataIndex: 'name', width: 300 },
    		{ header: 'Severity', dataIndex: 'severity'},
    		{ header: 'Details', dataIndex: 'details', flex: 1},
    		{ header: 'Machine', dataIndex: 'machine'},
    		{ header: 'Server', dataIndex: 'connector'},
    		{ header: 'Date', dataIndex: 'time'}
    	]
    }]

});