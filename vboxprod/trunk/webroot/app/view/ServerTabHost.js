/**
 * Server Host tab
 * 
 */

Ext.define('vcube.view.ServerTabHost', {
	extend: 'Ext.panel.Panel',
	alias: 'widget.ServerTabHost',

    title: 'Host',
    
    icon: 'images/vbox/OSE/VirtualBox_cube_42px.png',
    iconCls: 'icon16',
    itemId: 'sectionspane',
    
    cls: 'vmTabDetails',
    autoScroll: true,
    layout: 'vbox',
    width: '100%',
    
    defaults: { xtype: 'panel', width: '100%', margin: '0 10 10 10' },
    style : { background: '#f9f9f9' },
    bodyStyle : { background: '#f9f9f9' },

    html: '',
    
	statics : {
		
		sections: {
			
			/*
			 * General
			 */
			hostgeneral: {
				icon:'machine_16px.png',
				title:vcube.utils.trans('General','VBoxGlobal'),
				settingsLink: 'General',
				rows : [{
					   title: vcube.utils.trans('Hostname', 'VBoxGlobal'),
					   attrib: 'hostname'
				   },{
					   title: vcube.utils.trans('OS Type', 'VBoxGlobal'),
					   callback: function(d) {
						   return d['operatingSystem'] + ' (' + d['OSVersion'] +')';
					   }
				   },{
					   title: vcube.utils.trans('Base Memory'),
					   callback: function(d) {
						   return vcube.utils.trans('<nobr>%1 MB</nobr>').replace('%1',d['memorySize']);
					   }
				   },{
					   title: '',
					   data: '<span id="vboxHostMemUsed"><div style="background-color:#a33" id="vboxHostMemUsedPct"><div style="background-color:#a93;float:right;" id="vboxHostMemResPct"></div></div><div style="width:100%;position:relative;top:-14px;left:0px;text-align:center;"><span id="vboxHostMemUsedLblPct" style="float:left" /><span id="vboxHostMemFreeLbl" style="float:right" /></div></span>'
				   },{
					   title: vcube.utils.trans("Processor(s)",'VBoxGlobal'),
					   callback: function(d) {
						   return d['cpus'][0] + ' (' + d['cpus'].length +')';
					   }
				   },{
					   title: '',
					   callback: function(d) {
					
						   // Processor features?
							var cpuFeatures = new Array();
							for(var f in d.cpuFeatures) {
								if(!d.cpuFeatures[f]) continue;
								cpuFeatures[cpuFeatures.length] = vcube.utils.trans(f);
							}
							return cpuFeatures.join(', ');
							
					   },
					   condition: function(d) {
						   if(!d.cpuFeatures) return false;
						   for(var f in d.cpuFeatures) {
							   if(!d.cpuFeatures[f]) continue;
							   return true;
							}
							return false;
					   }
				}],
				/*
				onRender: function(d) {
					
					// See if timer is already set
					var eTimer = $('#vboxVMDetails').data('vboxHostMemInfoTimer');
					if(eTimer != null) {
						$('#vboxVMDetails').data('vboxHostMemInfoTimer',null);
						window.clearInterval(eTimer);
					}
	
					
					var showFree = $('#vboxPane').data('vboxConfig').hostMemInfoShowFreePct;
					var memRes = $('#vboxPane').data('vboxConfig').vmMemoryOffset;
					if(!memRes || parseInt(memRes) < 1) memRes = 0;
					
					// Memory used function
					var vboxHostShowMemInfo = function(avail) {
	
						// If target div no longer exists, stop updating
						if($('#vboxHostMemFreeLbl')[0] == null) {
							var eTimer = $('#vboxVMDetails').data('vboxHostMemInfoTimer');
							$('#vboxVMDetails').data('vboxHostMemInfoTimer',null);
							window.clearInterval(eTimer);
							return;
						}
						
						// Subtract reserved memory?
						avail -= memRes;
						avail = Math.max(0,avail);
						
						var mUsed = d['memorySize'] - (avail + memRes);
						var mUsedPct = Math.round(parseInt((mUsed / d['memorySize']) * 100));
						var memResPct = 0;
						if(memRes > 0) {
							memResPct = Math.round(parseInt((memRes / d['memorySize']) * 100));
						}
						
						// Add tooltip with info
						var tip = vcube.utils.trans('<nobr>%1 MB</nobr>').replace('%1',mUsed);
						if(memResPct) tip += ' | ' + vcube.utils.trans('<nobr>%1 MB</nobr>').replace('%1',memRes);
						tip += ' | ' + vcube.utils.trans('<nobr>%1 MB</nobr>').replace('%1',avail);
						$('#vboxHostMemUsed').tipped({'source':tip,'position':'mouse'});
						
						// Update tooltip content in case tooltip is already showing
						var cid = $($('#tipped').data('original')).attr('id');
						if(cid && cid == 'vboxHostMemUsed') $('#tipped-content').html(tip);
						
						// Width(s)
						$('#vboxHostMemUsedPct').css({'width':((mUsedPct+memResPct)*2)+'px'});
						if(memRes > 0) {
							$('#vboxHostMemResPct').css({'width':''+(memResPct*2)+'px'});
						} else {
							$('#vboxHostMemResPct').hide();
						}
	
						// Labels
						if(!showFree) {
							$('#vboxHostMemUsedLblPct').html(vcube.utils.trans('<nobr>%1 MB</nobr>').replace('%1',(mUsed)) + ' ('+vcube.utils.trans('<nobr>%1%</nobr>').replace('%1',mUsedPct)+')');
							$('#vboxHostMemFreeLbl').html(vcube.utils.trans('<nobr>%1 MB</nobr>').replace('%1',avail));			
						} else {
							$('#vboxHostMemUsedLblPct').html(vcube.utils.trans('<nobr>%1 MB</nobr>').replace('%1',mUsed));
							$('#vboxHostMemFreeLbl').html('('+vcube.utils.trans('<nobr>%1%</nobr>').replace('%1',Math.round(parseInt((avail / d['memorySize']) * 100)))+') ' + vcube.utils.trans('<nobr>%1 MB</nobr>').replace('%1',avail));
						}
					};
					
					// Refresh at configured intervals
					var interval = 5;
					try {
						interval = Math.max(3,parseInt($('#vboxPane').data('vboxConfig').hostMemInfoRefreshInterval));
					} catch (e) {
						interval = 5;
					}
					
					var vboxHostUpdateMeminfo = function() {
						$.when(vboxAjaxRequest('hostGetMeminfo')).done(function(d){
							vboxHostShowMemInfo(d.responseData);		
						});
					};
					vboxHostUpdateMeminfo();
					
					// Failsafe
					if(isNaN(interval) || interval < 3) interval = 5;
					
					$('#vboxVMDetails').data('vboxHostMemInfoTimer',window.setInterval(vboxHostUpdateMeminfo,interval*1000));
				
				}
				*/
	
			},
				   
			hostnetwork: {
				title: vcube.utils.trans('Network'),
				icon: 'nw_16px.png',
				rows: function(d) {
					
					var netRows = [];
					
					for(var i = 0; i < d['networkInterfaces'].length; i++) {		
						
						/* Interface Name */
						netRows[netRows.length] = {
							title: d['networkInterfaces'][i].name + ' (' + vcube.utils.trans(d['networkInterfaces'][i].status,'VBoxGlobal') + ')',
							data: ''
						};
						
	
						/* IPv4 Addr */
						if(d['networkInterfaces'][i].IPAddress){
							
							netRows[netRows.length] = {
								title: vcube.utils.trans('IPv4 Address','UIGlobalSettingsNetwork'),
								data: d['networkInterfaces'][i].IPAddress + ' / ' + d['networkInterfaces'][i].networkMask,
								indented: true
							};
							
						}
						
						/* IPv6 Address */
						if(d['networkInterfaces'][i].IPV6Supported && d['networkInterfaces'][i].IPV6Address) {
							
							netRows[netRows.length] = {
								title: vcube.utils.trans('IPv6 Address','UIGlobalSettingsNetwork'),
								data: d['networkInterfaces'][i].IPV6Address + ' / ' + d['networkInterfaces'][i].IPV6NetworkMaskPrefixLength,
								indented: true
							};
						}
						
						/* Physical info */
						netRows[netRows.length] = {
							title: '',
							data: vcube.utils.trans(d['networkInterfaces'][i].mediumType) + (d['networkInterfaces'][i].hardwareAddress ? ' (' + d['networkInterfaces'][i].hardwareAddress + ')' : ''),
							indented: true
						};
						
									
					}
					return netRows;
				}
			},
	
			hostdvddrives : {
				title: vcube.utils.trans('DVD','UIApplianceEditorWidget'),
				icon: 'cd_16px.png',
				condition: function(d) {
					return d['DVDDrives'].length;
				},
				rows: function(d) {
	
					var dvdRows = [];
					
					for(var i = 0; i < d['DVDDrives'].length; i++) {
						dvdRows[dvdRows.length] = {
							title: '%s (%s)' %(d['DVDDrives'][i].name, d['DVDDrives'][i].location),
							data: ''
						};
					}
					
					return dvdRows;
				}
			},
			
			hostfloppydrives: {
				title: vcube.utils.trans('Floppy','UIApplianceEditorWidget'),
				icon: "fd_16px.png",
				condition: function(d) { return d['floppyDrives'].length; },
				rows: function(d) {
					
					var fRows = [];
					
					for(var i = 0; i < d['floppyDrives'].length; i++) {		
						
						fRows[fRows.length] = {
								title: '%s (%s)' %(d['floppyDrives'][i].name, d['floppyDrives'][i].location),
								data: ''
						};
						
					}
	
					return fRows;
				}
			}

		}
	}    	
});
