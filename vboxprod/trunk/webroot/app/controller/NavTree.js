/*
 * NavTree Controller
 */
Ext.define('vcube.controller.NavTree', {
    extend: 'Ext.app.Controller',
    
    // VMs and Groups
    stores: ['NavTreeGroups','NavTreeVMs'],
    
    // Hold nav tree ref so that we only have to get this once
    refs : [{
    	selector: 'viewport > NavTree',
    	ref: 'NavTreeView'
    }],
    
    /* Watch for events */
    init: function(){
    	
    	/* Application level events */
        this.application.on({
        	start: this.populateTree,
        	scope: this
        });
    	
        /* Tree events */
        this.control({
        	'viewport > NavTree' : {
        		select: this.selectItem
        	}
        });
    },
    
    
    /* An item is selected */
    selectItem: function(row,record,index,eOpts) {
    	console.log("Row");
    	console.log(row);
    	console.log("Record");
    	console.log(record);
    },
    

    /* Populate navigation tree  */
    populateTree: function() {
    	
    	var NavTreeView = this.getNavTreeView();    	
    	var NavTreeGroupsStore = this.getNavTreeGroupsStore();
    	var NavTreeVMsStore = this.getNavTreeVMsStore();
    	
    	// Show load mask
    	NavTreeView.setLoading();
    	
    	// Nav tree root reference
    	navTreeRoot = NavTreeView.getRootNode()
    	
    	// Add servers folder
    	serversFolder = navTreeRoot.createNode({'cls':'navTreeFolder','leaf':false,'text':'Servers','id':'servers'})
    	navTreeRoot.appendChild(serversFolder);

    	// Add virtual machines
    	vmsFolder = navTreeRoot.createNode({'cls':'navTreeFolder','leaf':false,'text':'Virtual Machines','id':'vms'})
    	navTreeRoot.appendChild(vmsFolder);

    	// Add templates folder
    	templatesFolder = navTreeRoot.createNode({'cls':'navTreeFolder','leaf':false,'text':'Templates','id':'templates'})
    	navTreeRoot.appendChild(templatesFolder);

    	var self = this;
    	
    	var availableServers = [];
    	
    	// Add servers function
    	function addServers() {
    		
    		self.application.ajaxRequest('connectors/getConnectors',{}, function(data) {
    			
    			for(var i = 0; i < data.length; i++) {
    				serversFolder.appendChild(serversFolder.createNode({
    					'iconCls':'navTreeIcon',
    					'icon': 'images/vbox/OSE/VirtualBox_cube_42px.png',
    					'leaf':true,
    					'text':data[i].name + ' (<span class="navTreeServerStatus">' + data[i].status_name + '</span>)',
    					'id' : 'server-' + data[i].id
    				}))
    				
    				// Add to available servers list if server is available
    				if(data[i].status == 100) {
    					availableServers[availableServers.length] = data[i].id;
    				}
    			}
    		})
    		
			// Expand folder
			serversFolder.expand()
			
			// Add groups
			addGroups()

    	}
    	
    	// Add VM groups
    	function addGroups() {
    		
    		self.application.ajaxRequest('vmgroups/getGroups',{}, function(data) {
    			
    			var nodeStore = NavTreeView.getStore();
    			
    			for(var i = 0; i < data.length; i++) {
    				
    				appendTarget = (data[i].parent_id ? nodeStore.getNodeById('vmgroup-' + data[i].parent_id) : vmsFolder);
    				if(!appendTarget) appendTarget = vmsFolder;
    				 
    				appendTarget.appendChild(appendTarget.createNode({
    					'iconCls':'navTreeIcon',
    					'leaf':false,
    					'text':data[i].name,
    					'id' : 'vmgroup-' + data[i].id
    				}))
    			}
    			
    			// Expand folder
    			vmsFolder.expand()
    			
    			// Add vms
    			for(var i = 0; i < availableServers.length; i++) {
    				console.log(i)
    				addVMs(availableServers[i]);
    			}
    			
    		})
    		
    	}
    	
    	// Get VMs
    	function addVMs(connectorid) {
    		
    		self.application.ajaxRequest('vbox/vboxGetMachines',{'server':connectorid}, function(data) {
    			
    			var nodeStore = NavTreeView.getStore();
    			
    			//data = data.vboxGetMachines_response
    			
    			for(var i = 0; i < data.length; i++) {
    				
    				appendTarget = (data[i].group_id ? nodeStore.getNodeById('vmgroup-' + data[i].group_id) : vmsFolder);
    				if(!appendTarget) appendTarget = vmsFolder;
    				 
    				appendTarget.appendChild(appendTarget.createNode({
    					'cls' : 'navTreeVM vmState' + (data[i].state) + ' vmSessionState' + data[i].sessionState + ' vmOSType' + data[i].OSTypeId,
            			'text' : '<span class="vmStateIcon"> </span>' + data[i].name,
            			'leaf' : true,
            			'icon' : 'images/vbox/' + vboxGuestOSTypeIcon(data[i].OSTypeId),
            			'iconCls' : 'navTreeIcon'
            		}))
    			}
    			
    			
    		})

    		
    	}
    	
    	addServers()
    	
    	NavTreeView.setLoading(false); return;
    	
    	// Function to sort records by order
    	var sortRecords = function(a,b) {
    		return (a.raw.order - b.raw.order);
    	}
    	
    	/* Function to load VMs */
    	var loadVMs = function() {
    		
    		
        	/* Set text name when adding item */
    		NavTreeVMsStore.on({
        		append: function(thisNode,newNode,index,eOpts) {
        			newNode.set('cls','navTreeVM vmState' + (newNode.raw.state) + ' vmSessionState' + newNode.raw.sessionState + ' vmOSType' + newNode.raw.OSTypeId);
        			newNode.set('text','<span class="vmStateIcon"> </span>' + newNode.raw.name);
        			newNode.set('leaf',true);
        			newNode.set('icon','images/vbox/' + vboxGuestOSTypeIcon(newNode.raw.OSTypeId));
        			newNode.set('iconCls', 'navTreeIcon');
        		}
        	}),

    		NavTreeVMsStore.load({callback:function(records) {
    			
        		// Sort by order
        		records.sort(sortRecords);

        		// Step through each VM adding it to the correct group
        		for(var i = 0; i < records.length; i++) {
        			var group = (records[i].raw.group ? NavTreeView.getStore().getNodeById(records[i].raw.group) : NavTreeView.getRootNode());
        			if(!group) group = NavTreeView.getRootNode();
        			group.appendChild(group.createNode(records[i]));        			
        		}

        		// expand tree
        		navTreeRoot.expand();
        		
        		// Hide load mask
        		NavTreeView.setLoading(false);
        		
        	}});

    	}
    	
    	
    	/* Set text name when adding item */
    	NavTreeGroupsStore.on({
    		append: function(thisNode,newNode,index,eOpts) {
    			newNode.set('text',newNode.raw.name);
    		}
    	}),

    	
    	NavTreeGroupsStore.load({callback:function(records) {
    		
    		// Sort by order
    		records.sort(sortRecords);
    		
    		var addChildren = function(parent_id,parent_node) {
    			var children = [];
    			for(var i = 0; i < records.length; i++) {
    				if(records[i].raw.parent_id == parent_id) {
    					children[children.length] = parent_node.createNode(records[i]);
    					parent_node.appendChild(children[(children.length-1)]);
    				}
    			}
    			for(var i = 0; i < children.length; i++) {
    				addChildren(children[i].raw.id, children[i]);
    			}
    		}
		
    		// Get top level
    		addChildren(0,navTreeRoot);
    		
    		// Now load VMs
    		loadVMs();
    		
    	}});
    	
    	
    }
    	
});