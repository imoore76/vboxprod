/**
 * VM actions
 */
Ext.define('vcube.actions.machine',{
	
	statics: {
	
		/** Invoke the new virtual machine wizard */
		'new':{
			action: function(fromGroup){
				new vboxWizardNewVMDialog((fromGroup ? $(vboxChooser.getSelectedGroupElements()[0]).data('vmGroupPath') : '')).run();
			}
		},
		
		/** Add a virtual machine via its settings file */
		add: {
			action:function(selectionModel){
				vboxFileBrowser($('#vboxPane').data('vboxSystemProperties').defaultMachineFolder,function(f){
					if(!f) return;
					var l = new vboxLoader();
					l.add('machineAdd',function(){return;},{'file':f});
					l.onLoad = function(){
						var lm = new vboxLoader();
						lm.add('vboxGetMedia',function(d){$('#vboxPane').data('vboxMedia',d.responseData);});
						lm.run();
					};
					l.run();
					
				},false,vcube.utils.trans('Add an existing virtual machine','UIActionPool'),'images/vbox/machine_16px.png',true);
			}
		},
	
		/** Start VM */
		start: {
			action : function (selectionModel) {
			
				
				// Should the "First Run" wizard be started
				////////////////////////////////////////////
				/*
				var firstRun = function(vm) {
					
					var frDef = $.Deferred();
					
					$.when(vboxVMDataMediator.getVMDetails(vm.id)).done(function(d) {
	
						// Not first run?
						if(d.GUI.FirstRun != 'yes') {
							// Just resolve, nothing to do
							frDef.resolve(d);
							return;
						}
	
						// Check for CD/DVD drive attachment that has no CD/DVD
						var cdFound = false;
						for(var i = 0; i < d.storageControllers.length; i++) {
							for(var a = 0; a < d.storageControllers[i].mediumAttachments.length; a++) {
								if(d.storageControllers[i].mediumAttachments[a].type == "DVD" &&
										d.storageControllers[i].mediumAttachments[a].medium == null) {
									cdFound = true;
									break;
								}
							}
						}
						
						// No CD/DVD attachment
						if(!cdFound) {
							// Just resolve, nothing to do
							frDef.resolve(d);
							return;	
						}
						
						// First time run
						$.when(d, new vboxWizardFirstRunDialog(d).run()).done(function(vm2start){
							frDef.resolve(vm2start);
						});
						
						
					});
					return frDef;
				};
				*/
				var firstRun = function(vm) {
					return vm;
				}
				// Start each eligable selected vm
				//////////////////////////////////////
				var startVMs = function() {				
					
					var vms = selectionModel.getSelection();
					var vmsToStart = [];
					for(var i = 0; i < vms.length; i++) {
						try {
							vm = vcube.storemanager.getStoreRecordData('vm',vms[i].get('id'));
						} catch(err) {
							continue;
						}
						if(vcube.utils.vboxVMStates.isPaused(vm) || vcube.utils.vboxVMStates.isPoweredOff(vm) || vcube.utils.vboxVMStates.isSaved(vm)) {
							vmsToStart[vmsToStart.length] = vm;
						}
						
					}
					
					
					(function runVMsToStart(vms){
						
						(vms.length && Ext.ux.Deferred.when(firstRun(vms.shift())).done(function(vm){
	
							vcube.utils.ajaxRequest('vbox/machineSetState',Ext.apply({'state':'powerUp'},vcube.utils.vmAjaxParams(vm.id)));
							
							runVMsToStart(vms);
							
						}));
					})(vmsToStart);
				};
				
				// Check for memory limit
				// Paused VMs are already using all their memory
				if(vcube.app.settings.vmMemoryStartLimitWarn) {
					
					var freeMem = 0;
					var baseMem = 0;
					
					// Host memory needs to be checked
					var loadData = [vcube.utils.ajaxRequest('hostGetMeminfo')];
					
					// Load details of each machine to get memory info
					var vms = vboxChooser.getSelectedVMsData(selectionModel);
					for(var i = 0; i < vms.length; i++) {
						if(vcube.utils.vboxVMStates.isPoweredOff(vms[i]) || vcube.utils.vboxVMStates.isSaved(vms[i]))
							loadData[loadData.length] = vboxVMDataMediator.getVMDataCombined(vms[i].id);
					}
					
					// Show loading screen while this is occuring
					var l = new vboxLoader('vboxHostMemCheck');
					l.showLoading();
					
					// Load all needed data
					$.when.apply($, loadData).done(function() {
						
						// Remove loading screen
						l.removeLoading();
	
						// First result is host memory info
						freeMem = arguments[0].responseData;
						
						// Add memory of each VM
						for(var i = 1; i < arguments.length; i++) {
					
							// Paused VMs are already using their memory
							if(vcube.utils.vboxVMStates.isPaused(arguments[i])) continue;
							
							// memory + a little bit of overhead
							baseMem += (arguments[i].memorySize + 50);
						}
	
						// subtract offset
						if($('#vboxPane').data('vboxConfig').vmMemoryOffset)
							freeMem -= $('#vboxPane').data('vboxConfig').vmMemoryOffset;
						
						// Memory breaches warning threshold
						if(baseMem >= freeMem) {
							var buttons = {};
							buttons[vcube.utils.trans('Yes','QIMessageBox')] = function(){
								$(this).remove();
								startVMs();
							};
							freeMem = Math.max(0,freeMem);
							vcube.utils.confirm('<p>The selected virtual machine(s) require(s) <b><i>approximately</b></i> ' + baseMem +
									'MB of memory, but your VirtualBox host only has ' + freeMem + 'MB '+
									($('#vboxPane').data('vboxConfig').vmMemoryOffset ? ' (-'+$('#vboxPane').data('vboxConfig').vmMemoryOffset+'MB)': '') +
									' free.</p><p>Are you sure you want to start the virtual machine(s)?</p>',buttons,vcube.utils.trans('No','QIMessageBox'));
							
							// Memory is fine. Start vms.
						} else {
							startVMs();
						}
						
					});
					
				// No memory limit warning configured
				} else {
					startVMs();
				}
	
							
			},
			enabled_test: function (selectionModel) {
				return vcube.utils.vboxVMStates.isOneRecord(['Paused','PoweredOff'], selectionModel.getSelection());
			}	
		},
		
		/** Invoke VM settings dialog */
		settings: {
			action:function(selectionModel){
				
				vboxVMsettingsDialog(vboxChooser.getSingleSelectedId());
			},
			enabled_test: function (selectionModel) {
				return selectionModel.selected.length == 1 && vcube.utils.vboxVMStates.isOneRecord(['Running','PoweredOff','Editable'], selectionModel.getSelection());
			}
		},
	
		/** Clone a VM */
		clone: {
			action:function(selectionModel){
				new vboxWizardCloneVMDialog({vm:vboxChooser.getSingleSelected()}).run();
			},
			enabled_test: function (selectionModel) {
				return selectionModel.selected.length == 1 && vcube.utils.vboxVMStates.isOneRecord(['PoweredOff'], selectionModel.getSelection());
			}
		},
	
		/** Refresh a VM's details */
		refresh: {
			action:function(selectionModel){
				
				var vmid = vboxChooser.getSingleSelectedId();
				
				var l = new vboxLoader();
				l.showLoading();
				$.when(vboxVMDataMediator.refreshVMData(vmid)).done(function(){
					l.removeLoading();
				});
				
	    	},
	    	enabled_test: function (selectionModel) {return(selectionModel.selected.length == 1);}
	    },
	    
	    /** Delete / Remove a VM */
	    remove: {
			action:function(selectionModel){
	
				//////////////////
				// Unregister VMs
				///////////////////
				var unregisterVMs = function(keepFiles, vms) {
	
					var vms = vcube.utils.getSelectedVMsData(selectionModel);
					
					for(var i = 0; i < vms.length; i++) {
						
						if(vcube.utils.vboxVMStates.isPoweredOff(vms[i])) {
	
							// Remove each selected vm
							$.when(vms[i].name, vcube.utils.ajaxRequest('machineRemove',
									{'vm':vms[i].id,'delete':(keepFiles ? '0' : '1')}))
								.done(function(vmname, d){
									// check for progress operation
									if(d && d.responseData && d.responseData.progress) {
										vboxProgress({'progress':d.responseData.progress,'persist':d.persist},function(){return;},'progress_delete_90px.png',
												vcube.utils.trans('Remove the selected virtual machines', 'UIActionPool'), vmname);
									}
							});						
						}
					}				
				};
				var buttons = {};
				buttons[vcube.utils.trans('Delete all files','UIMessageCenter')] = function(){
					$(this).empty().remove();
					unregisterVMs(false);
				};
				buttons[vcube.utils.trans('Remove only','UIMessageCenter')] = function(){
					$(this).empty().remove();
					unregisterVMs(true);
				};
				
				
				var vmNames = [];
				var vms = vcube.utils.getSelectedVMsData(selectionModel);
				for(var i = 0; i < vms.length; i++) {
					if(vcube.utils.vboxVMStates.isPoweredOff(vms[i]) && !vboxChooser.vmHasUnselectedCopy(vms[i].id)) {
						vmNames[vmNames.length] = vms[i].name;
					}
				}
				
				if(vmNames.length) {
	
					vmNames = '<b>'+vmNames.join('</b>, <b>')+'</b>';
					var q = vcube.utils.trans('<p>You are about to remove following virtual machines from the machine list:</p><p>%1</p><p>Would you like to delete the files containing the virtual machine from your hard disk as well? Doing this will also remove the files containing the machine\'s virtual hard disks if they are not in use by another machine.</p>','UIMessageCenter').replace('%1',vmNames);
					
					vcube.utils.confirm(q,buttons);
					
				}
					
	    	
	    	},
	    	enabled_test: function (selectionModel) {
	    		return vcube.utils.vboxVMStates.isOneRecord('PoweredOff', selectionModel.getSelection());
	    	}
	    },
	    
	    /** Discard VM State */
	    discard: {

	    	action:function(selectionModel){
				
				var buttons = [{
					text: vcube.utils.trans('Discard','UIMessageCenter'),
					listeners: {
						click: function(btn) {
							btn.up('.window').close();
							var vms = vcube.utils.getSelectedVMsData(selectionModel);
							for(var i = 0; i < vms.length; i++) {
								if(vcube.utils.vboxVMStates.isSaved(vms[i])) {
									vcube.utils.ajaxRequest('vbox/machineSetState',Ext.apply({},{'state':'discardSavedState'}, vcube.utils.vmAjaxParams(vms[i].id)));
								}
							}
						}
					}
				}];

				var vmNames = [];
				var vms = vcube.utils.getSelectedVMsData(selectionModel);
				for(var i = 0; i < vms.length; i++) {
					if(vcube.utils.vboxVMStates.isSaved(vms[i])) {
						vmNames[vmNames.length] = vms[i].name;
					}
				}
				
				if(vmNames.length) {
	
					vmNames = '<b>'+vmNames.join('</b>, <b>')+'</b>';
					
					vcube.utils.confirm(vcube.utils.trans('<p>Are you sure you want to discard the saved state of the following virtual machines?</p><p><b>%1</b></p><p>This operation is equivalent to resetting or powering off the machine without doing a proper shutdown of the guest OS.</p>','UIMessageCenter').replace('%1',vmNames),buttons);
				}
			},
			enabled_test: function(selectionModel){
				return vcube.utils.vboxVMStates.isOneRecord('Saved', selectionModel.getSelection());
			}
	    },
	    
	    /** Install Guest Additions **/
	    guestAdditionsInstall : {

	    	action: function(selectionModel) {
	    		
	    		if(!vmid)
	    			vmid = vboxChooser.getSingleSelected().id;
	    		
				$.when(vcube.utils.ajaxRequest('consoleGuestAdditionsInstall',{'vm':vmid,'mount_only':(mount_only ? 1 : 0)})).done(function(d){
					
					// Progress operation returned. Guest Additions are being updated.
					if(d && d.responseData && d.responseData.progress) {
					
						vboxProgress({'progress':d.responseData.progress,'persist':d.persist,'catcherrs':1},function(d){
						
							// Error updating guest additions
							if(!d.responseData.result && d.responseData.error && d.responseData.error.err) {
								if(d.responseData.error.err != 'VBOX_E_NOT_SUPPORTED') {
									vboxAlert({'error':vcube.utils.trans('Failed to update Guest Additions. The Guest Additions installation image will be mounted to provide a manual installation.','UIMessageCenter'),'details':d.responseData.error.err+"\n"+d.responseData.error.message});
								}
								vcube.actions.machine['guestAdditionsInstall'].action(vmid, true);
								return;
							}
						},'progress_install_guest_additions_90px.png',vcube.utils.trans('Install Guest Additions...','UIActionPool').replace(/\./g,''));
						
					// Media was mounted
					} else if(d.responseData && d.responseData.result && d.responseData.result == 'mounted') {
	
						// Media must be refreshed
						var ml = new vboxLoader();
						ml.add('vboxGetMedia',function(dat){$('#vboxPane').data('vboxMedia',dat.responseData);});
						ml.run();
						
						if(d.responseData.errored)
							vboxAlert(vcube.utils.trans('Failed to update Guest Additions. The Guest Additions installation image will be mounted to provide a manual installation.','UIMessageCenter'));
						
					// There's no CDROM drive
					} else if(d.responseData && d.responseData.result && d.responseData.result == 'nocdrom') {
						
						var vm = vcube.storemanager.getStoreRecordData('vm',vmid);
						vboxAlert(vcube.utils.trans("<p>Could not insert the VirtualBox Guest Additions " +
				                "installer CD image into the virtual machine <b>%1</b>, as the machine " +
				                "has no CD/DVD-ROM drives. Please add a drive using the " +
				                "storage page of the virtual machine settings dialog.</p>",'UIMessageCenter').replace('%1',vm.name));
						
					// Can't find guest additions
					} else if (d.responseData && d.responseData.result && d.responseData.result == 'noadditions') {
						
						var s1 = '('+vcube.utils.trans('None','VBoxGlobal')+')';
						var s2 = s1;
						
						if(d.responseData.sources && d.responseData.sources.length) {
							if(d.responseData.sources[0]) s1 = d.responseData.sources[0];
							if(d.responseData.sources[1]) s2 = d.responseData.sources[1];
						}
						var q = vcube.utils.trans('<p>Could not find the VirtualBox Guest Additions CD image file <nobr><b>%1</b></nobr> or <nobr><b>%2</b>.</nobr></p><p>Do you wish to download this CD image from the Internet?</p>','UIMessageCenter').replace('%1',s1).replace('%2',s2);
						var b = {};
						b[vcube.utils.trans('Yes','QIMessageBox')] = function() {
							var url = 'http://download.virtualbox.org/virtualbox/%1/VBoxGuestAdditions_%2.iso';
							url = url.replace('%1',$('#vboxPane').data('vboxConfig').version.string.replace('_OSE',''));
							url = url.replace('%2',$('#vboxPane').data('vboxConfig').version.string.replace('_OSE',''));
							$(this).remove();
							window.open(url);
						};
						vcube.utils.confirm(q,b,vcube.utils.trans('No','QIMessageBox'));
					}
				});
	
	    	}
	
	    },
	    
	    /** Show VM Logs */
	    logs: {
			action: function(selectionModel){
			
				var vm = vcube.utils.getSelectedVMsData(selectionModel)[0];

				// Create window
				var win = Ext.create('vcube.view.common.VMLogs');
				win.setTitle(win.titleTpl.apply([vm.name]));
				
				/**
				 * Populate log list
				 */
				function populate() {
					
					win.setLoading(true);
					
					var logList = win.down('#loglist');
					if(logList) win.remove(logList, true);
					
					Ext.ux.Deferred.when(vcube.utils.ajaxRequest('vbox/machineGetLogFilesList',vcube.utils.vmAjaxParams(vm))).done(function(data) {
						
						if(data.logs.length == 0) {
							
							win.add({'html':vcube.utils.trans('<p>No log files found. Press the <b>Refresh</b> button to rescan the log folder <nobr><b>%1</b></nobr>.</p>','UIVMLogViewer')
								.replace('%1',data.path)});
					
						} else {
							
							win.add({xtype:'tabpanel','itemId':'loglist'});
							
							var tabList = [];
							
							for(var i = 0; i < data.logs.length; i++) {
								
								tabList.push({
									
									_vcubePanelIndex: i,
									
									title: vcube.utils.basename(data.logs[i]),
									layout: 'fit',
									defaults: { xtype: 'textareafield'},
									listeners: {
										
										show: function(panel) {
											
											if(panel._loaded) return;
											
											panel.setLoading(true);
											
											var panelIndex = panel.initialConfig._vcubePanelIndex;
											
											Ext.ux.Deferred.when(vcube.utils.ajaxRequest('vbox/machineGetLogFile',Ext.apply({log:panelIndex},vcube.utils.vmAjaxParams(vm)))).done(function(log) {
											
												panel._loaded = true;
												
												panel.add({value:log});
												
												panel.setLoading(false);
											});
										},
									
										afterrender: function(panel) {
											if(panel._vcubePanelIndex == 0) panel.fireEvent('show',panel);
										}
										
									}
								});
							}
							
							win.add({xtype:'tabpanel','itemId':'loglist', items: tabList});
							
						}
						win.setLoading(false);
					});					
				}

				win.down('#close').on('click',function(){win.close()});
				win.down('#refresh').on('click',function(){populate()});
				
				win.show();
				populate();

			},
			enabled_test: function(selectionModel){
				return (selectionModel.selected.length == 1);
			}
	    },
	
	    /** Save the current VM State */
		savestate: {
			stop_action: true,
			enabled_test: function(selectionModel){
				return vcube.utils.vboxVMStates.isOneRecord(['Running','Paused'], selectionModel.getSelection());
			},
			action: function(selectionModel) {
	
				var vms = vcube.utils.getSelectedVMsData(selectionModel);
				for(var i = 0; i < vms.length; i++) {
					if(vcube.utils.vboxVMStates.isRunning(vms[i]) || vboxVMStates.isPaused(vms[i]))
						vcube.actions.machine.powerAction('savestate','Save the machine state of the selected virtual machines', vms[i]);
				}
			}
		},
	
		/** Send ACPI Power Button to VM */
		powerbutton: {
			stop_action: true,
			enabled_test: function(selectionModel){
				return vcube.utils.vboxVMStates.isOneRecord(['Running'], selectionModel.getSelection());
			},
			action: function(selectionModel) {
				var buttons = {};
				buttons[vcube.utils.trans('ACPI Shutdown','UIMessageCenter')] = function() {
					$(this).empty().remove();
					var vms = vcube.utils.getSelectedVMsData(selectionModel);
					for(var i = 0; i < vms.length; i++) {
						if(vcube.utils.vboxVMStates.isRunning(vms[i]))
							vcube.actions.machine.powerAction('powerbutton','Send the ACPI Power Button press event to the virtual machine', vms[i]);		
					}
				};
				var vmNames = [];
				var vms = vcube.utils.getSelectedVMsData(selectionModel);
				for(var i = 0; i < vms.length; i++) {
					if(vcube.utils.vboxVMStates.isRunning(vms[i])) {
						vmNames[vmNames.length] = vms[i].name;
					}
				}
				
				if(vmNames.length) {
	
					vmNames = '<b>'+vmNames.join('</b>, <b>')+'</b>';
	
					vcube.utils.confirm(vcube.utils.trans("<p>Do you really want to send an ACPI shutdown signal " +
						"to the following virtual machines?</p><p><b>%1</b></p>",'UIMessageCenter').replace('%1', vmNames),buttons);
				}
			}
		},
		
		/** Pause a running VM */
		pause: {

			enabled_test: function(selectionModel){
				return vcube.utils.vboxVMStates.isOneRecord(['Running'], selectionModel.getSelection());
			},
			action: function(selectionModel) {
				var vms = vcube.utils.getSelectedVMsData(selectionModel);
				for(var i = 0; i < vms.length; i++) {
					if(vcube.utils.vboxVMStates.isRunning(vms[i]))
						vcube.actions.machine.powerAction('pause','Suspend the execution of the selected virtual machines', vms[i]);
				}
			}
		},
		
		/** Power off a VM */
		poweroff: {

			stop_action: true,
			enabled_test: function(selectionModel) {
				return vcube.utils.vboxVMStates.isOneRecord(['Running','Paused','Stuck'], selectionModel.getSelection());
			},
			action: function(selectionModel) {
				
				var buttons = [{
					text: vcube.utils.trans('Power Off','UIActionPool'),
					listeners: {
						click: function(btn) {
							var vms = vcube.utils.getSelectedVMsData(selectionModel);
							for(var i = 0; i < vms.length; i++) {
								if(vcube.utils.vboxVMStates.isRunning(vms[i]) || vcube.utils.vboxVMStates.isPaused(vms[i]) || vcube.utils.vboxVMStates.isStuck(vms[i]))
									vcube.actions.machine.powerAction('poweroff','Power off the selected virtual machines', vms[i]);
							}
							btn.up('.window').close();
						}
					}
				}];
				
				var vmNames = [];
				var vms = vcube.utils.getSelectedVMsData(selectionModel);
				for(var i = 0; i < vms.length; i++) {
					if(vcube.utils.vboxVMStates.isRunning(vms[i]) || vcube.utils.vboxVMStates.isPaused(vms[i])) {
						vmNames[vmNames.length] = vms[i].name;
					}
				}
				
				if(vmNames.length) {
	
					vmNames = '<b>'+vmNames.join('</b>, <b>')+'</b>';
					
					vcube.utils.confirm(vcube.utils.trans("<p>Do you really want to power off the following virtual machines?</p>" +
							"<p><b>%1</b></p><p>This will cause any unsaved data in applications " +
							"running inside it to be lost.</p>", 'UIMessageCenter').replace('%1', vmNames), buttons);
				}
	
			}
		},
		
		/** Reset a VM */
		reset: {

			enabled_test: function(selectionModel){
				return vcube.utils.vboxVMStates.isOneRecord(['Running','Paused'], selectionModel.getSelection());
			},
			action: function(selectionModel) {
				var buttons = {};
				buttons[vcube.utils.trans('Reset','UIActionPool')] = function() {
					$(this).remove();
	
					var vms = vcube.utils.getSelectedVMsData(selectionModel);
					for(var i = 0; i < vms.length; i++) {
						if(vcube.utils.vboxVMStates.isRunning(vms[i]))
							vcube.actions.machine.powerAction('reset','Reset the selected virtual machines', vms[i]);
					}
				};
				
				var vmNames = [];
				var vms = vcube.utils.getSelectedVMsData(selectionModel);
				for(var i = 0; i < vms.length; i++) {
					if(vcube.utils.vboxVMStates.isRunning(vms[i])) {
						vmNames[vmNames.length] = vms[i].name;
					}
				}
				
				if(vmNames.length) {
	
					vmNames = '<b>'+vmNames.join('</b>, <b>')+'</b>';
	
					vcube.utils.confirm(vcube.utils.trans("<p>Do you really want to reset the following virtual machines?</p><p><b>%1</b></p><p>This will cause any unsaved data in applications "+
							"running inside it to be lost.</p>",'UIMessageCenter').replace('%1',vmNames),buttons);
				}
			}
		},
		
		/** Stop actions list */
		stop_actions: ['savestate','powerbutton','poweroff'],
	
		/** Stop a VM */
		stop: {
			action: function () { return true; /* handled by stop context menu */ },
			enabled_test: function (selectionModel) {
				return vcube.utils.vboxVMStates.isOneRecord(['Running','Paused','Stuck'], selectionModel.getSelection());
			}
		},
		
		/** Power Action Helper function */
		powerAction: function(pa,pt,vm){
			icon =null;
			errorMsg = null;
			switch(pa) {
				case 'poweroff':
					fn = 'powerDown';
					icon='progress_poweroff_90px.png';
					break;
				case 'powerbutton':
					fn = 'powerButton';
					errorMsg = vcube.utils.trans('Failed to send the ACPI Power Button press event to the virtual machine <b>%1</b>.','UIMessageCenter');
					break;
				case 'savestate':
					fn = 'saveState';
					icon='progress_state_save_90px.png';
					break;
				case 'pause':
					fn = 'pause';
					break;
				case 'reset':
					fn = 'reset';
					break;
				default:
					return;
			}
			
			Ext.ux.Deferred.when(vcube.utils.ajaxRequest('vbox/machineSetState',{'vm':vm.id,'state':fn,'connector':vm.connector_id})).fail(function(d){
				if(errorMsg) {
					vcube.utils.alert(errorMsg.replace('%1', vm.name));
				}
			});	
			
		}
		
	}
	

});