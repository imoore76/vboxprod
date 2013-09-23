/*
 * NavTree Controller
 */
Ext.define('vcube.controller.NavTree', {
    extend: 'Ext.app.Controller',
    
    // VMs and Groups
    stores: ['NavTreeGroups','NavTreeVMs', 'ServerList'],
    
    // Hold nav tree ref so that we only have to get this once
    refs : [{
    	selector: 'viewport > NavTree',
    	ref: 'NavTreeView'
    }],
    
    /* Watch for events */
    init: function(){
    	
    	/* Application level events */
        this.application.on({
        	start: this.populateServers,
            serverChanged: this.populateTree, 
            scope: this
        },{
        	launch: this.showWelcome,
        	scope: this
        });
        
        /* Tree events */
        this.control({
        	'viewport > NavTree' : {
        		select: this.selectItem
        	},
        	'viewport > NavTree #serverlist' : {
        		select: this.serverChange
        	}
        });
    },
    
    /* Server selected from list */
    serverChange: function(cbox, val) {
    	console.log(val);
    	this.application.setVboxServer(val[0].data.id);
    },
    
    /* An item is selected */
    selectItem: function(row,record,index,eOpts) {
    	//console.log(record);
    },
    
    /* Populate server list */
    populateServers: function() {
    	
    	this.getStore('ServerList').load(function(records) {

    		var toolbar = Ext.ComponentQuery.query('viewport > NavTree > toolbar')[0];
    		
    		if(records.length == 0) {
    			
    			toolbar.hide();
    			
    		} else if(records.length == 1) {
    			
    			var sl = Ext.ComponentQuery.query('viewport > NavTree #serverlist')[0];
    			sl.select(records[0]);
    			sl.fireEvent('select', sl, records);
    			//toolbar.hide();
    		}
    	});
    },
    
    /* Populate navigation tree with groups and VMs */
    populateTree: function() {
    	
    	var NavTreeView = this.getNavTreeView();    	
    	var NavTreeGroupsStore = this.getNavTreeGroupsStore();
    	var NavTreeVMsStore = this.getNavTreeVMsStore();
    	
    	// Show load mask
    	NavTreeView.setLoading();
    	
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
        		NavTreeView.getRootNode().expand();
        		
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
    		var rootNode = NavTreeView.getRootNode();
    		addChildren(0,rootNode);
    		
    		// Now load VMs
    		loadVMs();
    		
    	}});
    	
    	
    }
    	
});