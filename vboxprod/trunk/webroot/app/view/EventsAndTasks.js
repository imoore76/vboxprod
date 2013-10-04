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
    	store: Ext.create('Ext.data.Store',{
    		autoload: false,
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
    					return vcube.vmdatamediator.getVMData(vmid).name;
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