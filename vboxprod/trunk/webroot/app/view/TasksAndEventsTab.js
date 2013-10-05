/*
 * Events and tasks tabs
 */
Ext.define('vcube.view.TasksAndEventsTab', {
	extend: 'Ext.tab.Panel',
    alias: 'widget.TasksAndEventsTab',
    filter: null,
    title: 'Tasks and Events',
    icon: 'images/vbox/OSE/about_16px.png',
    defaults: { viewConfig: { markDirty: false } },
    items: [{
    	title: 'Tasks',
    	xtype: 'gridpanel',
    	itemId: 'tasks',
    	store: Ext.create('Ext.data.Store',{
    		autoload: false,
    		proxy: {
    			type: 'vcubeAjax',
    			url: 'tasklog/getTasks',
    	    	reader: {
    	    		type: 'vcubeJsonReader'
    	    	}
    		},
    		fields : [
    		   {name: 'id', type: 'int'},
    		   {name: 'name', type: 'string'},
    		   {name: 'machine', type: 'string'},
    		   {name: 'user', type: 'string'},
    		   {name: 'status', type: 'int'},
    		   {name: 'details', type: 'string'},
    		   {name: 'connector', type: 'int'},
    		   {name: 'started', type: 'date', dateFormat: 'Y-m-d H:i:s'},
    		   {name: 'completed', type: 'date', dateFormat: 'Y-m-d H:i:s'}
    		]
    	}),
    	columns: [
    		{
    			header: 'Task',
    			dataIndex: 'name',
    			renderer: function(v,m,record) {
    				if(record.get('machine')) {
    					cls = 'eventColumnMachine';
    				} else if(record.get('connector')) {
    					cls = 'eventColumnServer';
    				} else {
    					cls = 'eventColumnGeneral';
    				}
    				return '<div class="gridColumnIcon '+cls+'"> </div>' + v;
    			},
    			width: 300
    		},{
    			header: 'Initiated by',
    			dataIndex: 'user'
    		},{
    			header: 'Status',
    			dataIndex: 'status',
    			renderer: function(val) {
    				var status = 'Unknown';
    				switch(val) {
	    				case 0: status = 'Started'; break;
	    				case 1: status = 'Completed'; break;
	    				case 2: status = 'Errored'; break;
    				}
    				return status;
    			}
    		},{ 
    			header: 'Details',
    			dataIndex: 'details',
    			flex: 1
    		},{
    			header: 'Machine',
    			dataIndex: 'machine',
    			renderer: function(vmid) {
    				if(vmid) {
    					try {
    						return vcube.vmdatamediator.getVMData(vmid).name;
    					} catch(err) {
    						return vmid;
    					}
    				}
    			},
    			width: 150
    		},{ 
    			header: 'Server',
    			dataIndex: 'connector',
    			renderer: function(val) {
    				return vcube.app.serverStore.findRecord('id',val).get('name');
    			},
    			width: 150
    		},{
    			header: 'Started',
    			dataIndex: 'started',
    			xtype: 'datecolumn',
    			format: 'Y-m-d H:i.s',
    			width: 200
    		},{
    			header: 'Completed',
    			dataIndex: 'completed',
    			xtype: 'datecolumn',
    			format: 'Y-m-d H:i.s',
    			width: 200
    		}
    	]
    },{
    	title: 'Events',
    	xtype: 'gridpanel',
    	itemId: 'events',
    	store: Ext.create('Ext.data.Store',{
    		autoload: false,
    		proxy: {
    			type: 'vcubeAjax',
    			url: 'eventlog/getEvents',
    	    	reader: {
    	    		type: 'vcubeJsonReader'
    	    	}
    		},
    		fields : [
    		   {name: 'name', type: 'string'},
    		   {name: 'severity', type: 'int'},
    		   {name: 'details', type: 'string'},
    		   {name: 'machine', type: 'string'},
    		   {name: 'connector', type: 'int'},
    		   {name: 'time', type: 'date', dateFormat: 'Y-m-d H:i:s'}
    		]
    	}),
    	columns: [
    		{ 
    			header: 'Event',
    			dataIndex: 'name',
    			renderer: function(v,m,record) {
    				if(record.get('machine')) {
    					cls = 'eventColumnMachine';
    				} else if(record.get('connector')) {
    					cls = 'eventColumnServer';
    				} else {
    					cls = 'eventColumnGeneral';
    				}
    				return '<div class="gridColumnIcon '+cls+'"> </div>' + v;
    			},
    			width: 300
    		},{
    			header: 'Severity',
    			dataIndex: 'severity',
    			renderer: function(sev) {
    				var name = '';
    				switch(sev) {
	    				case 5: name = "Critical"; break;
	    				case 4: name = "Error"; break;
	    				case 3: name = "Warning"; break;
	    				default: name = "Info"
    				}
    				return "<div class='severityColuumn severityColuumn" + name + "'> </div>" + name;
    			}
    		},{ 
    			header: 'Details',
    			dataIndex: 'details',
    			flex: 1
    		},{
    			header: 'Machine',
    			dataIndex: 'machine',
    			renderer: function(vmid) {
    				if(vmid) {
    					try {
    						return vcube.vmdatamediator.getVMData(vmid).name;
    					} catch(err) {
    						return vmid;
    					}
    				}
    			},
    			width: 150
    		},{ 
    			header: 'Server',
    			dataIndex: 'connector',
    			renderer: function(val) {
    				return vcube.app.serverStore.findRecord('id',val).get('name');
    			},
    			width: 150
    		},{
    			header: 'Date',
    			dataIndex: 'time',
    			xtype: 'datecolumn',
    			format: 'Y-m-d H:i.s',
    			width: 200
    		}
    	]
    }]

});