/**
 * Virtual Machine Summary tab
 * 
 */

Ext.define('vcube.view.VMTabDetails', {
    
	extend: 'Ext.panel.Panel',
    
	alias: 'widget.VMTabDetails',
	
	/* Details */
    title: 'Details',
    itemId: 'DetailsTab',
    cls: 'vmTabDetails',
    icon: 'images/vbox/settings_16px.png',
    autoScroll: true,
    layout: 'vbox',
    width: '100%',
    defaults: { xtype: 'panel', width: '100%', margin: '10 0 0 0', defaults: { xtype: 'displayfield' } },

	statics: {
		
		/*
		 * 
		 * List of VM details sections and their content
		 * 
		 */
		vmDetailsSections : {
				
				/*
				 * General
				 */
				general: {
					icon:'machine_16px.png',
					title: vcube.utils.trans('General','VBoxGlobal'),
					settingsLink: 'General',
					multiSelectDetailsTable: true,
					rows : [
					   {
						   title: vcube.utils.trans('Name', 'VBoxGlobal'),
						   attrib: 'name'
					   },
					   {
						   title: vcube.utils.trans('OS Type', 'VBoxGlobal'),
						   attrib: 'OSTypeDesc'
					   },
					   {
						   title: vcube.utils.trans('Guest Additions Version'),
						   attrib: 'guestAdditionsVersion'
					   }
					   
					]
				},
				
				/*
				 * System
				 */
				system : {
					icon:'chipset_16px.png',
					title: vcube.utils.trans('System','VBoxGlobal'),
					settingsLink: 'System',
					redrawOnEvents: ['CPUExecutionCapChanged'],
					multiSelectDetailsTable: true,
					rows : [
					   {
						   title: vcube.utils.trans('Base Memory','VBoxGlobal'),
						   renderer: function(d) {
							   return vcube.utils.trans('<nobr>%1 MB</nobr>').replace('%1',d['memorySize']);
						   }
					   },{
						   title: vcube.utils.trans("Processor(s)",'VBoxGlobal'),
						   attrib: 'CPUCount',
						   condition: function(d) { return d.CPUCount > 1; }
					   },{
						   title: vcube.utils.trans("Execution Cap"),
						   renderer: function(d) {
							   return vcube.utils.trans('<nobr>%1%</nobr>').replace('%1',parseInt(d['CPUExecutionCap']));
						   },
						   condition: function(d) { return d.CPUExecutionCap < 100; }
					   },{
						   title: vcube.utils.trans("Boot Order"),
						   renderer: function(d) {
								var bo = new Array();
								for(var i = 0; i < d['bootOrder'].length; i++) {
									bo[i] = vcube.utils.trans(vcube.utils.vboxDevice(d['bootOrder'][i]),'VBoxGlobal');
								}
								return bo.join(', ');
						   }
					   },{
						   title: vcube.utils.trans("Acceleration",'UIGDetails'),
						   renderer: function(d) {
							   var acList = [];
							   if(d['HWVirtExProperties'].Enabled) acList[acList.length] = vcube.utils.trans('VT-x/AMD-V');
							   if(d['HWVirtExProperties'].NestedPaging) acList[acList.length] = vcube.utils.trans('Nested Paging');
							   if(d['CpuProperties']['PAE']) acList[acList.length] = vcube.utils.trans('PAE/NX');
							   
							   //if($('#vboxPane').data('vboxConfig').enableAdvancedConfig) {
								   if(d['HWVirtExProperties'].LargePages) acList[acList.length] = vcube.utils.trans('Large Pages');
								   if(d['HWVirtExProperties'].Exclusive) acList[acList.length] = vcube.utils.trans('Exclusive use of the hardware virtualization extensions');
								   if(d['HWVirtExProperties'].VPID) acList[acList.length] = vcube.utils.trans('VT-x VPID');
							   //}
							   return acList.join(', ');
						   },
					   	   condition: function(d) { return (d['HWVirtExProperties'].Enabled || d['CpuProperties']['PAE']); }
					   }
					]
				},
				
				/*
				 * Display
				 */
				display : {
					icon: 'vrdp_16px.png',
					title: vcube.utils.trans('Display'),
					settingsLink: 'Display',
					redrawOnEvents: ['VRDEServerInfoChanged','VRDEServerChanged','MachineStateChanged'],
					rows: [
					   {
						   title: vcube.utils.trans("Video Memory"),
						   renderer: function(d) {
							   return vcube.utils.trans('<nobr>%1 MB</nobr>').replace('%1',d['VRAMSize']);
						   }
					   },{
						   title: vcube.utils.trans('Remote Desktop Server Port'),
						   renderer: function(d) {
							   
							   var chost = vcube.utils.vboxGetVRDEHost(d);
							
							   // Get ports
							   var rowStr = d['VRDEServer']['ports'];
							   
							   // Just this for snapshots
							   if(d._isSnapshot) return rowStr;
							   
							   // Display links?
							   if((d['state'] == 'Running' || d['state'] == 'Paused') && d['VRDEServerInfo']) {
								   
								   if(d['VRDEServerInfo']['port'] > 0 && d['VRDEServer']['VRDEExtPack'].indexOf("VNC") == -1) {
									   rowStr = " <a href='rdp.php?host=" + chost + '&port=' + d['VRDEServerInfo']['port'] + "&id=" + d['id'] + "&vm=" + encodeURIComponent(d['name']) + "'>" + d['VRDEServerInfo']['port'] + "</a>";						   
									   rowStr += ' <img src="images/vbox/blank.gif" style="vspace:0px;hspace:0px;height2px;width:10px;" /> (' + chost + ':' + d['VRDEServerInfo']['port'] + ')';
									   
								   } else if (d['VRDEServer']['VRDEExtPack'].indexOf("VNC") == -1) {
									   rowStr = '<span style="text-decoration: line-through; color: #f00;">' + rowStr + '</span>';						   
								   }
							   } else {
								   rowStr += ' ('+chost+')';
							   }
							   return rowStr;
							   
			  
						   },
						   html: true,
						   condition: function(d) {
							   
							   // Running and paused states have real-time console info
							   if(!d._isSnapshot && (d['state'] == 'Running' || d['state'] == 'Paused')) {
								   return d.VRDEServer && (d.VRDEServer.enabled);
							   }
							   return (d['VRDEServer'] && (d._isSnapshot || d['VRDEServer']['VRDEExtPack']) && d['VRDEServer']['enabled'] && d['VRDEServer']['ports']);
						   }
					   },{
						   title: vcube.utils.trans("Remote Desktop Server"),
						   renderer: function(d) {
							   return vcube.utils.trans('Disabled','VBoxGlobal',null,'details report (VRDE Server)');
						   },
						   condition: function(d) {

							   // Running and paused states have real-time console info
							   if(!d._isSnapshot && (d['state'] == 'Running' || d['state'] == 'Paused')) {
								   return d.VRDEServer && (d.VRDEServer.enabled);
							   }
							   return (d['VRDEServer'] && (d._isSnapshot || d['VRDEServer']['VRDEExtPack']) && d['VRDEServer']['enabled'] && d['VRDEServer']['ports']);
						   }
					   }
					]
				},
				
				/*
				 * Storage controllers
				 */
				storage : {
					icon:'hd_16px.png',
					title: vcube.utils.trans('Storage'),
					settingsLink: 'Storage',
					redrawOnEvents: ['MediumChanged','MachineStateChanged'],
					rows: function(d) {
						
						var rows = new Array();
						
						return rows;
						
						for(var a = 0; a < d['storageControllers'].length; a++) {
							
							var con = d['storageControllers'][a];
							
							// Controller name
							rows[rows.length] = {
									title: vcube.utils.trans('Controller: %1','UIMachineSettingsStorage').replace('%1',con.name),
									renderer: function(){return'';}
							};
									
							// Each attachment.
							for(var b = 0; b < d['storageControllers'][a]['mediumAttachments'].length; b++) {
								
								var portName = vcube.utils.vboxStorage[d['storageControllers'][a].bus].slotName(d['storageControllers'][a]['mediumAttachments'][b].port, d['storageControllers'][a]['mediumAttachments'][b].device);

								// Medium / host device info
								var medium = (d['storageControllers'][a]['mediumAttachments'][b].medium && d['storageControllers'][a]['mediumAttachments'][b].medium.id ? vcube.utils.vboxMedia.getMediumById(d['storageControllers'][a]['mediumAttachments'][b].medium.id) : null);
								
								// Do we need to reload media?
								if(d['storageControllers'][a]['mediumAttachments'][b].medium && d['storageControllers'][a]['mediumAttachments'][b].medium.id && medium === null) {
									
									if(!d._isSnapshot) {
										portDesc = '<a href="javascript:vmDetailsSections.storage._refreshVMMedia(\''+
										d.id+"','"+d['storageControllers'][a]['mediumAttachments'][b].medium.id+"');\">"+vcube.utils.trans('Refresh','UIVMLogViewer')+"</a>";							

									} else {
										portDesc = vcube.utils.trans('Refresh','UIVMLogViewer');
									}

								} else {
									
									// Get base medium (snapshot -> virtual disk file)
									var it = false;
									if(medium && medium.base && (medium.base != medium.id)) {
										it = true;
										medium = vcube.utils.vboxMedia.getMediumById(medium.base);
									}

									portDesc = vcube.utils.vboxMedia.mediumPrint(medium,false,it);
								}

								rows[rows.length] = {
									title: portName,
									indented: true,
									data: (d['storageControllers'][a]['mediumAttachments'][b].type == 'DVD' ? vcube.utils.trans('[CD/DVD]','UIGDetails') + ' ' : '') + portDesc,
									html: true
								};
								
							}
							
						}
						return rows;
					}
				},
				
				/*
				 * Audio
				 */
				audio : {
					icon:'sound_16px.png',
					title: vcube.utils.trans('Audio'),
					settingsLink: 'Audio',
					rows: [
					    {
						    title: '<span class="vboxDetailsNone">'+vcube.utils.trans("Disabled",'VBoxGlobal',null,'details report (audio)')+'</span>',
						    html: true,
						    condition: function(d) { return !d['audioAdapter']['enabled']; },
						    data: ''
					    },{
					    	title: vcube.utils.trans("Host Driver",'UIDetailsBlock'),
					    	renderer: function(d) {
					    		return vcube.utils.trans(vcube.utils.vboxAudioDriver(d['audioAdapter']['audioDriver']),'VBoxGlobal');
					    	},
					    	condition: function(d) { return d['audioAdapter']['enabled']; }
					    },{
					    	title: vcube.utils.trans("Controller",'UIDetailsBlock'),
					    	renderer: function (d) {
					    		return vcube.utils.trans(vcube.utils.vboxAudioController(d['audioAdapter']['audioController']),'VBoxGlobal');
					    	},
					    	condition: function(d) { return d['audioAdapter']['enabled']; }
					    }
					]
				},
				
				/*
				 * Network adapters
				 */
				network : {
					icon: 'nw_16px.png',
					title: vcube.utils.trans('Network'),
					redrawOnEvents: ['NetworkAdapterChanged','MachineStateChanged'],
					settingsLink: 'Network',
					rows: function(d) {
						
						var vboxDetailsTableNics = 0;
						var rows = [];
						
						
						for(var i = 0; i < d['networkAdapters'].length; i++) {
							
							nic = d['networkAdapters'][i];
							
							// compose extra info
							var adp = '';

							if(nic.enabled) {
								vboxDetailsTableNics++;
								switch(nic.attachmentType) {
									case 'Null':
										adp = vcube.utils.trans('Not attached','VBoxGlobal');
										break;
									case 'Bridged':
										adp = vcube.utils.trans('Bridged adapter, %1','VBoxGlobal').replace('%1', nic.bridgedInterface);
										break;
									case 'HostOnly':
										adp = vcube.utils.trans('Host-only adapter, \'%1\'','VBoxGlobal').replace('%1', nic.hostOnlyInterface);
										break;
									case 'NAT':
										// 'NATNetwork' ?
										adp = vcube.utils.trans('NAT','VBoxGlobal');
										break;
									case 'Internal':
										adp = vcube.utils.trans('Internal network, \'%1\'','VBoxGlobal').replace('%1', nic.internalNetwork);
										break;
									case 'Generic':
										// Check for properties
										if(nic.properties) {
											adp = vcube.utils.trans('Generic driver, \'%1\' { %2 }','UIDetailsPagePrivate').replace('%1', nic.genericDriver);
											var np = nic.properties.split("\n");
											adp = adp.replace('%2', np.join(" ,"));
											break;
										}
										adp = vcube.utils.trans('Generic driver, \'%1\'','UIDetailsPagePrivate').replace('%1', nic.genericDriver);
										break;					
									case 'VDE':
										adp = vcube.utils.trans('VDE network, \'%1\'','VBoxGlobal').replace('%1', nic.VDENetwork);
										break;
								}

								rows[rows.length] = {
									title: vcube.utils.trans("Adapter %1",'VBoxGlobal').replace('%1',(i + 1)),
									data: vcube.utils.trans(vcube.utils.vboxNetworkAdapterType(nic.adapterType)).replace(/\(.*\)/,'') + ' (' + adp + ')'
								};
							}
									
						}
						
						// No enabled nics
						if(vboxDetailsTableNics == 0) {
							
							rows[rows.length] = {
								title: '<span class="vboxDetailsNone">'+vcube.utils.trans('Disabled','VBoxGlobal',null,'details report (network)')+'</span>',
								html: true
							};
							
						// Link nic to guest networking info?
						} else if(d['state'] == 'Running') {
							
							rows[rows.length] = {
								title: '',
								data: '<a href="javascript:vboxGuestNetworkAdaptersDialogInit(\''+d['id']+'\');">('+vcube.utils.trans('Guest Network Adapters','VBoxGlobal')+')</a>',
								html: true
							};
							
						}
						
						return rows;

					}
				},
				
				/*
				 * Serial Ports
				 */
				serialports : {
					
					icon: 'serial_port_16px.png',
					title: vcube.utils.trans('Serial Ports'),
					settingsLink: 'SerialPorts',
					rows: function(d) {
						
						var rows = [];
						
						var vboxDetailsTableSPorts = 0;
						for(var i = 0; i < d['serialPorts'].length; i++) {
							
							p = d['serialPorts'][i];
							
							if(!p.enabled) continue;
							
							// compose extra info
							var xtra = vcube.utils.vboxSerialPorts.getPortName(p.IRQ,p.IOBase);
							
							var mode = p.hostMode;
							xtra += ', ' + vcube.utils.trans(vcube.utils.vboxSerialMode(mode),'VBoxGlobal');
							if(mode != 'Disconnected') {
								xtra += ' (' + p.path + ')';
							}
							
							rows[rows.length] = {
								title: vcube.utils.trans("Port %1",'VBoxGlobal',null,'details report (serial ports)').replace('%1',(i + 1)),
								data: xtra,
								html: true
							};
							
							vboxDetailsTableSPorts++;
									
						}
						
						if(vboxDetailsTableSPorts == 0) {
							rows = [{
								title: '<span class="vboxDetailsNone">'+vcube.utils.trans('Disabled','VBoxGlobal',null,'details report (serial ports)')+'</span>',
								data: '',
								html: true
							}];
						}
						
						return rows;
					
					}
				},
				
				/*
				 * Parallel ports
				 */
				parallelports: {
					icon: 'parallel_port_16px.png',
					title: vcube.utils.trans('Parallel Ports','UIDetailsPagePrivate'),
					settingsLink: 'ParallelPorts',
					condition: function() { return false; },
					rows: function(d) {
						
						var rows = [];
						
						var vboxDetailsTableSPorts = 0;
						for(var i = 0; i < d['parallelPorts'].length; i++) {
							
							p = d['parallelPorts'][i];
							
							if(!p.enabled) continue;
							
							// compose extra info
							var xtra = vcube.utils.trans(vcube.utils.vboxParallelPorts.getPortName(p.IRQ,p.IOBase));
							xtra += ' (' + p.path + ')';
							
							rows[rows.length] = {
								title: vcube.utils.trans("Port %1",'VBoxGlobal',null,'details report (parallel ports)').replace('%1',(i + 1)),
								data: xtra
							};
							vboxDetailsTableSPorts++;
									
						}
						
						if(vboxDetailsTableSPorts == 0) {
							rows[0] = {
								title: '<span class="vboxDetailsNone">'+vcube.utils.trans('Disabled','VBoxGlobal',null,'details report (parallel ports)')+'</span>',
								html: true
							};
						}
						return rows;
						
					}
				},
				
				/*
				 * USB
				 */
				usb : {
					icon: 'usb_16px.png',
					title: vcube.utils.trans('USB'),
					settingsLink: 'USB',
					rows: function(d) {
						
						var rows = [];
						
						if(d['USBController'] && d['USBController']['enabled']) {
							var tot = 0;
							var act = 0;
							for(var i = 0; i < d['USBController'].deviceFilters.length; i++) {
								tot++;
								if(d['USBController'].deviceFilters[i].active) act++;
							}
							
							rows[0] = {
								title: vcube.utils.trans("Device Filters"),
								data: vcube.utils.trans('%1 (%2 active)').replace('%1',tot).replace('%2',act)
							};
							
						} else {
							
							rows[0] = {
								title: '<span class="vboxDetailsNone">'+vcube.utils.trans("Disabled",null,null,'details report (USB)')+'</span>',
								html: true
							};
						}
						
						return rows;

					}
				},
				
				/*
				 * Shared folders list
				 */
				sharedfolders : {
					icon: 'shared_folder_16px.png',
					title: vcube.utils.trans('Shared Folders', 'UIDetailsPagePrivate'),
					settingsLink: 'SharedFolders',
					rows: function(d) {

						if(!d['sharedFolders'] || d['sharedFolders'].length < 1) {
							return [{
								title: '<span class="vboxDetailsNone">'+vcube.utils.trans('None',null,null,'details report (shared folders)')+'</span>',
								html: true
							}];
						}
						
						return [{
								title: vcube.utils.trans('Shared Folders', 'UIDetailsPagePrivate'),
								data: d['sharedFolders'].length
							}];
					}
				}
			}

	}
});
	
