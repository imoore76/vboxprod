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
			
			paths: {
				tableCfg: {
					title: vcube.utils.trans('Paths'),
					icon: 'images/vbox/shared_folder_16px.png',
					border: true,
					width: 400,
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
				
			},
			
			resources: {
				tableCfg: {
					title: vcube.utils.trans('Resources'),
					icon: 'images/vbox/chipset_16px.png',
					border: true,
					width: 400,
					bodyStyle: { background: '#fff' },
					style: { margin: '0 20px 20px 0', display: 'inline-block', float: 'left' }
				},
				rows: [{
					title: 'Max Guest Ram',
					attrib: 'maxGuestRAM'
				},{
					title: 'Max Guest CPU Count',
					attrib: 'maxGuestCPUCount'
				}]
				
			}

		}
	},
    
	alias: 'widget.ServerTabConnector',
	
    title: 'Connector',
    icon: 'images/vbox/OSE/VirtualBox_cube_42px.png',
    iconCls: 'icon16',    
    layout: {
    	type: 'vbox',
    	align: 'stretch',
    	pack: 'start'
    },
    items: [{
    	border: false,
    	defaults: { border: false },
    	items: [{
    	    itemId: 'summary',
    	    defaults: { border: false },
    	    items:[{
		    	tpl: '<img src="images/vbox/OSE/VirtualBox_cube_42px.png" height=64 width=64 style="float:left; margin-right: 20px;" /><h3 align="left">{name}</h3>asdf{description}'
		    },{
		    	height: 20,
		    	html: ''
		    },{
		    	tpl: '<div align="left"><b>Location:</b> {location}</div>'
		    },{
		    	tpl: '<div align="left"><b>Status:</b> {status_text}</div>'
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
