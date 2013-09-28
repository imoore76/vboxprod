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
	
	VMGroupAdded: function(newgroup) {
		this.loadGroupsData([newgroup]);
	},
	
	VMGroupRemoved: function(eventData) {
		var targetGroup = this.navTreeStore.getNodeById('vmgroup-' + eventData.id);
		targetGroup.remove(true);
	},
	
	VMGroupUpdated: function(eventData) {
		var targetGroup = this.navTreeStore.getNodeById('vmgroup-' + eventData.id);
		var props = ['name','description','parent_id','order'];
		for(var i = 0; i < props.length; i++) {
			
		}
	},
	
	/*
	 * Data loading functions
	 * 
	 */
	loadServersData : function(data) {

		vboxServers = data;

		for ( var i = 0; i < data.length; i++) {

			data[i]._type = 'server';
			data[i].server_id = data[i].id;
			data[i].id = 'server-' + data[i].id;

			this.serversNode.appendChild(this.serversNode.createNode({
				iconCls : 'navTreeIcon',
				icon : 'images/vbox/OSE/VirtualBox_cube_42px.png',
				leaf : true,
				allowDrag: false,
				allowDrop: false,
				text : data[i].name
						+ ' (<span class="navTreeServerStatus">'
						+ data[i].status_name
						+ '</span>)',
				data : data[i]
			}));

		}

		// Expand folder
		this.serversNode.expand()

	},

	loadGroupsData : function(data) {

		for ( var i = 0; i < data.length; i++) {

			appendTarget = (data[i].parent_id ? this.navTreeStore.getNodeById('vmgroup-'+ data[i].parent_id) : this.vmsNode);

			if (!appendTarget)
				appendTarget = this.vmsNode;

			data[i]._type = 'vmgroup';
			data[i].group_id = data[i].id;
			data[i].id = 'vmgroup-' + data[i].id;

			appendTarget.appendChild(appendTarget.createNode({
				'iconCls' : 'navTreeIcon',
				'leaf' : false,
				'text' : data[i].name,
				'id' : 'vmgroup-' + data[i].id,
				'data' : data[i]
			}))
		}

		// Expand folder
		this.vmsNode.expand()

	},

	loadVMsData : function(data) {

		for ( var i = 0; i < data.length; i++) {

			data[i]._type = 'vm';

			appendTarget = (data[i].group_id ? this.navTreeStore
					.getNodeById('vmgroup-'
							+ data[i].group_id) : this.vmsNode);
			if (!appendTarget)
				appendTarget = this.vmsNode;

			appendTarget.appendChild(appendTarget.createNode({
				cls : 'navTreeVM vmState'+ data[i].state+ ' vmSessionState' + data[i].sessionState
						+ ' vmOSType' + data[i].OSTypeId,
				text : '<span class="vmStateIcon"> </span>' + data[i].name,
				leaf : true,
				icon : (data[i].customIcon ? data[i].customIcon : 'images/vbox/' + vcube.utils.vboxGuestOSTypeIcon(data[i].OSTypeId)),
				iconCls : 'navTreeIcon',
				id : 'vm-' + data[i].id,
				data : data[i]
			}));

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