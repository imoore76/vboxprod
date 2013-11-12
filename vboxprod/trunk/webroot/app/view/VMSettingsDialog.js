Ext.define('vcube.view.VMSettingsDialog',{

	extend: 'vcube.widget.SettingsDialog',
	alias: 'view.VMSettingsDialog',
	
	title: '{0} - Settings',
	
	width: 800,
	
	
	requires: ['vcube.form.field.ostype', 'vcube.form.field.usbcontrollers',
	           'vcube.form.field.usbfilters', 'vcube.form.field.networkadapters',
	           'vcube.form.field.serialports', 'vcube.form.field.parallelports',
	           'vcube.form.field.sharedfolders', 'vcube.form.field.storage',
	           'vcube.widget.fsbrowser'],
	           
	
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
			},{
				xtype: 'textfield',
				fieldLabel: 'icon',
				name: 'icon'
			}]
		},{
			title: 'Advanced',
			defaults: {
				labelWidth: 150,
				labelAlign: 'right'
			},
			items: [{
				xtype: 'fieldcontainer',
				layout: 'hbox',
				items: [{
					labelWidth: 150,
					labelAlign: 'right',
					xtype: 'textfield',
					fieldLabel: 'Snapshot Folder',
					name: 'snapshotFolder',
					flex: 1
				},{
					xtype: 'button',
					icon: 'images/vbox/select_file_16px.png',
					height: 22,
					width: 22,
					margin: '1 0 0 2',
					padding: 2,
					handler: function(btn) {
						
						var txt = btn.up('.fieldcontainer').down('[name=snapshotFolder]');
						
						var browser = Ext.create('vcube.widget.fsbrowser',{
			    			browserType: 'folder',
			    			serverId: btn.up('.window').serverId,
			    			title: 'Select folder...',
			    			initialPath: txt.getValue()
			    		});
			    		
			    		Ext.ux.Deferred.when(browser.browse()).done(function(f) {
			    			txt.setValue(f);
			    		});

					}
				}]
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
				store: Ext.create('vcube.data.VboxEnumStore',{
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
				name: 'HWVirtExProperties.Enabled',
				listeners: {
					change: function(cb, val) {
						cb.ownerCt.down('[name=HWVirtExProperties.NestedPaging]').setDisabled(!val);
					}
				}
			},{
				xtype: 'checkbox',
				fieldLabel: ' ',
				labelSeparator: '',
				boxLabel: 'Enable Nested Paging',
				disabled: true,
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
				name: 'VRAMSize'

			}]
		},{
			title: 'Remote Display',
			defaults: {
				labelWidth: 150,
				labelAlign: 'right',
				disabled: true
			},
			items: [{
				xtype: 'checkbox',
				boxLabel: 'Enable Server',
				name: 'VRDEServer.enabled',
				disabled: false,
				listeners: {
					change: function(cb, val) {
						Ext.each(['ports','authType','authTimeout','allowMultiConnection'], function(name){
							cb.ownerCt.down('[name=VRDEServer.' + name + ']').setDisabled(!val);
						});
					}
				}
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
				store: Ext.create('vcube.data.VboxEnumStore',{
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
		name:'storageControllers',
		label:'Storage',
		xtype: 'storagefield',
		image:'attachment'
	},{
		name:'audioAdapter',
		label:'Audio',
		image:'sound',
		layout: 'form',
		frame: true,
		defaults: {
			disabled: true
		},
		items: [{
			xtype: 'checkbox',
			boxLabel: 'Enable Audio',
			name: 'audioAdapter.enabled',
			disabled: false,
			listeners: {
				change: function(cb, val) {
					cb.ownerCt.down('[name=audioAdapter.audioDriver]').setDisabled(!val);
					cb.ownerCt.down('[name=audioAdapter.audioController]').setDisabled(!val);
				}
			}
		},{
			xtype: 'combo',
			editable: false,
			fieldLabel: 'Host Audio Driver',
			name: 'audioAdapter.audioDriver',
			displayField: 'display',
			valueField: 'value',
			lastQuery: '',
			store: Ext.create('vcube.data.VboxEnumStore',{
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
			store: Ext.create('vcube.data.VboxEnumStore',{
				enumClass: 'AudioControllerType',
				conversionFn: vcube.utils.vboxAudioController
			})
		}]
	},{
		label:'Network',
		image:'nw',
		xtype: 'networkadaptersfield',
		name: 'networkAdapters'
	},{
		label:'Serial Ports',
		xtype: 'serialportsfield',
		image:'serial_port',
		name: 'serialPorts'
	},{
		label:'Parallel Ports',
		image:'parallel_port',
		name:'parallelPorts',
		xtype: 'parallelportsfield'
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
			xtype: 'usbfiltersfield',
			name: 'USBDeviceFilters',
			flex: 1
		}]
	},{
		name:'sharedFolders',
		label:'Shared Folders',
		image:'sf',
		xtype: 'sharedfoldersfield'
	}]
		
});