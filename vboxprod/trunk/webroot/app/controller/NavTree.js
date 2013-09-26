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

    	var nodeStore = NavTreeView.getStore();
    	
    	var self = this;
    	
    	var availableServers = [];
    	
    	/*
    	 * Data loading functions
    	 * 
    	 */
    	function loadServersData(data) {
    		
    		for(var i = 0; i < data.length; i++) {
    			serversFolder.appendChild(serversFolder.createNode({
    				'iconCls':'navTreeIcon',
    				'icon': 'images/vbox/OSE/VirtualBox_cube_42px.png',
    				'leaf':true,
    				'text':data[i].name + ' (<span class="navTreeServerStatus">' + data[i].status_name + '</span>)',
    				'id' : 'server-' + data[i].id,
    				'data' : data[i]
    			}))
    			
    			// Add to available servers list if server is available
    			if(data[i].status == 100) {
    				availableServers[availableServers.length] = data[i].id;
    			}
    		}
    		
    		// Expand folder
    		serversFolder.expand()

    	}

    	function loadGroupsData(data) {
    		
			for(var i = 0; i < data.length; i++) {
				
				appendTarget = (data[i].parent_id ? nodeStore.getNodeById('vmgroup-' + data[i].parent_id) : vmsFolder);
				if(!appendTarget) appendTarget = vmsFolder;
				
				appendTarget.appendChild(appendTarget.createNode({
					'iconCls':'navTreeIcon',
					'leaf':false,
					'text':data[i].name,
					'id' : 'vmgroup-' + data[i].id,
					'data' : data[i]
				}))
			}
			
			// Expand folder
			vmsFolder.expand()

    	}
    	
    	function loadVMsData(data, connectorid) {
    		
			for(var i = 0; i < data.length; i++) {
				
				data[i]._connectorid = connectorid
				
				appendTarget = (data[i].group_id ? nodeStore.getNodeById('vmgroup-' + data[i].group_id) : vmsFolder);
				if(!appendTarget) appendTarget = vmsFolder;
				 
				appendTarget.appendChild(appendTarget.createNode({
					'cls' : 'navTreeVM vmState' + (data[i].state) + ' vmSessionState' + data[i].sessionState + ' vmOSType' + data[i].OSTypeId,
        			'text' : '<span class="vmStateIcon"> </span>' + data[i].name,
        			'leaf' : true,
        			'icon' : 'images/vbox/' + vboxGuestOSTypeIcon(data[i].OSTypeId),
        			'iconCls' : 'navTreeIcon',
        			'data' : data[i]
        		}))
			}

    	}
    	
    	/*
    	 *	
    	 *	Load all tree data 
    	 * 
    	 */
    	
		Ext.ux.Deferred.when(self.application.ajaxRequest('connectors/getConnectors'))
				.then(function(data) {
					
					loadServersData(data);
					
				}).then(function() {

					Ext.ux.Deferred.when(self.application.ajaxRequest('vmgroups/getGroups'))
							.then(function(data) {
								
								loadGroupsData(data);
								
								var vmLoaders = [];
								for(var i = 0; i < availableServers.length; i++) {
									console.log(availableServers[i]);
									vmLoaders[vmLoaders.length] = addVMs(availableServers[i])
								}
								
								Ext.ux.Deferred.when.apply(vmLoaders).then(function(){
									console.log('here..1');
									NavTreeView.setLoading(false);
								});
							});
				});
    	
    	// Get VMs
    	function addVMs(connectorid) {
    		
    		var def = Ext.create('Ext.ux.Deferred');
    		
    		self.application.ajaxRequest('vbox/vboxGetMachines',{'server':connectorid}, function(data) {
    			loadVMsData(data, connectorid);
    			console.log('here...');
    			def.resolve();

    		}, function(){
    			def.reject();
    		});
    		

    		return def;
    		
    	}
    	
    	
    }
});