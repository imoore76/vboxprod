/*
 * NavTree Controller
 */
Ext.define('vboxprod.controller.NavTree', {
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
    	
    	console.log("nav tree controller init");
    	
    	/* Application level events */
        this.application.on({
            login: this.populateTree, 
            scope: this
        },{
        	launch: this.showWelcome,
        	scope: this
        });
        
        /* Tree events */
        this.control({
        	'NavTree' : {
        		select: this.selectItem
        	}
        });
    },
    
    /* An item is selected */
    selectItem: function(row,record,index,eOpts) {
    	console.log(record);
    },
    
    /* Populate navigation tree with groups and VMs */
    populateTree: function() {
    	
    	console.log("populating tree");
    	
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
        			group.appendChild(group.createNode(records[i]));        			
        		}

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
    		addChildren('',rootNode);
    		
    		// Now load VMs
    		loadVMs();
    		
    	}});
    	
    	
    }
    	
});