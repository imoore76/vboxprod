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
		      {name: 'parent_id': type: 'int'}
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
				return this.vmStore;
			case 'vmgroup':
				return this.vmGroupStore;
			case 'server':
				return this.serverStore;
		}
	},
	
	
	/**
	 * Update store if record exists
	 */
	updateStoreItem(type, id, updates) {
		this.getStore(type).getById(id).update(updates);
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
			this.updateStoreItem('vm', eventData.machineId, eventData.enrichmentData)			
		};
		
		// Machine events
		vcube.app.on({
			
			
			// Machine data has changed
			'vboxMachineDataChanged' : applyEnrichmentData,
			
			// Snapshot changed
			'vboxSnapshotTaken' : snapshotEvent,
			'vboxSnapshotDeleted' : snapshotEvent,
			'vboxSnapshotChanged' : snapshotEvent,

			// Machine state change
			'vboxMachineStateChanged' :function(eventData) {
				this.updateStoreItem('vm', eventData.machineId, Ext.apply({'state':eventData.state},eventData.enrichmentData));					
			},

			// Session state change
			'vboxSessionStateChanged' : function(eventData) {			
				this.updateStoreItem('vm', eventData.machineId,{sessionState:eventData.state});
			},

			
			// Remove vms from store
			'MachinesRemoved' : function(eventData) {
			
				var vmstore = this.getStore('vm');
				
				Ext.each(eventData.machines, function(vmid){
					vmstore.remove(vmstore.getById(vmid));
				});
					
			},

			// Add VMs when machines are added
			'MachinesAdded' : function(eventData) {
				this.getStore('vm').add(eventData.machines);
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
				this.updateStoreItem('vm', eventData.machineId,{group_id:eventData.group});
			},

			'vboxMachineIconChanged' : function(eventData) {
				this.updateStoreItem('vm', eventData.machineId,{icon:eventData.icon});
			}

		});
		
		var loadList = 3;
		function loaded() {
			if(loadList-- == 0) promise.resolve();
		}
		
		this.vmStore.load({callback:function(r,o,success) {
			if(success) loaded();
		}});
		this.vmGroupStore.load({callback:function(r,o,success) {
			if(success) loaded();
		}});
		this.serverStore.load({callback:function(r,o,success) {
			if(success) loaded();
		}});
		
		return promise;

	}

});