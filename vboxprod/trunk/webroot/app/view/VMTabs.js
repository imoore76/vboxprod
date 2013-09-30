/**
 * Virtual Machine tabs
 * 
 */

Ext.define('vcube.view.VMTabs', {
    
	extend: 'Ext.tab.Panel',
    
	alias: 'widget.VMTabs',
	
	
	statics: {
	
		/*
		 * List of actions that can be performed on this vm
		 */
		vmactions : ['start','powerdown','pause','savestate','clone','settings'],
		
		/*
		 * Creates and returns a section table
		 */
		sectionTable: function(sectionCfg, data) {
		
			return Ext.create('Ext.panel.Panel', Ext.apply({
			    title: sectionCfg.title,
			    icon: 'images/vbox/' + sectionCfg.icon,
			    cls: 'vboxDetailsTablePanel',
			    layout: {
			    	type: 'table',
			    	columns: 2
			    },
			    defaults: {
			    	bodyCls: 'vboxDetailsTable'
			    },
			    items: vcube.view.VMTabs.sectionTableRows(sectionCfg.rows, data)
			}, (sectionCfg.tableCfg ? sectionCfg.tableCfg : {})));

		},
		
		/*
		 * Return section table items
		 */
		sectionTableRows: function(rows, data) {
			
			// Is rows a function?
			if(typeof(rows) == 'function') rows = rows(data);
			
			var tableItems = [];
			for(var i = 0; i < rows.length; i++) {
				
				// Check if row has condition
				if(rows[i].condition && !rows[i].condition(data)) continue;
				
				// hold row data
				var rowData = '';
				
				// Check for row attribute
				if(rows[i].attrib) {
					
					if(!data[rows[i].attrib]) continue;
					rowData = data[rows[i].attrib];
				
				// Check for row renderer
				} else if(rows[i].renderer) {
					rowData = rows[i].renderer(data);

				// Static data
				} else {
					rowData = rows[i].data;
				}

				
				if(rows[i].title && !rowData) {
					tableItems.push({'html':rows[i].title, 'cls': 'vboxDetailsTableData', colspan: 2 , 'width': '100%'});
				} else {
					
					tableItems.push({'html':rows[i].title + ':', 'cls': 'vboxDetailsTableHeader'});
					tableItems.push({'html':rowData, 'cls': 'vboxDetailsTableData' + (rows[i].indented ? ' vboxDetailsIndented' : ''), 'width': '100%'});
				}
				
				
			}
			return tableItems;

		},

		/*
		 * 
		 * Tables for summary tab
		 * 
		 */
		vmSummarySections : {
			
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
					title: 'State',
					renderer: function(vm) {
						return '<img src="images/vbox/'+vcube.utils.vboxMachineStateIcon(vm.state) +'" height=16 width=16 valign=top />&nbsp;' + vcube.utils.vboxVMStates.convert(vm.state);
					}
				},{
					title: 'Since',
					renderer: function(vm) {
						return vcube.utils.dateTimeString(vm.lastStateChange)
					}
				},{
					title: 'Session',
					attrib: 'sessionState'
				},{
					/* Such a hack... */
					title: 'OS Type',
					renderer: function(vm) {
						return '<img src="images/vbox/' + vcube.utils.vboxGuestOSTypeIcon(vm.OSTypeId) +'" height=16 width=16 valign=top />&nbsp;' + vm.OSTypeDesc;
					}
				},{
					title: 'Current Snapshot',
					renderer: function(vm) {
						return (vm.currentSnapshotName ? vm.currentSnapshotName : '<span style="font-style: italic">none</span>');
					}
				}]
				
			},
			
			resources: {
				
				tableCfg: {
					title: vcube.utils.trans('Resources'),
					itemId: 'resourcesTable',
					icon: 'images/vbox/chipset_16px.png',
					border: true,
					width: 200,
					bodyStyle: { background: '#fff' },
					style: { margin: '0 20px 20px 0', display: 'inline-block', float: 'left' }
				},
				
				rows: [{
					title: 'CPU(s)',
					attrib: 'CPUCount'
				},{
					title: 'Execution Cap',
					condition : function(vm) {
						return parseInt(vm.CPUExecutionCap) != 100;
					},
					renderer: function(vm) {
						return vm.CPUExecutionCap + '%';
					}
				},{
					title: 'Memory',
					renderer: function(vm) {
						return vm.memorySize + ' MB';
					}
				}]        			        					

			}
			
		},
		
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
					redrawMachineEvents: ['OnCPUExecutionCapChanged'],
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
					redrawMachineEvents: ['OnVRDEServerInfoChanged','OnVRDEServerChanged','OnMachineStateChanged'],
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
					redrawMachineEvents: ['OnMediumChanged','OnMachineStateChanged'],
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
					redrawMachineEvents: ['OnNetworkAdapterChanged','OnMachineStateChanged'],
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

	},
	
    defaults: {
    	border: false,
    	padding: 5
    },
    
    items: [{
    	
    	/* Summary tab */
        title: 'Summary',
        itemId: 'SummaryTab',
        icon: 'images/vbox/machine_16px.png',
        cls: 'vmTabSummary',
		bodyStyle: 'background: url(images/vbox/vmw_first_run_bg.png) 700px 40px no-repeat',
        autoScroll: true,
        defaults: {
        	bodyStyle: { background: 'transparent' }
		},
        items: [{
        	// Summary container
        	xtype: 'panel',
        	itemId: 'SummaryTabItems',
        	flex: 1,
        	border: false,
        	layout: {
        		type: 'vbox',
        		pack: 'start'
        	},
        	defaults: { margin: 5, bodyStyle: { background: 'transparent' } },
        	items : [{
        		xtype: 'panel',
        		layout: 'hbox',
        		width: '100%',
        		border: false,
    			bodyStyle: { background: 'transparent' },
    			defaults: { bodyStyle: { background: 'transparent' } },
        		items: [{
        			title: 'Preview',
        			icon: 'images/vbox/vrdp_16px.png',
        			itemId: 'PreviewPanel',
        			autoWidth: true,
        			autoHeight: true,
        			bodyStyle: {
        			    background: '#fff'
        			},
        			html: '<div id="vboxPreviewBox" />',
        			border: true
        		},{
    				width: 20,
    				html: ' ',
    				border: false
    			},{
        			xtype: 'panel',
        			layout: {
        				type: 'vbox',
        				align: 'stretch'
        			},
        			flex: 1,
        			border: false,
        			bodyStyle: { background: 'transparent' },
        			defaults: { border: false, bodyStyle: { background: 'transparent' } },
        			items: [{
        				itemId: 'baseinfo',
        				flex: 1,
        				xtype: 'panel',
        				width: '100%',
        				tpl: new Ext.XTemplate('<table style="border:0px;border-spacing:0px;width:100%;">'+
        						'<tr valign="top">'+
        						'<td width=100%><h3 align="left" style="margin-left: 10px">{name}</h3><div>{description}</div></td>'+
        						'<td style="border: 0px solid #000; width: 120px;"><div align="center">'+
        						'<img src="{[(values.customIcon ? values.customIcon : "images/vbox/blank.gif")]}" style="width:64px;height:64px;display:block;margin-bottom:10px;"/>'+
        						'</td>'+
        				'</tr></table>')        			
        			},{
        				height: 20,
        				html: '',
        				border: false
        			},{
        				xtype: 'panel',
        				itemId: 'summaryTables'    				
        			}]
        		},{
    				width: 20,
    				html: ' ',
    				border: false
        		},{
        			title: 'Actions',
        			layout: 'vbox',
        			itemId: 'vmactions',
        			bodyStyle: { background: '#fff' },
        			border: true,
        			width: 200,
        			listeners: {
        				
        				beforerender: function(vmactions) {
        					
        					defaults = { border: false, xtype: 'button', width: '100%', margin: 4, textAlign: 'left', iconAlign: 'left' };

        					Ext.each(vcube.view.VMTabs.vmactions, function(action, i) {
        						
        						vmactions.add(Ext.create('Ext.Button',Ext.apply({},{
        							
        							itemId : action,
        							
        							text: vcube.vmactions[action].label.replace('...',''),
        							
        							icon: 'images/vbox/' + (vcube.vmactions[action].icon_16 ? vcube.vmactions[action].icon_16 : vcube.vmactions[action].icon) + '_16px.png',
									
    								listeners: {
										click: vcube.vmactions[action].click
									}
        						
        						}, defaults)));

        					});
 
        				}
        			}
        		}]
        	}]
        }]
    
    },{
    	
    	/* Details */
        title: 'Details',
        itemId: 'DetailsTab',
        cls: 'vmTabDetails',
        icon: 'images/vbox/settings_16px.png',
        autoScroll: true,
        layout: 'vbox',
        width: '100%',
        defaults: { xtype: 'panel', width: '100%', margin: '10 0 0 0', defaults: { xtype: 'displayfield' } },
        items: []
        
    }, {
    	
    	/* Snapshots */
    	title: 'Snapshots',
    	icon: 'images/vbox/take_snapshot_16px.png',
    	layout: 'fit',
    	listeners: {
    		show: function(p) {
    			p.getComponent('snapshottree').doLayout().getStore().getRootNode().expand();
    			
    		}
    	},
    	items: [{
    		xtype: 'treepanel',
    		itemId: 'snapshottree',
    		tbar: [
    		   {xtype:'button',tooltip:vcube.utils.trans('Take Snapshot...','UIActionPool').replace('...',''),icon:'images/vbox/take_snapshot_16px.png'},
    		   '-',
    		   {xtype:'button',tooltip:vcube.utils.trans('Restore Snapshot','VBoxSnapshotsWgt'),icon:'images/vbox/discard_cur_state_16px.png'},
    		   {xtype:'button',tooltip:vcube.utils.trans('Delete Snapshot','VBoxSnapshotsWgt'),icon:'images/vbox/delete_snapshot_16px.png'},
    		   '-',
    		   {xtype:'button',tooltip:vcube.utils.trans('Clone...','UIActionPool').replace('...',''),icon:'images/vbox/vm_clone_16px.png'},
    		   '-',
    		   {xtype:'button',tooltip:vcube.utils.trans('Show Details','VBoxSnapshotsWgt'),icon:'images/vbox/show_snapshot_details_16px.png'}
    		],
    	    viewConfig:{
    	        markDirty:false
    	    },
    	    rootVisible: false,
    	    lines: true,
    	    store: new Ext.data.TreeStore({
    	        
    	    	model: 'vcube.model.Snapshot',
    	        autoLoad: false,
    	        
    	        listeners: {
    	        	
    	        	
    	        	append: function(thisNode,newNode,index,eOpts) {
    	        		newNode.set('text',newNode.raw.name + ' <span class="vboxSnapshotTimestamp"> </span>');
    	        		newNode.set('icon', 'images/vbox/' + (newNode.raw.online ? 'online' : 'offline') + '_snapshot_16px.png');
    	        		newNode.set('expanded',(newNode.raw.children && newNode.raw.children.length));
    	        	},
    	        	
    	        	// Append current state
    	        	load: function(s, node, records, success) {
    	        		var cState = {
    	        			id: 'current',
    	        			text: 'Current State',
    	        			name: 'Current State',
    	        			leaf: true
    	        		};
    	        		var rData = s.getProxy().getReader().responseData;
    	        		var pNode = null;
    	        		if(rData.currentSnapshotId) {
    	        			pNode = s.getNodeById(rData.currentSnapshotId);
    	        		} else {
    	        			pNode = s.getRootNode();
    	        		}
    	        		
    	        		pNode.appendChild(pNode.createNode(cState));
    	        		pNode.expand();
    	        	}
    	        },
    	        
    	        proxy: {
    	            type: 'ajax',
    	            url: 'data/operasnapshots.json',
    	            reader: {
    	                type: 'AppJsonReader',
	                	initialRoot: 'snapshot',
	                	asChildren: true
    	            }
    	        }

    	    })

    	}]
    		
    },{
    	/* Console */
    	title: 'Console',
    	icon: 'images/vbox/vrdp_16px.png'
    }]

});