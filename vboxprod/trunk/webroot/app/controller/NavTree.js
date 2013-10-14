/*
 * NavTree Controller
 */
Ext.define('vcube.controller.NavTree', {
	
	extend : 'Ext.app.Controller',

	// Hold nav tree ref so that we only have to get this once
	refs : [ {
		selector : 'viewport > NavTree',
		ref : 'NavTreeView'
	} ],

	/* Watch for events */
	init : function() {

		/* Application level events */
		this.application.on({
			
			start : this.populateTree,
			
			MachineGroupChanged: this.onMachineGroupChanged,
			MachineIconChanged: this.onMachineIconChanged,
			MachineDataChanged: this.onMachineDataChanged,
			
			VMGroupAdded: this.onVMGroupAdded,
			VMGroupRemoved: this.onVMGroupRemoved,
			VMGroupUpdated: this.onVMGroupUpdated,
			
			ConnectorStateChanged: this.onConnectorStateChanged,
			ConnectorUpdated: this.onConnectorUpdated,
			
			MachinesAdded: this.onMachinesAdded,
			MachinesRemoved: this.onMachinesRemoved,
			
			scope : this
		
		});

		/* Tree events */
		this.control({
			'viewport > NavTree' : {
				render: function(tv) {
					tv.getView().on('drop', this.itemDropped, this);
					this.selectionModel = tv.getView().getSelectionModel();
				}
			}
		});
		

	},
	
	/** Common refs */
	navTreeView : null,
	navTreeStore : null,
	rootNode : null,
	serversNode : null,
	vmsNode : null,
	selectionModel: null,

	/*
	 * App Events
	 */
	onMachinesAdded: function(eventData) {

		var sortIds = {};
		var sortList = [];
		
		for ( var i = 0; i < eventData.machines.length; i++) {

			appendTarget = (eventData.machines[i].group_id ? this.navTreeStore.getNodeById('vmgroup-' + eventData.machines[i].group_id) : this.vmsNode);

			if (!appendTarget)
				appendTarget = this.vmsNode;

			appendTarget.appendChild(appendTarget.createNode(this.createVMNodeCfg(eventData.machines[i])));
			
			if(!sortIds[appendTarget.id]) {
				sortList.push(appendTarget);
				sortIds[appendTarget.id] = true;
			}


		}
		
		for(var i = 0; i < sortList.length; i++) {
			sortList[i].sort(this.sortCmp, false);
		}
	},

	onMachinesRemoved: function(eventData) {
		for(var i = 0; i < eventData.machines.length; i++) {
			this.navTreeStore.getNodeById('vm-' + eventData.machines[i]).remove(true);
		}
	},

	onMachineGroupChanged: function(eventData) {
		
		var targetVM = this.navTreeStore.getNodeById('vm-'+ eventData.machineId);
		
		if(!eventData.group) eventData.group = "0";

		var targetGroup = this.navTreeStore.getNodeById('vmgroup-' + eventData.group);
		
		if(!targetGroup || (eventData.group == targetGroup.raw.data.group_id)) return;
		
		targetGroup.appendChild(targetVM.remove(false));
		
		targetGroup.sort(this.sortCmp, false);
	},

	onMachineDataChanged: function(eventData) {

		var oldVM = this.navTreeStore.getNodeById('vm-' + eventData.machineId);
		var newData = this.createVMNodeCfg(eventData.enrichmentData);
		
		for(var k in newData) {
			if(typeof(k) == 'string')
				oldVM.set(k, newData[k]);
		}
		oldVM.parentNode.sort(this.sortCmp, false);
		
	},
	
	onMachineIconChanged: function(eventData) {
		var vmData = vcube.vmdatamediator.getVMData(eventData.machineId);
		this.navTreeStore.getNodeById('vm-'+ eventData.machineId).set('icon', this.vmNodeIcon(vmData));
	},

	onVMGroupAdded: function(eventData) {
		
		appendTarget = (eventData.group.parent_id ? this.navTreeStore.getNodeById('vmgroup-'+ eventData.group.parent_id) : this.vmsNode);

		if (!appendTarget)
			appendTarget = this.vmsNode;

		appendTarget.appendChild(appendTarget.createNode(this.createGroupNodeCfg(eventData.group)));
		appendTarget.sort(this.sortCmp, false);

	},
	
	onVMGroupRemoved: function(eventData) {
		
		var targetNode = this.navTreeStore.getNodeById('vmgroup-' + eventData.group_id);
		
		if(!targetNode) return;

		if(targetNode.childNodes.length) {
			
			var n = targetNode.getChildAt(0);
			do {
				targetNode.parentNode.appendChild(n.remove());
				n = targetNode.getChildAt(0);				
			} while(n);
			
			targetNode.parentNode.sort(this.sortCmp, false);
		}
		
		
		targetNode.remove(true);
	},
	
	onVMGroupUpdated: function(eventData) {

		var oldGroup = this.navTreeStore.getNodeById('vmgroup-' + eventData.group.id);

		var newData = this.createGroupNodeCfg(eventData.group);
		for(var k in newData) {
			if(typeof(k) == 'string')
				oldGroup.set(k, newData[k]);
		}
		oldGroup.parentNode.sort(this.sortCmp, false);
	},
	
	onConnectorStateChanged: function(eventData) {

		var serverNode = this.navTreeStore.getNodeById('server-' + eventData.connector_id);
		if(!serverNode) return;
		
		var newServerData = Ext.Object.merge(serverNode.raw.data, {state:eventData.state, state_text: eventData.state_text});
		
		serverNode.set(this.createServerNodeCfg(newServerData));
		serverNode.parentNode.sort(this.sortCmp, false);

	},
	
	onConnectorUpdated: function(eventData) {

		var serverNode = this.navTreeStore.getNodeById('server-' + eventData.connector_id);
		if(!serverNode) return;
		
		var newServerData = Ext.Object.merge(serverNode.raw.data, eventData.connector);

		serverNode.set(this.createServerNodeCfg(newServerData));
		serverNode.parentNode.sort(this.sortCmp, false);

	},
	
	/*
	 * Sort function
	 */
	sortCmp: function(a, b) {
		
		if(a.raw.data._type == b.raw.data._type) {
			return vcube.utils.strnatcasecmp(a.raw.data.name, b.raw.data.name);
		} else if(a.raw.data._type == 'vm') {
			return 1;
		} else {
			return -1;
		}
	},
	
	/*
	 * Node (vm or vmgroup) is dropped
	 */
	itemDropped: function (node, droppedItems, dropRec, dropPosition) {
		
		var targetId = (dropRec.raw.id == 'vms' ? 0 : dropRec.raw.data.id);
		
		Ext.each(droppedItems.records, function(item){
			var itemid = item.raw.data.id;
			if(item.raw.data._type == 'vm') {
				vcube.utils.ajaxRequest('vbox/machineSetGroup',Ext.apply({'group':targetId},vcube.utils.vmAjaxParams(itemid)));
			} else {
				vcube.utils.ajaxRequest('vmgroups/updateGroup',{'id':itemid,'parent_id':targetId});
			}
		});
		
		dropRec.sort(this.sortCmp, false);
    },
	
	/*
	 * Data loading functions
	 * 
	 */
	createServerNodeCfg : function(server) {

		data = Ext.apply({},server);
		
		data._type = 'server';

		return {
			iconCls : 'navTreeIcon',
			icon : 'images/vbox/OSE/VirtualBox_cube_42px.png',
			leaf : true,
			allowDrag: false,
			allowDrop: false,
			text : Ext.String.htmlEncode(data.name)
					+ ' (<span class="navTreeServerStatus">'
					+ vcube.app.constants.CONNECTOR_STATES_TEXT[data.state]
					+ '</span>)',
			data : data,
			id : 'server-' + data.id
		};
		
	},
	
	vmNodeIcon : function(vmData) {
		return (vmData.icon ? vmData.icon : 'images/vbox/' + vcube.utils.vboxGuestOSTypeIcon(vmData.OSTypeId));
	},
	
	createVMNodeCfg : function(vm) {

		data = Ext.apply({},vm);
		
		data._type = 'vm';
		
		return {
			cls : 'navTreeVM vmState'+ data.state+ ' vmSessionState' + data.sessionState
					+ ' vmOSType' + data.OSTypeId,
			text : data.name,
			/*+ '<span class="navTreeVMState">'+
				'<img src="images/vbox/'+vcube.utils.vboxMachineStateIcon(vm.state) +
				'" height=16 width=16 valign=top style="margin-left: 24px"/></span>',*/
			leaf : true,
			icon : this.vmNodeIcon(data),
			iconCls : 'navTreeIcon',
			id : 'vm-' + data.id,
			data : data
		};

	},
	createGroupNodeCfg: function(group) {

		data = Ext.apply({},group);		
		data._type = 'vmgroup';
		
		return {
			iconCls : 'navTreeIcon',
			leaf : false,
			text : Ext.String.htmlEncode(data.name),
			expanded: true,
			id : 'vmgroup-' + data.id,
			data : data
		};

	},
	loadServersData : function(data) {

		for ( var i = 0; i < data.length; i++) {
			this.serversNode.appendChild(this.serversNode.createNode(this.createServerNodeCfg(data[i])));
		}

		// Expand folder
		this.serversNode.expand()

	},

	loadGroupsData : function(data) {

		for ( var i = 0; i < data.length; i++) {

			appendTarget = (data[i].parent_id ? this.navTreeStore.getNodeById('vmgroup-'+ data[i].parent_id) : this.vmsNode);

			if (!appendTarget)
				appendTarget = this.vmsNode;

			appendTarget.appendChild(appendTarget.createNode(this.createGroupNodeCfg(data[i])));
		}

		// Expand folder
		this.vmsNode.expand();
		


	},

	loadVMsData : function(data) {

		for ( var i = 0; i < data.length; i++) {

			appendTarget = (data[i].group_id ? this.navTreeStore.getNodeById('vmgroup-' + data[i].group_id) : this.vmsNode);

			if (!appendTarget)
				appendTarget = this.vmsNode;

			appendTarget.appendChild(appendTarget.createNode(this.createVMNodeCfg(data[i])));

		}

	},


	/* Populate navigation tree */
	populateTree : function() {

		this.navTreeView = this.getNavTreeView();
		this.navTreeStore = this.navTreeView.getStore();
		
		// Show load mask
		this.navTreeView.setLoading();

		// Nav tree root reference
		this.rootNode = this.navTreeView.getRootNode();
		

		// Add servers folder
		this.serversNode = this.rootNode.createNode({
			cls : 'navTreeFolder',
			leaf : false,
			text : 'Servers',
			id : 'servers',
			allowDrag: false,
			allowDrop: false,
			data : {_type : 'serversFolder'}
		});
		this.rootNode.appendChild(this.serversNode);

		// Add virtual machines
		this.vmsNode = this.rootNode.createNode({
			cls : 'navTreeFolder',
			leaf : false,
			text : 'Virtual Machines',
			id : 'vmgroup-0',
			allowDrag: false,
			data : { _type : 'vmsFolder'}
		});
		this.rootNode.appendChild(this.vmsNode);

		var self = this;
		var vboxServers = []


		/*
		 * 
		 * Load all tree data
		 * 
		 */

		Ext.ux.Deferred.when(vcube.utils.ajaxRequest('connectors/getConnectors')).then(function(data) {

			self.loadServersData(data);

			Ext.ux.Deferred.when(vcube.utils.ajaxRequest('vmgroups/getGroups')).then(function(data) {

				self.loadGroupsData(data);

				self.loadVMsData(vcube.vmdatamediator.getVMList());
				
				self.vmsNode.sort(self.sortCmp, true);

				self.navTreeView.setLoading(false);

			});

		});


	}
});