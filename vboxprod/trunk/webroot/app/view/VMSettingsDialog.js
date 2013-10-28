Ext.define('vcube.view.VMSettingsDialog',{

	extend: 'vcube.widget.SettingsDialog',
	alias: 'view.VMSettingsDialog',
	
	sections: [{
		name: 'General',
		label:'General',
		image:'machine',
		xtype: 'tabpanel',
		items: [{
			title: 'Basic',
			items: [{
				xtype: 'textfield',
				fieldLabel: 'Name',
				name: 'name'
			},{
				xtype: 'combo',
				editable: false,
				fieldLabel: 'Type',
				name: 'OSType'
			},{
				xtype: 'combo',
				editable: false,
				fieldLabel: 'Version',
				name: 'OSVersion'
			}]
		},{
			title: 'Advanced',
			defaults: {
				labelWidth: 150,
				labelAlign: 'right'
			},
			items: [{
				xtype: 'textfield',
				fieldLabel: 'Snapshot Folder',
				name: 'snapshotFolder'
			},{
				xtype: 'checkbox',
				fieldLabel: 'Removable Media',
				name: 'GUI/RCantRemember',
				boxLabel: 'Remember Runtime Changes'
			}]
		},{
			title: 'Description',
			layout: 'fit',
			items: [{
				xtype: 'textarea',
				width: '100%'
			}]
		}]
	},{
		name:'System',
		label:'System',
		image:'chipset',
		xtype: 'tabpanel',
		items: [{
			title: 'Motherboard',
			defaults: {
				labelWidth: 150,
				labelAlign: 'right'
			},
			items: [{
				fieldLabel: 'Base Memory',
				xtype: 'SliderField',
				maxValue: 4096,
				minValue: 4,
				valueLabel: 'MB',
				value: 34
			},{
				fieldLabel: 'Boot Order',
				xtype: 'BootOrderField'
			},{
				fieldLabel: 'Chipset',
				xtype: 'combo',
				editable: false,
			},{
				fieldLabel: 'Extended Features',
				xtype: 'checkbox',
				boxLabel: 'Enable I/O APIC'
			},{
				xtype: 'checkbox',
				fieldLabel: ' ',
				labelSeparator: '',
				boxLabel: 'Enable EFI (special OSes only)'
			},{
				xtype: 'checkbox',
				fieldLabel: ' ',
				labelSeparator: '',
				boxLabel: 'Hardware Clock in UTC Time'
			}]
		},{
			title: 'Processor',
			defaults: {
				labelWidth: 150,
				labelAlign: 'right'
			},
			items: [{
				fieldLabel: 'Processor(s)',
				xtype: 'SliderField',
				maxValue: 16,
				minValue: 1,
				valueLabel: 'CPU(s)',
				hideValueBox: true,
				value: 2
			},{
				fieldLabel: 'Execution Cap',
				xtype: 'SliderField',
				maxValue: 100,
				minValue: 1,
				valueLabel: '%',
				hideValueBox: true,
				value: 100
			},{
				fieldLabel: 'Extended Features',
				xtype: 'checkbox',
				boxLabel: 'Enable PAE/NX'
			}]
			
		},{
			title: 'Acceleration',
			items: [{
				fieldLabel: 'Hardware Virtualization',
				labelWidth: 200,
				xtype: 'checkbox',
				boxLabel: 'Enable VT-x/AMD-V'
			},{
				xtype: 'checkbox',
				fieldLabel: ' ',
				labelSeparator: '',
				boxLabel: 'Enable Nested Paging'
			}]
		}]
	},{
		name:'Display',
		label:'Display',
		image:'vrdp',
		xtype: 'tabpanel',
		items: [{
			title: 'Video',
			items: [{
				fieldLabel: 'Video Memory',
				xtype: 'SliderField',
				maxValue: 128,
				minValue: 4,
				valueLabel: 'MB',
				hideValueBox: true,
				value: 64

			}]
		},{
			title: 'Remote Display',
			defaults: {
				labelWidth: 150,
				labelAlign: 'right'
			},
			items: [{
				xtype: 'checkbox',
				boxLabel: 'Enable Server'
			},{
				xtype: 'textfield',
				fieldLabel: 'Server Port'
			},{
				xtype: 'combo',
				editable: false,
				fieldLabel: 'Authentication Method'				
			},{
				xtype: 'numberfield',
				fieldLabel: 'Authentication Timeout'
			},{
				xtype: 'checkbox',
				fieldLabel: 'Extended Features',
				boxLabel: 'Allow Multiple Connections'
			}]
		}]
	},{
		name:'Storage',
		label:'Storage',
		image:'attachment',
		defaults: {},
		layout: {
			type: 'border'
		},
		items: [{
			title: 'Storage Tree',
			xtype: 'treepanel',
			rootVisible: false,
			region: 'west',
			width: 200,
			split: true
		},{
			title: 'Attributes',
			region: 'center',
			split: true
		}]
	},{
		name:'Audio',
		label:'Audio',
		image:'sound',
		frame: true,
		defaults: {},
		items: [{
			xtype: 'checkbox',
			boxLabel: 'Enable Audio'
		},{
			xtype: 'combo',
			editable: false,
			fieldLabel: 'Host Audio Driver'
		},{
			xtype: 'combo',
			editable: false,
			fieldLabel: 'Audio Controller'
		}]
	},{
		name:'Network',
		label:'Network',
		image:'nw',
		xtype: 'tabpanel',
		items: [{
			title: 'Adapter {0}',
			layout: 'form',
			items: [{
				xtype: 'checkbox',
				boxLabel: 'Enable Network Adapter'
			},{
				xtype: 'combo',
				editable: false,
				fieldLabel: 'Attached to'
			},{
				xtype: 'textfield',
				fieldLabel: 'Name'
			},{
				xtype: 'combo',
				editable: false,
				fieldLabel: 'Adapter Type'
			},{
				xtype: 'combo',
				editable: false,
				fieldLabel: 'Promiscuous Mode'
			},{
				xtype: 'fieldcontainer',
				layout: 'hbox',
				items: [{
					xtype: 'textfield',
					fieldLabel: 'MAC Address',
					labelAlign: 'right'
				},{
					xtype: 'button',
					icon: 'images/vbox/refresh_16px.png',
					itemId: 'refreshmac',
					border: false,
					frame: false
				}]
			},{
				fieldLabel: ' ',
				labelSeparator: '',
				xtype: 'checkbox',
				boxLabel: 'Cable Connected'
			}]
		}]
	},{
		name:'SerialPorts',
		label:'Serial Ports',
		image:'serial_port',
		xtype: 'tabpanel',
		items: [{
			title: 'Port {0}',
			items: [{
				xtype: 'checkbox',
				boxLabel: 'Enable Serial Port'
			},{
				xtype: 'fieldcontainer',
				layout: 'hbox',
				defaults: {
					labelAlign: 'right',
					defaults: {}
				},
				items: [{
					xtype: 'combo',
					editable: false,
					fieldLabel: 'Port Number'
				},{
					xtype: 'numberfield',
					labelWidth: 50,
					inputWidth: 50,
					fieldLabel: 'IRQ'
				},{
					xtype: 'textfield',
					labelWidth: 80,
					inputWidth: 50,
					fieldLabel: 'I/O Port'
				}]
			},{
				xtype: 'combo',
				editable: false,
				fieldLabel: 'Port Mode'
			},{
				fieldLabel: ' ',
				labelSeparator: '',
				xtype: 'checkbox',
				boxLabel: 'Create Pipe'
			},{
				xtype: 'textfield',
				fieldLabel: 'Port/File Path'
			}]
		}]
	},{
		name:'ParallelPorts',
		label:'Parallel Ports',
		image:'parallel_port',
		xtype: 'tabpanel',
		items: [{
			title: 'Port {0}',
			items: [{
				xtype: 'checkbox',
				boxLabel: 'Enable Serial Port'
			},{
				xtype: 'fieldcontainer',
				layout: 'hbox',
				defaults: {
					labelAlign: 'right',
					defaults: {}
				},
				items: [{
					xtype: 'combo',
					editable: false,
					fieldLabel: 'Port Number'
				},{
					xtype: 'numberfield',
					labelWidth: 50,
					inputWidth: 50,
					fieldLabel: 'IRQ'
				},{
					xtype: 'textfield',
					labelWidth: 80,
					inputWidth: 50,
					fieldLabel: 'I/O Port'
				}]
			},{
				xtype: 'combo',
				editable: false,
				fieldLabel: 'Port Mode'
			},{
				fieldLabel: ' ',
				labelSeparator: '',
				xtype: 'checkbox',
				boxLabel: 'Create Pipe'
			},{
				xtype: 'textfield',
				fieldLabel: 'Port/File Path'
			}]
		}]
	},{
		name:'USB',
		label:'USB',
		image:'usb',
		layout: {
			type: 'vbox',
			align: 'stretch',
			pack: 'start'
		},
		defaults: {
			border: true
		},
		items: [{
			xtype: 'checkbox',
			boxLabel: 'Enable USB Controller'
		},{
			xtype: 'checkbox',
			boxLabel: 'Enable USB 2.0 (EHCI) Controller'
		},{
			title: 'USB Device Filters',
			xtype: 'gridpanel',
			frame: true,
			flex: 1,
			hideHeaders: true,
			columns: [{
				dataIndex: 'enabled',
				xtype: 'checkcolumn'
			},{
				dataIndex: 'description'
			}]
		}]
	},{
		name:'SharedFolders',
		label:'Shared Folders',
		image:'sf',
		layout: 'fit',
		items: [{
			xtype: 'gridpanel',
			columns: [{
				header: 'Name',
				dataIndex: 'name'
			},{
				header: 'Path',
				dataIndex: 'path',
				flex: 1
			},{
				header: 'Auto-mount',
				dataIndex: 'automount'
			},{
				header: 'Access',
				dataIndex: 'access'
			}]
		}]
	}]
		
});