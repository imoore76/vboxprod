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
        tbar : [{
     	   'xtype':'button',
     	   'text':'New',
     	   'icon':'images/vbox/new_16px.png'
        },{
     	   'xtype':'button',
     	   'text': 'Settings',
     	   'icon': 'images/vbox/settings_16px.png'
        },{
     	   'xtype':'button',
     	   'text': 'Start',
     	   'icon': 'images/vbox/start_16px.png'
        },{
     	   'xtype':'button',
     	   'text': 'Stop',
     	   'icon': 'images/vbox/acpi_16px.png',
     		'menu' : [
     		   {'text':'Pause','icon':'images/vbox/pause_16px.png'},
     		   {'text':'Reset','icon':'images/vbox/reset_16px.png'},
     		   '-',
     		   {'text':'Save State','icon':'images/vbox/save_16px.png'},
     		   {'text':'ACPI Shutdown','icon':'images/vbox/acpi_16px.png'},
     		   {'text':'Power Off','icon':'images/vbox/poweroff_16px.png'}
     		]
        },{
     	   'xtype':'button',
     	   'text':'Devices',
     	   'icon' : 'images/vbox/chipset_16px.png'
        }],
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

