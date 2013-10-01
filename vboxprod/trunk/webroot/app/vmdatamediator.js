/**
 * @fileOverview Deferred data loader / cacher singleton. Provides vboxDataMediator
 * @author Ian Moore (imoore76 at yahoo dot com)
 * @version $Id: datamediator.js 543 2013-08-08 15:46:34Z imoore76 $
 * @copyright Copyright (C) 2010-2013 Ian Moore (imoore76 at yahoo dot com)
 */

/**
 * vcube.vmdatamediator
 * 
 */
Ext.define('vcube.vmdatamediator', {

	singleton: true,
	
	running: false,
	
	started: null,
	
	requires: ['vcube.utils'],
	
	/* Promises for data */
	promises : {
		'getVMList' : null,
		'getVMDetails':{},
		'getVMRuntimeData':{},
		'getVMsFromServer': {}
	},
	
	/* Holds Basic VM data */
	vmData : {},
	
	/* Holds VM details */
	vmDetailsData : {},
	
	/* Holds VM runtime data */
	vmRuntimeData : {},
		
	/* Holds server ids */
	gotVMsFromServers : {},

	/* Expire cached promise / data */
	expireVMDetails: function(vmid) {
		vcube.vmdatamediator.promises.getVMDetails[vmid] = null;
		vcube.vmdatamediator.vmDetailsData[vmid] = null;
	},
	expireVMRuntimeData: function(vmid) {
		vcube.vmdatamediator.promises.getVMRuntimeData[vmid] = null;
		vcube.vmdatamediator.vmRuntimeData[vmid] = null;
	},
	expireAll: function() {
		for(var i in vcube.vmdatamediator.promises) {
			if(typeof(i) != 'string') continue;
			vcube.vmdatamediator.promises[i] = {};
		}
		vcube.vmdatamediator.vmData = {};
		vcube.vmdatamediator.vmRuntimeData = {};
		vcube.vmdatamediator.vmDetailsData = {};
		vcube.vmdatamediator.gotVMsFromServers = {};
	},
	
	stop: function() {
		vcube.vmdatamediator.expireAll();
	},
	
	/*
	 * Data Stores
	 */
	stores: {
		'VirtualMachines': null,
		'Servers':null,
		'VMGroups':null
	},
	
	
	/**
	 * Get basic vm data
	 * 
	 * @param vmid {String} ID of VM
	 * @returns {Object} vm data
	 */
	getVMData: function(vmid) {
		
		// VMList must exist
		if(!vcube.vmdatamediator.vmData) {
			vcube.utils.alert('vmdatamediator: getVMData called before a VM list exists!');
			return;
		}
		
		return vcube.vmdatamediator.vmData[vmid];
		
	},
	
	
	/**
	 * Start data mediator
	 */
	start: function() {
		
		vcube.vmdatamediator.running = true;
		
		vcube.vmdatamediator.started = Ext.create('Ext.ux.Deferred');
		
		/*
		 * Create stores 
		 */
		vcube.vmdatamediator.stores.VMGroups = Ext.create('Ext.data.Store', {
		    model: 'vcube.model.VMGroup',
		    proxy: {
		        type: 'vcubeAjax',
		        url : 'vmgroups/getGroups'
		    },
		    autoLoad: false,
		    listeners: {
		    	load: function(store,records,successful) {
		    		if(!successful) {
		    			vcube.app.fatalError("Failed to load groups.");
		    			return;
		    		}
		    		console.log(successful);
		    		console.log("adding");
		    		console.log(records);
		    	}
		    }

		});
		
		vcube.vmdatamediator.stores.Servers = Ext.create('Ext.data.Store', {
		    model: 'vcube.model.Connector',
		    proxy: {
		        type: 'vcubeAjax',
		        url : 'connectors/getConnectors'
		    },
		    autoLoad: false,
		    listeners: {
		    	load: function(store,records,successful) {
		    		if(!successful) {
		    			vcube.app.fatalError("Failed to load connectors.");
		    			return;
		    		}
		    		console.log(successful);
		    		console.log("adding");
		    		console.log(records);
		    	}
		    }
		});
		
		vcube.vmdatamediator.stores.VirtualMachines = Ext.create('Ext.data.Store', {
		    model: 'vcube.model.VirtualMachine',
		    proxy: {
		        type: 'vcubeAjax',
		        url : 'vbox/vboxGetMachines'
		    },
		    autoLoad: false
		});

		
		/*
		 * 
		 * VirtualBox events
		 * 
		 */
		
		var snapshotEvent = function(eventData) {
			
			if(vcube.vmdatamediator.vmData[eventData.machineId]) {
				
				vcube.vmdatamediator.vmData[eventData.machineId].currentSnapshotName = eventData.enrichmentData.currentSnapshotName;
				vcube.vmdatamediator.vmData[eventData.machineId].currentStateModified = eventData.enrichmentData.currentStateModified;
				
				// Get media again
				Ext.ux.Deferred.when(vboxAjaxRequest('vboxGetMedia')).done(function(d){$('#vboxPane').data('vboxMedia',d);});
				
			}
			if(vcube.vmdatamediator.vmDetailsData[eventData.machineId])
				vcube.vmdatamediator.vmDetailsData[eventData.machineId].snapshotCount = eventData.enrichmentData.snapshotCount;
		};
		
		// Raw event to data handlers
		vcube.app.on({
			
		
			'vboxMachineDataChanged' : function(eventData) {
		
				
				vcube.vmdatamediator.expireVMDetails(eventData.machineId);
				vcube.vmdatamediator.expireVMRuntimeData(eventData.machineId);
				
				if(vcube.vmdatamediator.vmData[eventData.machineId] && eventData.enrichmentData) {
					Ext.apply(vcube.vmdatamediator.vmData[eventData.machineId], eventData.enrichmentData);
					// $.extend doesn't seem to handle this for some reason
					vcube.vmdatamediator.vmData[eventData.machineId].groups = eventData.enrichmentData.groups; 
				}

			},
			// Machine state change
			'vboxMachineStateChanged' :function(eventData) {

				// Only care about it if its in our list
				if(vcube.vmdatamediator.vmData[eventData.machineId]) {
					
					vcube.vmdatamediator.vmData[eventData.machineId].state = eventData.state;
					vcube.vmdatamediator.vmData[eventData.machineId].lastStateChange = eventData.enrichmentData.lastStateChange;
					vcube.vmdatamediator.vmData[eventData.machineId].currentStateModified = eventData.enrichmentData.currentStateModified;
					
					// Expire runtime data on state change
					vcube.vmdatamediator.expireVMRuntimeData(eventData.machineId);
	
				}
				
			},

			// Session state change
			'vboxSessionStateChanged' : function(eventData) {
			
				if(vcube.vmdatamediator.vmData[eventData.machineId])
					vcube.vmdatamediator.vmData[eventData.machineId].sessionState = eventData.state;
			},

			// Snapshot changed
			'vboxSnapshotTaken' : snapshotEvent,
			'vboxSnapshotDeleted' : snapshotEvent,
			'vboxSnapshotChanged' : snapshotEvent,
			
			// Expire all data for a VM when machine is unregistered
			'vboxMachineRegistered' : function(eventData) {
			
				if(!eventData.registered) {
					
					vcube.vmdatamediator.expireVMDetails(eventData.machineId);
					vcube.vmdatamediator.expireVMRuntimeData(eventData.machineId);
					vcube.vmdatamediator.vmData[eventData.machineId] = null;
					
				} else if(eventData.enrichmentData) {
				    
				    vcube.vmdatamediator.vmData[eventData.enrichmentData.id] = eventData.enrichmentData;
	
				}

			},
		
			'vboxCPUChanged' : function(eventData) {

				if(!vcube.vmdatamediator.vmRuntimeData[eventData.machineId]) return;
				
				if(eventData.enrichmentData.add) {
					vcube.vmdatamediator.vmRuntimeData[eventData.machineId].CPUCount++;
				} else {
					vcube.vmdatamediator.vmRuntimeData[eventData.machineId].CPUCount--;
				}

			},
			
			'vboxNetworkAdapterChanged' : function(eventData) {
			
				if(vcube.vmdatamediator.vmRuntimeData[eventData.machineId]) {
					Ext.apply(vcube.vmdatamediator.vmRuntimeData[eventData.machineId].networkAdapters[eventData.networkAdapterSlot], eventData.enrichmentData);
				}
			
			},
		/* Storage controller of VM changed */
		//}).on('vboxStorageControllerChanged', function() {
			/*
		    case 'StorageControllerChanged':
		    	$data['machineId'] = $eventDataObject->machineId;
		    	$data['dedupId'] .= '-'. $data['machineId'];
		    	break;
		    */
			
			'vboxMediumChanged' : function(eventData) {
			
				/* Medium attachment changed */
				if(vcube.vmdatamediator.vmRuntimeData[eventData.machineId]) {
					for(var a = 0; a < vcube.vmdatamediator.vmRuntimeData[eventData.machineId].storageControllers.length; a++) {
						if(vcube.vmdatamediator.vmRuntimeData[eventData.machineId].storageControllers[a].name == eventData.controller) {
							for(var b = 0; b < vcube.vmdatamediator.vmRuntimeData[eventData.machineId].storageControllers[a].mediumAttachments.length; b++) {
								if(vcube.vmdatamediator.vmRuntimeData[eventData.machineId].storageControllers[a].mediumAttachments[b].port == eventData.port &&
										vcube.vmdatamediator.vmRuntimeData[eventData.machineId].storageControllers[a].mediumAttachments[b].device == eventData.device) {
									
									vcube.vmdatamediator.vmRuntimeData[eventData.machineId].storageControllers[a].mediumAttachments[b].medium = (eventData.medium ? {id:eventData.medium} : null);
									break;
								}
							}
							break;
						}
					}
				}
			},
		/* Shared folders changed */
		//}).on('vboxSharedFolderChanged', function() {

		// VRDE runtime info
			'vboxVRDEServerChanged' : function(eventData) {

				if(vcube.vmdatamediator.vmRuntimeData[eventData.machineId]) {
					Ext.apply(vcube.vmdatamediator.vmRuntimeData[eventData.machineId].VRDEServer, eventData.enrichmentData);
				}
				
			},

			'vboxVRDEServerInfoChanged' : function(eventData) {

				if(vcube.vmdatamediator.vmRuntimeData[eventData.machineId]) {
					vcube.vmdatamediator.vmRuntimeData[eventData.machineId].VRDEServerInfo.port = eventData.enrichmentData.port;
					vcube.vmdatamediator.vmRuntimeData[eventData.machineId].VRDEServer.enabled = eventData.enrichmentData.enabled;
				}

			},
			// Execution cap
			'vboxCPUExecutionCapChanged' : function(eventData) {
			
				if(vcube.vmdatamediator.vmRuntimeData[eventData.machineId]) {
					vcube.vmdatamediator.vmRuntimeData[eventData.machineId].CPUExecutionCap = eventData.executionCap;
				}

			},
			
			'vboxMachineGroupChanged' : function(eventData) {
				if(!vcube.datamediator.vmData[eventData.machineId]) return
				vcube.datamediator.vmData[eventData.machineId].group_id = int(eventData.group)
				
			},

			'vboxMachineIconChanged' : function(eventData) {
				if(!vcube.datamediator.vmData[eventData.machineId]) return
				vcube.datamediator.vmData[eventData.machineId].icon = eventData.icon
			},

			
			'vboxExtraDataChanged' : function(eventData) {
			
				// No vm id is a global change
				if(!eventData.machineId || !vcube.vmdatamediator.vmData[eventData.machineId]) return;
				
					switch(eventData.key) {
		
						// Save mounted media changes at runtime
						case 'GUI/SaveMountedAtRuntime':
							if(vcube.vmdatamediator.vmDetailsData[eventData.machineId])
								vcube.vmdatamediator.vmDetailsData[eventData.machineId].GUI.SaveMountedAtRuntime = eventData.value;
							break;
							
						// First time run
						case 'GUI/FirstRun':
							if(vcube.vmdatamediator.vmDetailsData[eventData.machineId])
								vcube.vmdatamediator.vmDetailsData[eventData.machineId].GUI.FirstRun = eventData.value;
							break;
							
					}
			}

		});

		
		
		vcube.vmdatamediator.stores.Servers.on('load',function(){
			
			vcube.vmdatamediator.stores.VMGroups.on('load',function(){
				vcube.vmdatamediator.started.resolve();
			});
			vcube.vmdatamediator.stores.VMGroups.load();
			
			var validServers = vcube.vmdatamediator.stores.Servers.queryBy(function(record){
				return (record.get('status') == 100); 
			});
			Ext.each(validServers, function(serverRec) {
				vcube.utils.ajaxRequest('vbox/vboxGetMachines',{'server':serverRec.get('id')},function(vmlist){
					vcube.vmdatamediator.stores.VirtualMachines.loadData(vmlist);
				});
			});
			
		});
		vcube.vmdatamediator.stores.Servers.load();

		
		return vcube.vmdatamediator.started;
		
	},
	
	/**
	 * Return list of machines
	 * 
	 * @returns {Object} promise
	 */
	getVMList: function() {
	
		var vmList = [];
		for(var i in vcube.vmdatamediator.vmData) {
			if(typeof(i) == 'string') vmList.push(vcube.vmdatamediator.vmData[i]);
		}
		return vmList;
		
		
	},
	
	/**
	 * Get VM details data
	 * 
	 * @param vmid {String} ID of VM to get data for
	 * @param forceRefresh {Boolean} force refresh of VM data
	 * @returns {Object} vm data or promise
	 */
	getVMDetails: function(vmid, forceRefresh) {
		
		// Data exists
		if(vcube.vmdatamediator.vmDetailsData[vmid] && !forceRefresh) {
			vcube.vmdatamediator.promises.getVMDetails[vmid] = null;
			return vcube.vmdatamediator.vmDetailsData[vmid];
		}
		
		// Promise does not yet exist?
		if(!vcube.vmdatamediator.promises.getVMDetails[vmid]) {
			
			vcube.vmdatamediator.promises.getVMDetails[vmid] = Ext.create('Ext.ux.Deferred');

			Ext.ux.Deferred.when(vcube.utils.ajaxRequest('vbox/machineGetDetails',{vm:vmid,'server':vcube.vmdatamediator.vmData[vmid]._serverid})).done(function(d){
				
				vcube.vmdatamediator.vmDetailsData[d.id] = d;
				vcube.vmdatamediator.promises.getVMDetails[vmid].resolve(d);
			
			}).fail(function(){
			
				vcube.vmdatamediator.promises.getVMDetails[vmid].reject();
				vcube.vmdatamediator.promises.getVMDetails[vmid] = null;
			
			});

		}		
		return vcube.vmdatamediator.promises.getVMDetails[vmid];
	},
	
	/**
	 * Get VM's runtime data
	 * 
	 * @param vmid {String} ID of VM to get data for
	 * @returns {Object} VM runtime data or promise
	 */
	getVMRuntimeData: function(vmid) {

		// Data exists
		if(vcube.vmdatamediator.vmRuntimeData[vmid]) {
			vcube.vmdatamediator.promises.getVMRuntimeData[vmid] = null;
			return vcube.vmdatamediator.vmRuntimeData[vmid];
		}
		
		// Promise does not yet exist?
		if(!vcube.vmdatamediator.promises.getVMRuntimeData[vmid]) {
			
			vcube.vmdatamediator.promises.getVMRuntimeData[vmid] = Ext.create('Ext.ux.Deferred');

			Ext.ux.Deferred.when(vboxAjaxRequest('machineGetRuntimeData',{vm:vmid})).done(function(d){
				vcube.vmdatamediator.vmRuntimeData[d.id] = d;
				if(vcube.vmdatamediator.promises.getVMRuntimeData[vmid])
					vcube.vmdatamediator.promises.getVMRuntimeData[vmid].resolve(d);
			}).fail(function(){
				vcube.vmdatamediator.promises.getVMRuntimeData[vmid].reject();
				vcube.vmdatamediator.promises.getVMRuntimeData[vmid] = null;
			});

		}		
		return vcube.vmdatamediator.promises.getVMRuntimeData[vmid];
	},
	
	/**
	 * Return all data for a VM
	 * @param vmid {String} ID of VM to get data for
	 * @returns promise
	 */
	getVMDataCombined : function(vmid) {
		
		// Special case for 'host'
		if(vmid == 'host') {
			var def = Ext.create('Ext.ux.Deferred');
			Ext.ux.Deferred.when(vcube.vmdatamediator.getVMDetails(vmid)).done(function(d){
				def.resolve(d);
			}).fail(function(){
				def.reject();
			});
			return def;
		}
		
		if(!vcube.vmdatamediator.vmData[vmid]) return;
		
		var runtime = function() { return {};};
		if(vboxVMStates.isRunning({'state':vcube.vmdatamediator.vmData[vmid].state}) || vboxVMStates.isPaused({'state':vcube.vmdatamediator.vmData[vmid].state})) {
			runtime = vcube.vmdatamediator.getVMRuntimeData(vmid);
		}
		
		var def = Ext.create('Ext.ux.Deferred');
		Ext.ux.Deferred.when(vcube.vmdatamediator.getVMDetails(vmid), runtime, vcube.vmdatamediator.getVMData(vmid)).done(function(d1,d2,d3){
			def.resolve($.extend(true,{},d1,d2,d3));
		}).fail(function(){
			def.reject();
		});
		return def;
		
	},
	
	/**
	 * Get new VM data
	 * @param vmid {String} ID of VM to get data for
	 * @returns {Object} promise
	 */
	refreshVMData : function(vmid) {
		
		// Special case for host
		if(vmid == 'host') {
			$('#vboxPane').trigger('vboxMachineDataChanged', [{machineId:'host'}]);
			$('#vboxPane').trigger('vboxEvents', [[{eventType:'OnMachineDataChanged',machineId:'host'}]]);
			return;
		}
		
		if(!vcube.vmdatamediator.vmData[vmid]) return;
		
		var def = Ext.create('Ext.ux.Deferred');
		Ext.ux.Deferred.when(vboxAjaxRequest('vboxGetMachines',{'vm':vmid})).done(function(d) {
			vm = d[0];
			vcube.vmdatamediator.vmData[vm.id] = vm;
			def.resolve();
			$('#vboxPane').trigger('vboxMachineDataChanged', [{machineId:vm.id,enrichmentData:vm}]);
			$('#vboxPane').trigger('vboxEvents', [[{eventType:'OnMachineDataChanged',machineId:vm.id,enrichmentData:vm}]]);
		}).fail(function(){
			def.reject();
		});
		
		return def;
	}

});

