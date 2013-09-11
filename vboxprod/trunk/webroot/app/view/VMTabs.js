/**
 * Virtual Machine tabs
 * 
 */

Ext.define('vboxprod.view.VMTabs', {
    extend: 'Ext.tab.Panel',
    alias: 'widget.VMTabs',
    defaults: {
    	border: false,
    	padding: 5
    },
    rawData : {},
    items: [{
    	
    	/* Summary tab */
        title: 'Summary',
        itemId: 'SummaryTab',
        icon: 'images/vbox/machine_16px.png',
		bodyStyle: 'background: url(images/vbox/vmw_first_run_bg.png) 700px 40px no-repeat',
		xtype: 'form',
        autoScroll: true,
        defaults: {
        	bodyStyle: { background: 'transparent' }
		},
        items: [{
        	// Summary container
        	xtype: 'panel',
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
        			html: '<canvas id="vboxPreviewBox" />',
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
        						'<img src="images/vbox/{[vboxGuestOSTypeIcon(values.OSTypeId)]}" style="width:64px;height:64px;display:block;margin-bottom:10px;"/>'+
        						'</td>'+
        				'</tr></table>')        			
        			},{
        				height: 20,
        				html: '',
        				border: false
        			},{
        				xtype: 'panel',
        				defaults: {
        					style:{
        						display:'inline-block',
        						float: 'left'
        					}
        		        },
        				items: [{
        					xtype: 'panel',
        					title: 'Info',
        					icon: 'images/vbox/name_16px.png',
        					border: true,
        					width: 300,
        					defaults: { xtype: 'displayfield'},
        					bodyStyle: { background: '#fff' },
        					style: { margin: '0 20px 20px 0', display: 'inline-block', float: 'left' },
        					items: [{
        						fieldLabel: 'State',
        						itemId: 'state',
        						name: 'state',
        						renderer: function(newValue) {
    								return '<img src="images/vbox/'+vboxMachineStateIcon(newValue)+'" height=16 width=16 valign=top/>&nbsp;'+newValue;
        						}
        					},{
        						fieldLabel: 'OS Type',
        						name: 'OSTypeDesc'
        					},{
        						fieldLabel: 'Current Snapshot',
        						name: 'currentSnapshot',
        						renderer: function(s) {
        							return (s ? s : '<span style="font-style: italic">none</span>');
        						}
        					}]
        				},{
        					xtype: 'panel',
        					title: 'Resources',
        					icon: 'images/vbox/chipset_16px.png',
        					style: { margin: '0 20px 20px 0', display: 'inline-block', float: 'left' },
        					border: true,
        					width: 300,
        					defaults: { xtype: 'displayfield'},
        					bodyStyle: { background: '#fff' },
        					items: [{
        						fieldLabel: 'CPU(s)',
        						name: 'CPUCount'
        					},{
        						fieldLabel: 'Execution Cap',
        						name: 'CPUExecutionCap',
        						listeners: {
        							change: function(f,v) {
        								if(!v || parseInt(v) == 100) f.hide();
        								else f.show();
        							}
        						},
        						renderer: function(c) {
        							return c + '%';
        						}
        					},{
        						fieldLabel: 'Memory',
        						name: 'memorySize',
        						renderer: function(m) {
        							return m + ' MB';
        						}
        					}]        			        					
        				}]
        				
        			}]
        		},{
    				width: 20,
    				html: ' ',
    				border: false
        		},{
        			title: 'Actions',
        			layout: 'vbox',
        			bodyStyle: { background: '#fff' },
        			border: true,
        			width: 300,
        			defaults: { border: false, xtype: 'button', width: '100%', margin: 4, textAlign: 'left', iconAlign: 'left' },
        			items: [{
        				text: 'Start',
        				icon: 'images/vbox/start_16px.png',
        				disabled: true
        			},{
        				text: 'Power Off',
        				icon: 'images/vbox/poweroff_16px.png'
        			},{
        				text: 'Pause',
        				icon: 'images/vbox/pause_16px.png',
        				disabled: true
        			},{
        				text: 'Save State',
        				icon: 'images/vbox/save_state_16px.png'
        			},{
        				text: 'Take Snapshot',
        				icon: 'images/vbox/take_snapshot_16px.png'
        			},{
        				text: 'Clone',
        				icon: 'images/vbox/vm_clone_16px.png'
        			},{
        				text: 'Resume',
        				icon: 'images/vbox/start_16px.png'
        			},{
        				text: 'Settings',
        				icon: 'images/vbox/settings_16px.png'
        			},{
        				text: 'Export',
        				icon: 'images/vbox/export_16px.png'
        			}]
        		}]
        	}]
        }]
    
    },{
    	
    	/* Details */
        title: 'Details',
        itemId: 'DetailsTab',
        icon: 'images/vbox/settings_16px.png',
        xtype: 'form',
        autoScroll: true,
        layout: 'vbox',
        width: '100%',
        defaults: { xtype: 'panel', width: '100%', margin: '10 0 0 0', defaults: { xtype: 'displayfield' } },
        items: [{
    		icon:'images/vbox/machine_16px.png',
    		title:'General',
    		margin: '0 0 0 0 ',
    		tpl: '<table class="vboxDetailsTable"><tbody>'+
    			'<tr><th>{[trans("Name","VBoxGlobal")]}:</th><td>{[values.name]}</td></tr>'+
    			'<tr><th>{[trans("OS Type","VBoxGlobal")]}:</th><td>{[values.OSTypeDesc]}</td></tr>'+
    			'</tbody></table>'
        },{
        	icon:'images/vbox/chipset_16px.png',
    		title: 'System',
    		tpl: ['<table class="vboxDetailsTable"><tbody>'+
    		
    			// Memory
				'<tr><th>{[trans("Base Memory","VBoxGlobal")]}:</th><td>{[trans("<nobr>%1 MB</nobr>").replace("%1",values.memorySize)]}</td></tr>'+
				
				// Processors
				'<tr><th>{[trans("Processor(s)","VBoxGlobal")]}:</th><td>{[values.CPUCount]}</td></tr>'+
				
				// Execution cap
				'<tpl if="values.CPUExecutionCap &lt; 100">'+
					'<tr><th>{[trans("Execution Cap","VBoxGlobal")]}:</th><td>{[trans("<nobr>%1%</nobr>").replace("%1",parseInt(values.CPUExecutionCap))]}</td></tr>'+
				'</tpl>'+
				
				// Boot order
				'<tr><th>{[trans("Boot Order","VBoxGlobal")]}:</th><td>'+
				'{[this.bootOrder(values.bootOrder)]}'+
				'</td></tr>'+
				
				// Acceleration
				'<tpl if="this.hasAcceleration(values)">' +
					'<tr><th>{[trans("Acceleration","UIGDetails")]}:</th><td>'+
						'{[this.acceleration(values)]}' +
					'</td></tr>'+
				'</tpl>'+
				
				'</tbody></table>',{
    			 	
    				disableFormats: true,
    			 	
    				bootOrder : function(bootOrder) {
    					for(var i = i; i < bootOrder.length; i++) {
    						bootOrder[i] = trans(vboxDevice(bootOrder[i]),'VBoxGlobal');
    					}
    					return bootOrder.join(', ');
    				},
    				
    				
    				hasAcceleration: function(d) {
    					return (d['HWVirtExProperties'].Enabled || d['HWVirtExProperties'].NestedPaging || d['CpuProperties']['PAE']);
    				},
    				
    				acceleration: function(d) {
					   var acList = [];
					   if(d['HWVirtExProperties'].Enabled) acList[acList.length] = trans('VT-x/AMD-V');
					   if(d['HWVirtExProperties'].NestedPaging) acList[acList.length] = trans('Nested Paging');
					   if(d['CpuProperties']['PAE']) acList[acList.length] = trans('PAE/NX');
					   /*
					   if($('#vboxPane').data('vboxConfig').enableAdvancedConfig) {
						   if(d['HWVirtExProperties'].LargePages) acList[acList.length] = trans('Large Pages');
						   if(d['HWVirtExProperties'].Exclusive) acList[acList.length] = trans('Exclusive use of the hardware virtualization extensions');
						   if(d['HWVirtExProperties'].VPID) acList[acList.length] = trans('VT-x VPID');
					   }
					   */
					   return acList.join(', ');
    				}
    			
    			}]

        },{
    		icon: 'images/vbox/vrdp_16px.png',
    		title: trans('Display'),
    		tpl: ['<table class="vboxDetailsTable"><tbody>'+
    		      
    		      // Video Memory
    		      '<tr><th>{[trans("Video Memory")]}:</th><td>' +
    		      '{[trans("<nobr>%1 MB</nobr>").replace("%1",values.VRAMSize)]}'+
    		      '</td></tr>'+
    		      
    		      // VRDE port
    		      '<tpl if="this.vrdeEnabled(values)">'+
	    		      '<tr><th>{[trans("Remote Desktop Server Port")]}:</th><td>' +
	    		      '{[this.vrdePorts(values)]}'+
	    		      '</td></tr>'+
	    		  '</tpl>'+
	    		  
	    		  // Disabled VRDE
	    		  '<tpl if="!this.vrdeEnabled(values)">' +
	    		      '<tr><th>{[trans("Remote Desktop Server")]}:</th><td>' +
	    		      "{[trans('Disabled','VBoxGlobal',null,'details report (VRDE Server)')]}"+
	    		      '</td></tr>'+
    		      '</tpl>'+
	    		  
    		      
	    		  '</tbody></table>',{
    			
    				disableFormats: true,
    				
    				vrdeEnabled: function(d) {
    					
					   // Running and paused states have real-time console info
					   if(!d._isSnapshot && (d['state'] == 'Running' || d['state'] == 'Paused')) {
						   return d.VRDEServer && (d.VRDEServer.enabled);
					   }
					   return (d['VRDEServer'] && (d._isSnapshot || d['VRDEServer']['VRDEExtPack']) && d['VRDEServer']['enabled'] && d['VRDEServer']['ports']);
    				},
    				
    				vrdePorts: function(d) {
    					
					   var chost = '127.0.0.1'; //vboxGetVRDEHost(d);
						
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

    				}
    		}],
    		
        },{
        	
        	title: trans('Storage'),
			icon:'images/vbox/hd_16px.png',
			tpl: ['<table class="vboxDetailsTable"><tbody>'+
			      '<tpl for="storageControllers">'+
			      	'<tr><td>{[trans("Controller: %1","UIMachineSettingsStorage").replace("%1",values.name)]}</td><td></td></tr>'+
			      	'<tpl for="mediumAttachments">'+
			      		'<tr><td class="indented">{[this.mediumAttachmentPort(values, parent)]}:</td><td>'+
			      			'{[this.mediumAttachmentMedium(values, parent)]}</td></tr>'+
			      	'</tpl>'+
			      '</tpl>'+
			      '</tbody></table>',{
				
				disableFormats: true,
				
				mediumAttachmentPort: function(ma, con) {
					return vboxStorage[con.bus].slotName(ma.port, ma.device);
				},
				
				mediumAttachmentMedium: function(ma, con) {
					
					// Medium / host device info
					var medium = null;//(ma.medium && ma.medium.id ? vboxMedia.getMediumById(ma.medium.id) : null);
					
					// Do we need to reload media?
					if(ma.medium && ma.medium.id && medium === null) {
						
						portDesc = trans('Refresh','UIVMLogViewer');

					} else {
						
						// Get base medium (snapshot -> virtual disk file)
						/*
						var it = false;
						if(medium && medium.base && (medium.base != medium.id)) {
							it = true;
							medium = vboxMedia.getMediumById(medium.base);
						}

						portDesc = vboxMedia.mediumPrint(medium,false,it);
						*/
					}
					portDesc = trans('Refresh','UIVMLogViewer');

					return (ma.type == 'DVD' ? trans('[CD/DVD]','UIGDetails') + ' ' : '') + portDesc;

				}
			}]
        },{
        	/*
        	 * Audio
        	 */
    		icon:'images/vbox/sound_16px.png',
    		title:trans('Audio'),
    		settingsLink: 'Audio',
    		tpl : ['<table><tbody>' +
    		       
    		       '<tpl if="values.audioAdapter.enabled != 1">'+
    		          '<tr><td><span class="vboxDetailsNone">'+
    		          		'{[trans("Disabled","VBoxGlobal",null,"details report (audio)")]}'+
    		          	'</span></td></tr>'+
    		       '</tpl>'+
    		       
    		       '<tpl if="values.audioAdapter.enabled == 1">'+
    		       
    		       		// Host driver
    		       		'<tr><th>{[trans("Host Driver","UIDetailsBlock")]}:</th>'+
    		       		'<td>{[trans(vboxAudioDriver(values.audioDriver,"VBoxGlobal"))]}</td></tr>'+

    		       		// Controller
    		       		'<tr><th>{[trans("Controller","UIDetailsBlock")]}:</th>'+
    		       		'<td>{[trans(vboxAudioController(values.audioAdapter.audioController,"VBoxGlobal"))]}</td></tr>'+

    		       		
    		       '</tpl>'+
    		       
    		       '</tbody></table>',{
    				disableFormats: true,
    				audioEnabled: function(ad) {
    					return (ad.enabled ? true : false);
    				}
    		}]
        },{
        	/*
        	 * Network adapters
        	 */
        	title: trans('Network'),
        	icon: 'images/vbox/nw_16px.png',
        	tpl: ['<table><tbody>'+
        	      
        	      // No nics enabled ? 
        	      '<tpl if="this.enabledNics(values.networkAdapters) == false">'+
        	      		'<tr><td><span class="vboxDetailsNone">{[trans("Disabled","VBoxGlobal",null,"details report (network)")]}</span></td></tr>'+
        	      '</tpl>'+
        	      
        	      // Nics enabled
        	      '<tpl if="this.enabledNics(values.networkAdapters) == true">'+
        	      
        	      		// Each adapter
	        	      '<tpl for="networkAdapters">'+
	        	      		'<tpl if="values.enabled">'+
		        	      		'<tr><th>{[trans("Adapter %1","VBoxGlobal").replace("%1", xindex)]}:</th><td>'+
		        	      		'{[this.adapterDesc(values)]}'+
		        	      		'</td></tr>'+
		        	      	'</tpl>'+
	        	      '</tpl>'+
	        	      
	        	      // Guest adapters info
	        	      '<tpl if="values.state == &quot;running&quot;">'+
	        	      		'<tr><th></th><td>'+
	        	      		'<a href="javascript:vboxGuestNetworkAdaptersDialogInit(\'{values.id}\');">({[trans("Guest Network Adapters","VBoxGlobal")]})</a>'+
	        	      		'</td></tr>'+
	        	      '</tpl>'+
	        	      
	        	  '</tpl>'+
        	      '</tbody></table>',{
        		
        		disableFormats: true,
        		
        		enabledNics: function(nics) {
        			for(var i = 0; i < nics.length; i++) {
        				if(nics[i].enabled) return true;
        			}
        			return false;
        		},
        		
        		adapterDesc: function(nic) {
        			
    				// compose extra info
    				var adp = '';

    				switch(nic.attachmentType) {
						case 'Null':
							adp = trans('Not attached','VBoxGlobal');
							break;
						case 'Bridged':
							adp = trans('Bridged adapter, %1','VBoxGlobal').replace('%1', nic.bridgedInterface);
							break;
						case 'HostOnly':
							adp = trans('Host-only adapter, \'%1\'','VBoxGlobal').replace('%1', nic.hostOnlyInterface);
							break;
						case 'NAT':
							// 'NATNetwork' ?
							adp = trans('NAT','VBoxGlobal');
							break;
						case 'Internal':
							adp = trans('Internal network, \'%1\'','VBoxGlobal').replace('%1', nic.internalNetwork);
							break;
						case 'Generic':
							// Check for properties
							if(nic.properties) {
								adp = trans('Generic driver, \'%1\' { %2 }','UIDetailsPagePrivate').replace('%1', nic.genericDriver);
								var np = nic.properties.split("\n");
								adp = adp.replace('%2', np.join(" ,"));
								break;
							}
							adp = trans('Generic driver, \'%1\'','UIDetailsPagePrivate').replace('%1', nic.genericDriver);
							break;					
						case 'VDE':
							adp = trans('VDE network, \'%1\'','VBoxGlobal').replace('%1', nic.VDENetwork);
							break;
					}
					
					return trans(vboxNetworkAdapterType(nic.adapterType)).replace(/\(.*\)/,'') + ' (' + adp + ')';

    			}
        	}]
        },{
        	title: trans('Serial Ports'),
        	icon: 'images/vbox/serial_port_16px.png',
        	tpl: ['<table><tbody>'+
        	      
        	      // No serial ports enabled
        	      '<tpl if="this.enabledPorts(values.serialPorts) == false">'+
        	      		'<tr><td><span class="vboxDetailsNone">'+
        	      			"{[trans('Disabled','VBoxGlobal',null,'details report (serial ports)')]}"+
        	      		'</span></td></tr>'+
        	      '</tpl>'+
        	      
        	      // Serial ports enabled
        	      '<tpl if="this.enabledPorts(values.serialPorts) == true">'+
        	      		'<tpl for="values.serialPorts">'+
        	      			'<tpl if="values.enabled">'+
	        	      			'<tr><th>{[trans("Port %1","VBoxGlobal",null,"details report (serial ports)").replace("%1",xindex)]}:</th><td>'+
	        	      				'{[this.portDesc(values)]}'+
	        	      			'</td></tr>'+
	        	      		'</tpl>'+
        	      		'</tpl>'+
        	      '</tpl>'+
        	      
        	      '</tbody></table>',{
        		disableFormats: true,
        		
        		enabledPorts: function(ports) {
        			for(var i = 0; i < ports.length; i++) {
        				if(ports[i].enabled) return true;
        			}
        			return false;
        		},
        		
        		portDesc: function(p) {

        			// compose extra info
    				var xtra = vboxSerialPorts.getPortName(p.IRQ,p.IOBase);
    				
    				var mode = p.hostMode;
    				xtra += ', ' + trans(vboxSerialMode(mode),'VBoxGlobal');
    				if(mode != 'Disconnected') {
    					xtra += ' (' + $('<div />').text(p.path).html() + ')';
    				}
    				
    				return xtra;
    				
        		}

        	}]
        },{
        	title: trans('Parallel Ports','UIDetailsPagePrivate'),
        	icon: 'images/vbox/parallel_port_16px.png',
        	tpl: ['<table><tbody>'+
        	      
        	      // No ports enabled
        	      '<tpl if="this.enabledPorts(values.serialPorts) == false">'+
        	      		'<tr><td><span class="vboxDetailsNone">'+
        	      			"{[trans('Disabled','VBoxGlobal',null,'details report (parallel ports)')]}"+
        	      		'</span></td></tr>'+
        	      '</tpl>'+
        	      
        	      // ports enabled
        	      '<tpl if="this.enabledPorts(values.parallelPorts) == true">'+
        	      		'<tpl for="values.parallelPorts">'+
        	      			'<tpl if="values.enabled">'+
	        	      			'<tr><th>{[trans("Port %1","VBoxGlobal",null,"details report (parallel ports)").replace("%1",xindex)]}:</th><td>'+
	        	      				'{[trans(vboxParallelPorts.getPortName(values.IRQ,values.IOBase))]} {{values.path}}'+
	        	      			'</td></tr>'+
	        	      		'</tpl>'+
        	      		'</tpl>'+
        	      '</tpl>'+
        	      
        	      '</tbody></table>',{
        		
        		disableFormats: true,
        		
        		enabledPorts: function(ports) {
        			for(var i = 0; i < ports.length; i++) {
        				if(ports[i].enabled) return true;
        			}
        			return false;
        		}
        	}]
        },{
        	
        	title: trans('USB'),
        	icon: 'images/vbox/usb_16px.png',
        	tpl: ['<table><tbody>'+
        	      '{[this.usbRow(values)]}'+
        	      '</tbody></table>',{
        		
        		disableFormats: true,
        		
        		usbRow: function(d) {
        			
        			if(d['USBController'] && d['USBController']['enabled']) {

        				var tot = 0;
        				var act = 0;
        				for(var i = 0; i < d['USBController'].deviceFilters.length; i++) {
        					tot++;
        					if(d['USBController'].deviceFilters[i].active) act++;
        				}
        				
        				return '<tr><th>'+ trans("Device Filters") + ':</th><td>'+
        					trans('%1 (%2 active)').replace('%1',tot).replace('%2',act) + '</td></tr>';
        				
        			} else {
        				
        				return '<span class="vboxDetailsNone">'+trans("Disabled",null,null,'details report (USB)')+'</span>';
        			}
        			

        			
        		}
        	}]
        },{
        	title: trans('Shared Folders', 'UIDetailsPagePrivate'),
        	icon: 'images/vbox/shared_folder_16px.png',
        	tpl: ['<table><tbody><tr>' +
        	      '<tpl if="values.sharedFolders.length &gt; 0">'+
        	      		'<th>{[trans("Shared Folders", "UIDetailsPagePrivate")]}</th>'+
        	      		'<td>{[values.sharedFolders.length]}</td>'+
        	      '</tpl>'+
        	      '<tpl if="values.sharedFolders.length == 0">'+
        	      		'<td><span class="vboxDetailsNone">{[trans("None",null,null,"details report (shared folders)")]}</span></td>'+
        	      '</tpl>'+
        	      
        	      '</tr></tbody></table>',{
        		disableFormats: true
        	}]
        },{
        	
        	title: trans('Description','UIDetailsPagePrivate'),
        	icon: 'images/vbox/description_16px.png',
        	tpl: ['<table><tbody><tr><td>'+
        	      '<tpl if="values.description">{values.description}</tpl>'+

        	      '<tpl if="values.description.length == 0">'+
        	      		'<span class="vboxDetailsNone">{[trans("None",null,null,"details report (description)")]}</span>'+
        	      '</tpl>'+
        	      '</td></tr></tbody></table>',{
        		disableFormats: true
        	}]
        }]
    }, {
    	
    	/* Snapshots */
    	title: 'Snapshots',
    	icon: 'images/vbox/take_snapshot_16px.png',
    	layout: 'fit',
    	listeners: {
    		show: function(p) {
    			//console.log('show here...');
    			p.getComponent('snapshottree').doLayout().getStore().getRootNode().expand();
    			
    		}
    	},
    	items: [{
    		xtype: 'treepanel',
    		itemId: 'snapshottree',
    		tbar: [
    		   {xtype:'button',tooltip:trans('Take Snapshot...','UIActionPool').replace('...',''),icon:'images/vbox/take_snapshot_16px.png'},
    		   '-',
    		   {xtype:'button',tooltip:trans('Restore Snapshot','VBoxSnapshotsWgt'),icon:'images/vbox/discard_cur_state_16px.png'},
    		   {xtype:'button',tooltip:trans('Delete Snapshot','VBoxSnapshotsWgt'),icon:'images/vbox/delete_snapshot_16px.png'},
    		   '-',
    		   {xtype:'button',tooltip:trans('Clone...','UIActionPool').replace('...',''),icon:'images/vbox/vm_clone_16px.png'},
    		   '-',
    		   {xtype:'button',tooltip:trans('Show Details','VBoxSnapshotsWgt'),icon:'images/vbox/show_snapshot_details_16px.png'}
    		],
    	    viewConfig:{
    	        markDirty:false
    	    },
    	    rootVisible: false,
    	    lines: true,
    	    store: new Ext.data.TreeStore({
    	        
    	    	model: 'vboxprod.model.Snapshot',
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