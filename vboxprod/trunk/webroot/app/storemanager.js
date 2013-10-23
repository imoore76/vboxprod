Ext.define('vcube.storemanager',{

	singleton: true,
	
	vmRuntimeOverlay: null,

	/**
	 * Virtual machine store
	 */
	vmStore: Ext.create('Ext.data.Store',{
		extend: 'Ext.data.Store',
		autoload: false,
		fields : [
		      {name: 'id', type: 'string'},
		      {name: 'name', type: 'string'},
		      {name: 'description', type: 'string'},
		      {name: 'state', type: 'string'},
		      {name: 'sessionState', type: 'string'},
		      {name: 'OSTypeDesc', type: 'string'},
		      {name: 'OSTypeId', type: 'string'},
		      {name: 'lastStateChange', type: 'int'},
		      {name: 'connector_id', type: 'int'},
		      {name: 'icon', type: 'string'},
		      {name: 'group_id', type: 'int'},
		      {name: 'CPUCount', type: 'int'},
		      {name: 'memorySize', type: 'int'}
		],
		proxy: {
			type: 'vcubeAjax',
			url: 'app/getVirtualMachines',
	    	reader: {
	    		type: 'vcubeJsonReader'
	    	}
		}
	}),


	/**
	 * VM Group store
	 */
	vmGroupStore: Ext.create('Ext.data.Store',{
		extend: 'Ext.data.Store',
		autoload: false,
		fields : [
		      {name: 'id', type: 'int'},
		      {name: 'name', type: 'string'},
		      {name: 'description', type: 'string'},
		      {name: 'parent_id', type: 'int'}
		],
		proxy: {
			type: 'vcubeAjax',
			url: 'vmgroups/getGroups',
	    	reader: {
	    		type: 'vcubeJsonReader'
	    	}
		}
	}),


	/**
	 * Servers store
	 */
	serverStore: Ext.create('Ext.data.Store',{
		autoload: false,
		fields : [
		   {name: 'id', type: 'int'},
		   {name: 'name', type: 'string'},
		   {name: 'description', type: 'string'},
		   {name: 'location', type: 'string'},
		   {name: 'state_text', type: 'string'},
		   {name: 'state', type: 'int'}
		],
		proxy: {
			type: 'vcubeAjax',
			url: 'connectors/getConnectors',
	    	reader: {
	    		type: 'vcubeJsonReader'
	    	}
		}
	}),

	/**
	 * Return requested store
	 */
	getStore: function(type) {
		switch(type.toLowerCase()) {
			case 'vm':
				return vcube.storemanager.vmStore;
			case 'vmgroup':
				return vcube.storemanager.vmGroupStore;
			case 'server':
				return vcube.storemanager.serverStore;
			default:
				console.log("Unknown type: " + type);
		}
	},
	
	
	/**
	 * Update store if record exists
	 */
	updateStoreRecord: function(type, id, updates) {
		return vcube.storemanager.getStore(type).getById(id).update(updates);
	},
	
	/**
	 * Get a single store record by id
	 */
	getStoreRecord: function(type, id) {
		return vcube.storemanager.getStore(type).getById(id);
	},
	
	/**
	 * Get raw record data
	 */
	getStoreRecordRaw: function(type, id) {
		return vcube.storemanager.getStore(type).getById(id).raw;
	},
	
	/* Watch for "raw" events */
	start: function() {
		
		var promise = Ext.create('Ext.ux.Deferred');
		
		/*
		 * 
		 * VirtualBox events
		 * 
		 */
		
		var applyEnrichmentData = function(eventData) {
			vcube.storemanager.updateStoreRecord('vm', eventData.machineId, eventData.enrichmentData)			
		};
		
		vcube.app.on({
			
			/*
			 * Server / connector events
			 */
		    'ConnectorUpdated': function(eventData) {
		    	vcube.storemanager.updateStoreRecord('server', eventData.connector_id, eventData.connector);
		    },
		    
		    ConnectorStateChanged: function(eventData) {
		    	vcube.storemanager.updateStoreRecord('server', eventData.connector_id, {state:eventData.state, state_text: eventData.state_text});
		    },

		    /*
		     * VM Group events
		     */
			VMGroupAdded: function(eventData) {
				vcube.storemanager.getStore('vmgroup').add(eventData.group);
			},
			
			VMGroupRemoved: function(eventData) {
				var s = vcube.storemanager.getStore('vmgroup');
				s.remove(s.getById(eventData));
			},
			
			VMGroupUpdated: function(eventData) {
				vcube.storemanager.updateStoreRecord('vmgroup', eventData.group.id, eventData.group);
			},


		    /*
		     *	Machine events 
		     */
			
			// Machine data has changed
			'vboxMachineDataChanged' : applyEnrichmentData,
			
			// Snapshot events
			'vboxSnapshotTaken' : applyEnrichmentData,
			'vboxSnapshotDeleted' : applyEnrichmentData,
			'vboxSnapshotChanged' : applyEnrichmentData,

			// Machine state change
			'vboxMachineStateChanged' :function(eventData) {
				vcube.storemanager.updateStoreRecord('vm', eventData.machineId, Ext.apply({'state':eventData.state},eventData.enrichmentData));					
			},

			// Session state change
			'vboxSessionStateChanged' : function(eventData) {			
				vcube.storemanager.updateStoreRecord('vm', eventData.machineId,{sessionState:eventData.state});
			},

			
			// Remove vms from store
			'MachinesRemoved' : function(eventData) {
			
				var vmstore = vcube.storemanager.getStore('vm');
				
				Ext.each(eventData.machines, function(vmid){
					vmstore.remove(vmstore.getById(vmid));
				});
					
			},

			// Add VMs when machines are added
			'MachinesAdded' : function(eventData) {
				vcube.storemanager.getStore('vm').add(eventData.machines);
			},
			
			// Runtime CPU changed event
			'vboxCPUChanged' : function(eventData) {

				
				if(eventData.enrichmentData.add) {
					vcube.vmdatamediator.vmRuntimeData[eventData.machineId].CPUCount++;
				} else {
					vcube.vmdatamediator.vmRuntimeData[eventData.machineId].CPUCount--;
				}

			},
			
			// Runtime execution cap
			'vboxCPUExecutionCapChanged' : function(eventData) {
			
				if(vcube.vmdatamediator.vmRuntimeData[eventData.machineId]) {
					vcube.vmdatamediator.vmRuntimeData[eventData.machineId].CPUExecutionCap = eventData.executionCap;
				}

			},
			
			'vboxMachineGroupChanged' : function(eventData) {
				vcube.storemanager.updateStoreRecord('vm', eventData.machineId,{group_id:eventData.group});
			},

			'vboxMachineIconChanged' : function(eventData) {
				vcube.storemanager.updateStoreRecord('vm', eventData.machineId,{icon:eventData.icon});
			},
			
			
			
			scope: vcube.storemanager

		});
		
		var loadCount = 3;
		function loaded() {
			if(--loadCount == 0) {
				promise.resolve();
			}
		}
		
		vcube.storemanager.vmStore.load({callback:function(r,o,success) {
			if(success) loaded();
		}});
		vcube.storemanager.vmGroupStore.load({callback:function(r,o,success) {
			if(success) loaded();
		}});
		vcube.storemanager.serverStore.load({callback:function(r,o,success) {
			if(success) loaded();
		}});
		
		return promise;

	}

});