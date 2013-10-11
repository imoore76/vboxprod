/*
 * Events and tasks tabs
 */
Ext.define('vcube.view.TasksAndEventsMain', {
	extend: 'Ext.tab.Panel',
    alias: 'widget.TasksAndEventsMain',
    requires: ['vcube.grid.column'],
    taskDetailsColumnWidth: 0,
    filter: null,
    defaults: { viewConfig: { markDirty: false } },
    items: [{
    	title: 'Tasks',
    	xtype: 'gridpanel',
    	itemId: 'tasks',
    	store: Ext.create('vcube.store.Tasks'),
    	columns: [{
				xtype: 'tasknamecolumn',
				width: 300
    		},{
    			xtype: 'logcategorycolumn',
    			width: 180
			},{
				header: 'Initiated by',
				dataIndex: 'user'
			},{
				xtype: 'taskstatuscolumn'
			},{ 
				xtype: 'taskdetailscolumn',
				flex: 1
			},{
				xtype: 'machinecolumn',
				width: 150
			},{
				xtype: 'servercolumn',
				width: 150
			},{
				header: 'Started',
				dataIndex: 'started',
				xtype: 'datecolumn',
				format: 'Y-m-d H:i.s',
				width: 150
			},{
				header: 'Completed',
				dataIndex: 'completed',
				xtype: 'datecolumn',
				format: 'Y-m-d H:i.s',
				width: 150
			}]
    },{
    	title: 'Events',
    	xtype: 'gridpanel',
    	itemId: 'events',
    	store: Ext.create('vcube.store.Events'),
    	columns: [{ 
				xtype: 'eventnamecolumn',
				width: 300
			},{
				xtype: 'logcategorycolumn',
				width: 180
			},{
				xtype: 'eventseveritycolumn'
			},{ 
				header: 'Details',
				dataIndex: 'details',
				renderer: function(v){
					return Ext.String.htmlEncode(v);
				},
				flex: 1
			},{
				xtype: 'machinecolumn',
				width: 150
			},{ 
				xtype: 'servercolumn',
				width: 150
			},{
				header: 'Date',
				dataIndex: 'time',
				xtype: 'datecolumn',
				format: 'Y-m-d H:i.s',
				width: 150
		}]
    }]

});