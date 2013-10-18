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
     	   'text':vcube.vmactions['new'].label.replace('...',''),
     	   'icon':'images/vbox/'+vcube.vmactions['new'].icon+'_16px.png'
        },{
     	   'xtype':'button',
     	   'text': vcube.vmactions['settings'].label.replace('...',''),
     	  'icon':'images/vbox/'+vcube.vmactions['settings'].icon+'_16px.png'
        },{
     	   'xtype':'button',
     	   'text': vcube.vmactions['start'].label.replace('...',''),
     	  'icon':'images/vbox/'+vcube.vmactions['start'].icon+'_16px.png'
        },{
     	   'xtype':'button',
     	   'text': vcube.vmactions['stop'].label.replace('...',''),
     	  'icon':'images/vbox/'+vcube.vmactions['stop'].icon+'_16px.png',
     		'menu' : [
     		   {'text':vcube.vmactions['pause'].label.replace('...',''),'icon':'images/vbox/'+vcube.vmactions['pause'].icon+'_16px.png'},
     		   {'text':vcube.vmactions['reset'].label.replace('...',''),'icon':'images/vbox/'+vcube.vmactions['reset'].icon+'_16px.png'},
     		   '-',
     		   {'text':vcube.vmactions['savestate'].label.replace('...',''),'icon':'images/vbox/'+vcube.vmactions['savestate'].icon+'_16px.png'},
     		   {'text':vcube.vmactions['powerbutton'].label.replace('...',''),'icon':'images/vbox/'+vcube.vmactions['powerbutton'].icon+'_16px.png'},
     		   {'text':vcube.vmactions['powerdown'].label.replace('...',''),'icon':'images/vbox/'+vcube.vmactions['powerdown'].icon+'_16px.png'},
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

