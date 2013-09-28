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
			
			MachineGroupChanged: this.MachineGroupChanged,
			
			VMGroupAdded: this.VMGroupAdded,
			VMGroupRemoved: this.VMGroupRemoved,
			VMGroupUpdated: this.VMGroupUpdated,
			
			scope : this
		
		});

		/* Tree events */
		this.control({
			'viewport > NavTree' : {
				select : this.selectItem
			}
		});

	},
	
	/** Common refs */
	navTreeView : null,
	navTreeStore : null,
	rootNode : null,
	serversNode : null,
	vmsNode : null,

	/*
	 * Events
	 */
	MachineGroupChanged: function(eventData) {
		
		var targetVM = this.navTreeStore.getNodeById('vm-'+ eventData.machineId);

		var targetGroup = this.navTreeStore.getNodeById('vmgroup-' + eventData.group);
		
		console.log(this.navTreeStore.getById('vmgroup-' + eventData.group));
		
		if(!(targetVM && targetGroup)) return;
		
		targetVM = targetVM.remove(false);
		targetGroup.appendChild(targetVM);
	},
	
	VMGroupAdded: function(eventData) {
		this.loadGroupsData([eventData.group]);
	},
	
	VMGroupRemoved: function(eventData) {
		var targetGroup = this.navTreeStore.getById('vmgroup-' + eventData.group_id);
		targetGroup.remove(true);
	},
	
	VMGroupUpdated: function(eventData) {

		var oldGroup = this.navTreeStore.getNodeById('vmgroup-' + eventData.group.id);

		var newData = this.createGroupNodeCfg(eventData.group);
		for(var k in newData) {
			if(typeof(k) == 'string')
				oldGroup.set(k, newData[k]);
		}
	},
	
	/*
	 * Data loading functions
	 * 
	 */
	createServerNodeCfg : function(server) {

		data = Ext.apply({},server);
		
		data._type = 'server';
		data.server_id = data.id;
		data.id = 'server-' + data.id;

		return {
			iconCls : 'navTreeIcon',
			icon : 'images/vbox/OSE/VirtualBox_cube_42px.png',
			leaf : true,
			allowDrag: false,
			allowDrop: false,
			text : data.name
					+ ' (<span class="navTreeServerStatus">'
					+ data.status_name
					+ '</span>)',
			data : data,
			id : data.id
		};
		
	},
	createVMNodeCfg : function(vm) {

		data = Ext.apply({},vm);
		
		data._type = 'vm';
		data.vm_id = data.id;
		data.id = 'vm-' + data.id;
		
		return {
			cls : 'navTreeVM vmState'+ data.state+ ' vmSessionState' + data.sessionState
					+ ' vmOSType' + data.OSTypeId,
			text : '<span class="vmStateIcon"> </span>' + data.name,
			leaf : true,
			icon : (data.customIcon ? data.customIcon : 'images/vbox/' + vcube.utils.vboxGuestOSTypeIcon(data.OSTypeId)),
			iconCls : 'navTreeIcon',
			id : data.id,
			data : data
		};

	},
	createGroupNodeCfg: function(group) {

		data = Ext.apply({},group);
		
		data._type = 'vmgroup';
		data.group_id = data.id;
		data.id = 'vmgroup-' + data.id;

		return {
			iconCls : 'navTreeIcon',
			leaf : false,
			text : data.name,
			id : data.id,
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
		this.vmsNode.expand()

	},

	loadVMsData : function(data) {

		for ( var i = 0; i < data.length; i++) {

			appendTarget = (data[i].group_id ? this.navTreeStore
					.getNodeById('vmgroup-'
							+ data[i].group_id) : this.vmsNode);
			if (!appendTarget)
				appendTarget = this.vmsNode;

			appendTarget.appendChild(appendTarget.createNode(this.createVMNodeCfg(data[i])));

		}

	},

	/* An item is selected */
	selectItem : function(row, record, index, eOpts) {
		// console.log("Record");
		// console.log(record);
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
			id : 'vms',
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

		Ext.ux.Deferred.when(vcube.app.ajaxRequest('connectors/getConnectors')).then(function(data) {

			self.loadServersData(data);

			Ext.ux.Deferred.when(vcube.app.ajaxRequest('vmgroups/getGroups')).then(function(data) {

				self.loadGroupsData(data);

				self.loadVMsData(vcube.vmdatamediator.getVMList());

				self.navTreeView.setLoading(false);

			});

		});


	}
});