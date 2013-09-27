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
	
	
	/**
	 * Get basic vm data
	 * 
	 * @param vmid {String} ID of VM
	 * @returns {Object} vm data
	 */
	getVMData: function(vmid) {
		
		// VMList must exist
		if(!vcube.vmdatamediator.vmData) {
			vcube.app.alert('vmdatamediator: getVMData called before a VM list exists!');
			return;
		}
		
		return vcube.vmdatamediator.vmData[vmid];
		
	},
	
	/**
	 * Start data mediator
	 */
	start: function() {
		
		if(vcube.vmdatamediator.running) {
			vcube.app.alert('vmdatamediator: start() called when already running');
		}
		
		vcube.vmdatamediator.running = true;
		
		var started = Ext.create('Ext.ux.Deferred');
		
		// Get server list
		Ext.ux.Deferred.when(vcube.app.ajaxRequest('connectors/getConnectors')).then(function(data){
			
			loadFromServers = [];
			for(var i = 0; i < data.length; i++) {
				
				vcube.vmdatamediator.gotVMsFromServers[data[i].id] = Ext.create('Ext.ux.Deferred');
				
				if(data[i].status == 100) {
					
					loadFromServers.push(vcube.app.ajaxRequest('vbox/vboxGetMachines',{'server':data[i].id},function(vmlist, ajaxArgs) {
						
						vcube.vmdatamediator.gotVMsFromServers[ajaxArgs.server].resolve();
						
						
						for(var i = 0; i < vmlist.length; i++) {
							vmlist[i]._serverid = ajaxArgs.server;
							vcube.vmdatamediator.vmData[vmlist[i].id] = vmlist[i];
						}
						console.log(vcube.vmdatamediator.vmData);
						
					}));
				}
			}
			
			if(loadFromServers.length) {					
				
				Ext.ux.Deferred.when.apply(null, loadFromServers).then(function() {					
					started.resolve();
				});
				
			} else {
				started.resolve();
			}
		});

		
		return started; 
		
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
			
			Ext.ux.Deferred.when(vcube.app.ajaxRequest('vbox/machineGetDetails',{vm:vmid,'server':vcube.vmdatamediator.vmData[vmid]._serverid})).done(function(d){
				
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
			$('#vboxPane').trigger('vboxOnMachineDataChanged', [{machineId:'host'}]);
			$('#vboxPane').trigger('vboxEvents', [[{eventType:'OnMachineDataChanged',machineId:'host'}]]);
			return;
		}
		
		if(!vcube.vmdatamediator.vmData[vmid]) return;
		
		var def = Ext.create('Ext.ux.Deferred');
		Ext.ux.Deferred.when(vboxAjaxRequest('vboxGetMachines',{'vm':vmid})).done(function(d) {
			vm = d[0];
			vcube.vmdatamediator.vmData[vm.id] = vm;
			def.resolve();
			$('#vboxPane').trigger('vboxOnMachineDataChanged', [{machineId:vm.id,enrichmentData:vm}]);
			$('#vboxPane').trigger('vboxEvents', [[{eventType:'OnMachineDataChanged',machineId:vm.id,enrichmentData:vm}]]);
		}).fail(function(){
			def.reject();
		});
		
		return def;
	}

});

/*
 * 
 * VirtualBox events
 * 
 */

