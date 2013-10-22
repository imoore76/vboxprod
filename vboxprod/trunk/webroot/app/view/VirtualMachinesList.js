/*
 * List of virtual machines in server or group
 */
Ext.define('vcube.view.VirtualMachinesList', {
	extend: 'Ext.panel.Panel',
    alias: 'widget.VirtualMachinesList',
    title: 'Virtual Machines',
    icon: 'images/vbox/machine_16px.png',
    frame: true,
    defaults: { viewConfig: { markDirty: false } },
    items: [{
    	xtype: 'gridpanel',
        tbar : [
            vcube.actionpool.getAction('machine','new'),
            '-',
            vcube.actionpool.getAction('machine','start'),
	   		// stop
	   		Ext.Object.merge({},vcube.actionpool.getActionsAsBase('machine',['stop'])[0],{
	   			menu: vcube.actionpool.getActions('machine',['savestate','powerbutton','poweroff'])
	   		}),
	   		'-',
	   		vcube.actionpool.getAction('machine','settings')

        ],
    	columns: [{
	    	  header: 'Name',
	    	  dataIndex: 'name',
	    	  width: 300
	      },{
	    	  header: 'State',
	    	  dataIndex: 'user'
	      },{
	    	  header: 'Last State Change',
	    	  dataIndex: 'lastStateChange'
	      },{
	    	  header: 'OS',
	    	  dataIndex: 'OSTypeDesc'
	      },{
	    	  header: 'Details',
	    	  dataIndex: 'details',
	    	  flex: 1
	      },{
			header: 'Memory',
			dataIndex: 'memory'
	      },{
			header: 'CPUs',
			dataIndex: 'cpuCount'
	      },{
			header: 'Execution Cap',
			dataIndex: 'executionCap'
	      }]    	
    }]
});

