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
			scope : this
		
		});

		/* Tree events */
		this.control({
			
			'viewport > NavTree' : {
				
				render: function(tv) {
				
					tv.getView().on('drop', this.itemDropped, this);
					this.selectionModel = tv.getView().getSelectionModel();
					
			    	machineContextMenu = Ext.create('Ext.menu.Menu', {
			    	    renderTo: Ext.getBody(),
			    	    items: vcube.view.NavTree.machineContextMenuItems
			    	});

			    	var self = this;
			    	tv.on('itemcontextmenu',function(t,r,i,index,e) {
			    		e.stopEvent();
			    		switch(r.get('type')) {
			    			case 'vm':
			    				machineContextMenu.showAt(e.getXY());
			    			break;
			    		}

			    	});

				}
			}
		});
		

		/* Subscribe to storemanager events */
		
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
	onMachineGroupChanged: function(eventData) {
		
		var targetVM = this.navTreeStore.getNodeById(eventData.machineId);
		
		if(!eventData.group) eventData.group = "0";

		var targetGroup = this.navTreeStore.getNodeById('vmgroup-' + eventData.group);
		
		// TODO add group id to vm store
		if(!targetGroup || (eventData.group == targetGroup.raw.data.group_id)) return;
		
		targetGroup.appendChild(targetVM.remove(false));
		
		targetGroup.sort(this.sortCmp, false);
	},

	
	
	/*
	 * Sort function
	 */
	sortCmp: function(a, b) {
		
		if(a.get('type') == b.get('type')) {
			return vcube.utils.strnatcasecmp(a.get('name'), b.get('name'));
		} else if(a.get('type') == 'vm') {
			return 1;
		} else {
			return -1;
		}
	},
	
	/*
	 * Node (vm or vmgroup) is dropped
	 */
	itemDropped: function (node, droppedItems, dropRec, dropPosition) {
		
		var targetId = (dropRec.get('id') == 'vmsFolder' ? 0 : dropRec.get('rawid'));
		
		Ext.each(droppedItems.records, function(item){
			var itemid = item.get('rawid');
			if(item.get('type') == 'vm') {
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
	createServerNodeConfig : function(data) {

		return Ext.apply({
			leaf : true,
			allowDrag: false,
			allowDrop: false,
			
			rawid : data.id,
			type : 'server',
			id : 'server-' + data.id
		},vcube.view.NavTree.serverNodeConfig);
		
	},
	
	createVMNodeConfig : function(data) {

		return Ext.apply({
			id: 'vm'-data.id,
			rawid: data.id,
			type: 'vm',
			leaf: true
		},vcube.view.NavTree.vmNodeConfig);
	},
	
	createGroupNodeConfig: function(data) {

		return Ext.apply({
			leaf : false,
			expanded: true,
			id : 'vmgroup-' + data.id,
			type: 'vmgroup',
			rawid: data.id
		},vcube.view.NavTree.vmGroupNodeConfig);

	},
	
	/**
	 * Add server to Servers node
	 */
	addServer : function(data) {
		this.serversNode.appendChild(this.serversNode.createNode(this.createServerNodeConfig(data)));
	},

	/**
	 * Add a group to the VMs node
	 */
	addGroup : function(data) {

		appendTarget = (data.parent_id ? this.navTreeStore.getNodeById('vmgroup-'+ data.parent_id) : this.vmsNode);

		if (!appendTarget)
			appendTarget = this.vmsNode;

		appendTarget.appendChild(appendTarget.createNode(this.createGroupNodeConfig(data)));		


	},
	
	/**
	 * Add a VM somewhere under the VMs node
	 */
	addVM : function(data) {

		appendTarget = (data.group_id ? this.navTreeStore.getNodeById('vmgroup-' + data.group_id) : this.vmsNode);

		if (!appendTarget)
			appendTarget = this.vmsNode;

		appendTarget.appendChild(appendTarget.createNode(this.createVMNodeConfig(data)));

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
		this.serversNode = this.rootNode.createNode(Ext.apply({
			leaf : false,
			id : 'servers',
			allowDrag: false,
			allowDrop: false,
			type: 'serversFolder'
		}, vcube.view.NavTree.serversNodeConfig));
		
		this.rootNode.appendChild(this.serversNode);

		// Add virtual machines folder
		this.vmsNode = this.rootNode.createNode(Ext.apply({
			leaf : false,
			id : 'vmgroup-0',
			allowDrag: false,
			type: 'vmsFolder',
			rawid: 'vmgroup-0'
		}, vcube.view.NavTree.vmsNodeConfig));
		
		this.rootNode.appendChild(this.vmsNode);

		var self = this;

		/*
		 * 
		 * Load all tree data and subscribe to store changes
		 * 
		 */

		
		// Servers
		vcube.storemanager.getStore('server').each(function(record) {
			self.addServer(record.raw);
		});
		
		this.serversNode.expand();

		vcube.storemanager.getStore('server').on('add', this.onStoreRecordAdded, this, {type:'server'});
		vcube.storemanager.getStore('server').on('remove', this.onStoreRecordRemoved, this, {type:'server'});
		vcube.storemanager.getStore('server').on('update', this.onStoreRecordUpdated, this, {type:'server'});
		
		// VM Groups
		vcube.storemanager.getStore('vmgroup').each(function(record) {
			self.addGroup(record.raw);
		});
		
		this.vmsNode.expand();

		vcube.storemanager.getStore('vmgroup').on('add', this.onStoreRecordAdded, this, {type:'vmgroup'});
		vcube.storemanager.getStore('vmgroup').on('remove', this.onStoreRecordRemoved, this, {type:'vmgroup'});
		vcube.storemanager.getStore('vmgroup').on('update', this.onStoreRecordUpdated, this, {type:'vmgroup'});

		// VMs
		vcube.storemanager.getStore('vm').each(function(record) {
			self.addVM(record.raw);
		});
		
		vcube.storemanager.getStore('vm').on('add', this.onStoreRecordAdded, this, {type:'vm'});
		vcube.storemanager.getStore('vm').on('remove', this.onStoreRecordRemoved, this, {type:'vm'});
		vcube.storemanager.getStore('vm').on('update', this.onStoreRecordUpdated, this, {type:'vm'});
		
		
	}
});