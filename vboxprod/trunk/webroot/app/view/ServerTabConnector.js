/**
 * Server Summary tab
 * 
 */

Ext.define('vcube.view.ServerTabConnector', {
    
	extend: 'Ext.panel.Panel',
	
	statics: {
		
		sections: {

			info: {

				tableCfg: {
					title: vcube.utils.trans('Info'),
					icon: 'images/vbox/name_16px.png',
					border: true,
					width: 400,
					bodyStyle: { background: '#fff' },
					style: { margin: '0 20px 20px 0', display: 'inline-block', float: 'left' }
				},
				rows: [{
					title: 'Operating system',
					renderer: function(data) {
						return data.operatingSystem + ' ' + data.OSVersion
					}
				},{
					title: 'VirtualBox Version',
					renderer: function(data) {
						return data.version.string
					}
				}]
			},
			

			vms: {

				tableCfg: {
					title: vcube.utils.trans('Virtual Machines'),
					icon: 'images/vbox/machine_16px.png',
					border: true,
					width: 250,
					bodyStyle: { background: '#fff' },
					style: { margin: '0 20px 20px 0', display: 'inline-block', float: 'left' }
				},
				redrawEvents: ['MachineStateChanged'],
				rows: function(data) {
					
					var rows = [], states = {},
						vmList = vcube.vmdatamediator.getVMDataByFilter(function(vm){return vm.connector_id == data.connector_id;});
					
					Ext.each(vmList, function(vm) {
						if(!states[vm.state]) states[vm.state] = 1;
						else states[vm.state]++;
					});
					
					for(var state in states) {
						if(typeof(state) != 'string') continue;
						rows.push({
							title: '',
							data: states[state] + ' ' + vcube.utils.vboxVMStates.convert(state)
						});
					}
					return rows;
				}
			},
			
			
			resources: {
				tableCfg: {
					title: vcube.utils.trans('Resources'),
					icon: 'images/vbox/chipset_16px.png',
					border: true,
					width: 200,
					bodyStyle: { background: '#fff' },
					style: { margin: '0 20px 20px 0', display: 'inline-block', float: 'left' }
				},
				rows: [{
					title: 'Max Guest Ram',
					renderer: function(data) {
						return vcube.utils.mbytesConvert(data.maxGuestRAM);
					}
				},{
					title: 'Max Guest CPU Count',
					attrib: 'maxGuestCPUCount'
				}]
				
			},

			paths: {
				tableCfg: {
					title: vcube.utils.trans('Paths'),
					icon: 'images/vbox/shared_folder_16px.png',
					border: true,
					width: 600,
					bodyStyle: { background: '#fff' },
					style: { margin: '0 20px 20px 0', display: 'inline-block', float: 'left' }
				},
				rows: [{
					title: 'Home folder',
					attrib: 'homeFolder'
				},{
					title: 'Settings File',
					attrib: 'settingsFilePath'
				},{
					title: 'Default machine folder',
					attrib: 'defaultMachineFolder'
				}]
				
			}
		}
	},
    
	alias: 'widget.ServerTabConnector',
	
    title: 'Connector',
    icon: 'images/vbox/virtualbox-vdi.png',
    iconCls: 'icon16',
    items: [{
    	autoScroll: true,
    	border: false,
    	defaults: { border: false },
    	items: [{
    	    itemId: 'summary',
    	    defaults: { border: false },
    	    items:[{
		    	tpl: '<img src="images/vbox/OSE/VirtualBox_cube_42px.png" height=64 width=64 style="float:left; margin-right: 20px;" /><h3 align="left">{name} ({status_name}) - {location}</h3>asdf{description}'
		    },{
		    	height: 20,
		    	html: ''
		    }]
    	},{
    		itemId: 'sectionTables',
    		defaults: { border: false },
    		html: ''
    	}]
    }]
});
