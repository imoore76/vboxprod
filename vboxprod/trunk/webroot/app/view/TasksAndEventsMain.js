/*
 * Events and tasks tabs
 */
Ext.define('vcube.view.TasksAndEventsMain', {
	extend: 'Ext.tab.Panel',
    alias: 'widget.TasksAndEventsMain',
    filter: null,
    defaults: { viewConfig: { markDirty: false } },
    items: [{
    	title: 'Tasks',
    	xtype: 'gridpanel',
    	itemId: 'tasks',
    	store: Ext.create('vcube.store.Tasks'),
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
    				try {
    					return vcube.app.serverStore.findRecord('id',val).get('name');    					
    				} catch (err) {
    					return val;
    				}
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
    	store: Ext.create('vcube.store.Events'),
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
    				try {
    					return vcube.app.serverStore.findRecord('id',val).get('name');    					
    				} catch (err) {
    					return val;
    				}
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