// Raw event to data handlers
Ext.get(document).on('vboxOnMachineDataChanged',function(e, eventData) {
	
	vcube.vmdatamediator.expireVMDetails(eventData.machineId);
	vcube.vmdatamediator.expireVMRuntimeData(eventData.machineId);
	
	if(vcube.vmdatamediator.vmData[eventData.machineId] && eventData.enrichmentData) {
		$.extend(true, vcube.vmdatamediator.vmData[eventData.machineId], eventData.enrichmentData);
		// $.extend doesn't seem to handle this for some reason
		vcube.vmdatamediator.vmData[eventData.machineId].groups = eventData.enrichmentData.groups; 
	}

// Machine state change
}).on('vboxOnMachineStateChanged', function(e, eventData) {

	// Only care about it if its in our list
	if(vcube.vmdatamediator.vmData[eventData.machineId]) {
		
		vcube.vmdatamediator.vmData[eventData.machineId].state = eventData.state;
		vcube.vmdatamediator.vmData[eventData.machineId].lastStateChange = eventData.enrichmentData.lastStateChange;
		vcube.vmdatamediator.vmData[eventData.machineId].currentStateModified = eventData.enrichmentData.currentStateModified;
		
		// If it's running, subscribe to its events
		if(vboxVMStates.isRunning({'state':eventData.state}) || vboxVMStates.isPaused({'state':eventData.state})) {
			
			// If we already have runtime data, assume we were already subscribed
			if(!vcube.vmdatamediator.vmRuntimeData[eventData.machineId]) {
				
				// Tell event listener to subscribe to this machine's events
				vboxEventListener.subscribeVMEvents(eventData.machineId);
			}
			
		} else {
			vcube.vmdatamediator.expireVMRuntimeData(eventData.machineId);
		}
	}
	
// Session state change
}).on('vboxOnSessionStateChanged', function(e, eventData) {
	
	if(vcube.vmdatamediator.vmData[eventData.machineId])
		vcube.vmdatamediator.vmData[eventData.machineId].sessionState = eventData.state;


// Snapshot changed
}).on('vboxOnSnapshotTaken vboxOnSnapshotDeleted vboxOnSnapshotChanged',function(e,eventData) {
	
	if(vcube.vmdatamediator.vmData[eventData.machineId]) {
		
		vcube.vmdatamediator.vmData[eventData.machineId].currentSnapshotName = eventData.enrichmentData.currentSnapshotName;
		vcube.vmdatamediator.vmData[eventData.machineId].currentStateModified = eventData.enrichmentData.currentStateModified;
		
		// Get media again
		Ext.ux.Deferred.when(vboxAjaxRequest('vboxGetMedia')).done(function(d){$('#vboxPane').data('vboxMedia',d);});
		
	}
	if(vcube.vmdatamediator.vmDetailsData[eventData.machineId])
		vcube.vmdatamediator.vmDetailsData[eventData.machineId].snapshotCount = eventData.enrichmentData.snapshotCount;
	
// Expire all data for a VM when machine is unregistered
}).on('vboxOnMachineRegistered', function(e, eventData) {
	
	if(!eventData.registered) {
		vcube.vmdatamediator.expireVMDetails(eventData.machineId);
		vcube.vmdatamediator.expireVMRuntimeData(eventData.machineId);
		vcube.vmdatamediator.vmData[eventData.machineId] = null;
		
	} else if(eventData.enrichmentData) {
	
		// Enforce VM ownership
	    if($('#vboxPane').data('vboxConfig').enforceVMOwnership && !$('#vboxPane').data('vboxSession').admin && eventData.enrichmentData.owner != $('#vboxPane').data('vboxSession').user) {
	    	return;
	    }
	    
	    vcube.vmdatamediator.vmData[eventData.enrichmentData.id] = eventData.enrichmentData;

	}

//}).on('vboxOnCPUChanged', function(e, vmid) {

	/*
	case 'OnCPUChanged':
		$data['cpu'] = $eventDataObject->cpu;
		$data['add'] = $eventDataObject->add;
		$data['dedupId'] .= '-' . $data['cpu'];
		break;
	*/

}).on('vboxOnNetworkAdapterChanged', function(e, eventData) {
	
	if(vcube.vmdatamediator.vmRuntimeData[eventData.machineId]) {
		$.extend(vcube.vmdatamediator.vmRuntimeData[eventData.machineId].networkAdapters[eventData.networkAdapterSlot], eventData.enrichmentData);
	}
	

/* Storage controller of VM changed */
//}).on('vboxOnStorageControllerChanged', function() {
	/*
    case 'OnStorageControllerChanged':
    	$data['machineId'] = $eventDataObject->machineId;
    	$data['dedupId'] .= '-'. $data['machineId'];
    	break;
    */
	
}).on('vboxOnMediumChanged', function(e, eventData) {
	
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
	
/* Shared folders changed */
//}).on('vboxOnSharedFolderChanged', function() {

// VRDE runtime info
}).on('vboxOnVRDEServerChanged', function(e, eventData) {

	if(vcube.vmdatamediator.vmRuntimeData[eventData.machineId]) {
		$.extend(true,vcube.vmdatamediator.vmRuntimeData[eventData.machineId].VRDEServer, eventData.enrichmentData);
	}


// This only fires when it is enabled
}).on('vboxOnVRDEServerInfoChanged', function(e, eventData) {

	if(vcube.vmdatamediator.vmRuntimeData[eventData.machineId]) {
		vcube.vmdatamediator.vmRuntimeData[eventData.machineId].VRDEServerInfo.port = eventData.enrichmentData.port;
		vcube.vmdatamediator.vmRuntimeData[eventData.machineId].VRDEServer.enabled = eventData.enrichmentData.enabled;
	}

	
// Execution cap
}).on('vboxOnCPUExecutionCapChanged', function(e, eventData) {
	
	if(vcube.vmdatamediator.vmRuntimeData[eventData.machineId]) {
		vcube.vmdatamediator.vmRuntimeData[eventData.machineId].CPUExecutionCap = eventData.executionCap;
	}

// Special cases for where phpvirtualbox keeps its extra data
}).on('vboxOnExtraDataChanged', function(e, eventData) {
	
	// No vm id is a global change
	if(!eventData.machineId || !vcube.vmdatamediator.vmData[eventData.machineId]) return;
	
	switch(eventData.key) {

		// Startup mode
		case 'pvbx/startupMode':
			if(vcube.vmdatamediator.vmDetailsData[eventData.machineId])
				vcube.vmdatamediator.vmDetailsData[eventData.machineId].startupMode = eventData.value;
			break;
		
		// Owner
		case 'phpvb/sso/owner':
			vcube.vmdatamediator.vmData[eventData.machineId].owner = eventData.value;
			break;
		
		// Custom icon
		case 'phpvb/icon':
			
			vcube.vmdatamediator.vmData[eventData.machineId].customIcon = eventData.value;
			
			if(vcube.vmdatamediator.vmDetailsData[eventData.machineId])
				vcube.vmdatamediator.vmDetailsData[eventData.machineId].customIcon = eventData.value;
			
			
			break;
		
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
	
	
/*
 * 
 * phpVirtualBox events
 * 
 */
	
// Expire everything when host changes
}).on('hostChange',function(){
	vcube.vmdatamediator.expireAll();

});
