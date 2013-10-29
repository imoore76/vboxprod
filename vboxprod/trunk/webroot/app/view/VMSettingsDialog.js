Ext.define('vcube.view.VMSettingsDialog',{

	extend: 'vcube.widget.SettingsDialog',
	alias: 'view.VMSettingsDialog',
	
	requires: ['vcube.form.field.ostype', 'vcube.form.field.usbcontrollers',
	           'vcube.form.field.usbfilters', 'vcube.form.field.networkadapters',
	           'vcube.form.field.serialports'],
	
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
				xtype: 'ostypefield',
				name: 'OSTypeId'
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
				name: 'GUI.SaveMountedAtRuntime',
				boxLabel: 'Remember Runtime Changes',
				inputValue: "yes",
				uncheckedValue: "no"
			}]
		},{
			title: 'Description',
			layout: 'fit',
			name: 'description',
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
				xtype: 'vcubesliderfield',
				maxValue: 4096,
				minValue: 4,
				valueLabel: 'MB',
				name: 'memorySize'
			},{
				fieldLabel: 'Boot Order',
				xtype: 'bootorderfield',
				name: 'bootOrder'
			},{
				fieldLabel: 'Chipset',
				xtype: 'combo',
				editable: false,
				name: 'chipsetType',
				displayField: 'display',
				valueField: 'value',
				store: Ext.create('vcube.store.VboxEnums',{
					enumClass: 'ChipsetType',
					ignoreNull: true
				})
			},{
				fieldLabel: 'Extended Features',
				xtype: 'checkbox',
				boxLabel: 'Enable I/O APIC',
				name: 'BIOSSettings.IOAPICEnabled'
			},{
				xtype: 'checkbox',
				fieldLabel: ' ',
				labelSeparator: '',
				boxLabel: 'Enable EFI (special OSes only)',
				name: 'firmwareType',
				uncheckedValue: "BIOS",
				inputValue: "EFI"
			},{
				xtype: 'checkbox',
				fieldLabel: ' ',
				labelSeparator: '',
				boxLabel: 'Hardware Clock in UTC Time',
				name: 'RTCUseUTC'
			}]
		},{
			title: 'Processor',
			defaults: {
				labelWidth: 150,
				labelAlign: 'right'
			},
			items: [{
				fieldLabel: 'Processor(s)',
				xtype: 'vcubesliderfield',
				maxValue: 16,
				minValue: 1,
				valueLabel: 'CPU(s)',
				hideValueBox: true,
				name: 'CPUCount'
			},{
				fieldLabel: 'Execution Cap',
				xtype: 'vcubesliderfield',
				maxValue: 100,
				minValue: 1,
				valueLabel: '%',
				hideValueBox: true,
				name: 'CPUExecutionCap'
			},{
				fieldLabel: 'Extended Features',
				xtype: 'checkbox',
				boxLabel: 'Enable PAE/NX',
				name: 'CpuProperties.PAE'
			}]
			
		},{
			title: 'Acceleration',
			items: [{
				fieldLabel: 'Hardware Virtualization',
				labelWidth: 200,
				xtype: 'checkbox',
				boxLabel: 'Enable VT-x/AMD-V',
				name: 'HWVirtExProperties.Enabled'
			},{
				xtype: 'checkbox',
				fieldLabel: ' ',
				labelSeparator: '',
				boxLabel: 'Enable Nested Paging',
				name: 'HWVirtExProperties.NestedPaging'
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
				xtype: 'vcubesliderfield',
				maxValue: 128,
				minValue: 4,
				valueLabel: 'MB',
				hideValueBox: true,
				name: 'VRAMSize'

			}]
		},{
			title: 'Remote Display',
			defaults: {
				labelWidth: 150,
				labelAlign: 'right'
			},
			items: [{
				xtype: 'checkbox',
				boxLabel: 'Enable Server',
				name: 'VRDEServer.enabled'
			},{
				xtype: 'textfield',
				fieldLabel: 'Server Port',
				name: 'VRDEServer.ports'
			},{
				xtype: 'combo',
				editable: false,
				fieldLabel: 'Authentication Method',
				name: 'VRDEServer.authType',
				displayField: 'display',
				valueField: 'value',
				store: Ext.create('vcube.store.VboxEnums',{
					enumClass: 'AuthType'
				})

			},{
				xtype: 'numberfield',
				fieldLabel: 'Authentication Timeout',
				name: 'VRDEServer.authTimeout'
			},{
				xtype: 'checkbox',
				fieldLabel: 'Extended Features',
				boxLabel: 'Allow Multiple Connections',
				name: 'VRDEServer.allowMultiConnection'
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
			boxLabel: 'Enable Audio',
			name: 'audioAdapter.enabled'
		},{
			xtype: 'combo',
			editable: false,
			fieldLabel: 'Host Audio Driver',
			name: 'audioAdapter.audioDriver',
			displayField: 'display',
			valueField: 'value',
			lastQuery: '',
			store: Ext.create('vcube.store.VboxEnums',{
				enumClass: 'AudioDriverType',
				conversionFn: vcube.utils.vboxAudioDriver
			})
		},{
			xtype: 'combo',
			editable: false,
			fieldLabel: 'Audio Controller',
			name: 'audioAdapter.audioController',
			displayField: 'display',
			valueField: 'value',
			lastQuery: '',
			store: Ext.create('vcube.store.VboxEnums',{
				enumClass: 'AudioControllerType',
				conversionFn: vcube.utils.vboxAudioController
			})			
		}]
	},{
		name:'Network',
		label:'Network',
		image:'nw',
		xtype: 'networkadaptersfield',
		name: 'networkAdapters'
	},{
		name:'SerialPorts',
		label:'Serial Ports',
		xtype: 'serialportsfield',
		image:'serial_port'
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
			xtype: 'usbcontrollersfield',
			name: 'USBControllers'
		},{
			/*
			title: 'USB Device Filters',
			*/
			xtype: 'usbfiltersfield',
			name: 'USBDeviceFilters',
			flex: 1
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