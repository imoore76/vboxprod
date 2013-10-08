/*
 * Events and tasks tabs
 */
Ext.define('vcube.view.VirtualMachinesList', {
	extend: 'Ext.panel.Panel',
    alias: 'widget.VirtualMachinesList',
    title: 'Virtual Machines',
    icon: 'images/vbox/machine_16px.png',
    defaults: { viewConfig: { markDirty: false } },
    items: [{
    	xtype: 'gridpanel',
    	columns: [{
	    	  header: 'Name',
	    	  dataIndex: 'name',
	    	  width: 300
	      },{
	    	  header: 'State',
	    	  dataIndex: 'user'
	      },{
	    	  header: 'OS',
	    	  dataIndex: 'status'
	      },{
	    	  header: 'Details',
	    	  dataIndex: 'details',
	    	  flex: 1
	      }]    	
    }]
});

