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
    	serversFolder = navTreeRoot.createNode({'cls':'navTreeFolder','leaf':false,'text':'Servers','id':'servers','data':{'_type':'serversFolder'}});
    	navTreeRoot.appendChild(serversFolder);

    	// Add virtual machines
    	vmsFolder = navTreeRoot.createNode({'cls':'navTreeFolder','leaf':false,'text':'Virtual Machines','id':'vms','data':{'_type':'vmsFolder'}});
    	navTreeRoot.appendChild(vmsFolder);

    	// Add templates folder
    	templatesFolder = navTreeRoot.createNode({'cls':'navTreeFolder','leaf':false,'text':'Templates','data':{'_type':'templatesFolder'}});
    	navTreeRoot.appendChild(templatesFolder);

    	var nodeStore = NavTreeView.getStore();
    	
    	var self = this;
    	var vboxServers = []
    	
    	/*
    	 * Data loading functions
    	 * 
    	 */
    	function loadServersData(data) {
    		
    		vboxServers = data;
    		
    		for(var i = 0; i < data.length; i++) {
    			
    			data[i]._type = 'server';
    			
    			serversFolder.appendChild(serversFolder.createNode({
    				'iconCls':'navTreeIcon',
    				'icon': 'images/vbox/OSE/VirtualBox_cube_42px.png',
    				'leaf':true,
    				'text':data[i].name + ' (<span class="navTreeServerStatus">' + data[i].status_name + '</span>)',
    				'id' : 'server-' + data[i].id,
    				'data' : data[i]
    			}))
    			
    		}
    		
    		// Expand folder
    		serversFolder.expand()

    	}

    	function loadGroupsData(data) {
    		
			for(var i = 0; i < data.length; i++) {
				
				appendTarget = (data[i].parent_id ? nodeStore.getNodeById('vmgroup-' + data[i].parent_id) : vmsFolder);
				if(!appendTarget) appendTarget = vmsFolder;
				
				data[i]._type = 'vmgroup';
				
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
    	
    	function loadVMsData(data) {
    		
			for(var i = 0; i < data.length; i++) {
				
				data[i]._type = 'vm';
				
				appendTarget = (data[i].group_id ? nodeStore.getNodeById('vmgroup-' + data[i].group_id) : vmsFolder);
				if(!appendTarget) appendTarget = vmsFolder;
				 
				appendTarget.appendChild(appendTarget.createNode({
					'cls' : 'navTreeVM vmState' + (data[i].state) + ' vmSessionState' + data[i].sessionState + ' vmOSType' + data[i].OSTypeId,
        			'text' : '<span class="vmStateIcon"> </span>' + data[i].name,
        			'leaf' : true,
        			'icon' : 'images/vbox/' + vcube.utils.vboxGuestOSTypeIcon(data[i].OSTypeId),
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
    	
    	Ext.ux.Deferred.when(vcube.app.ajaxRequest('connectors/getConnectors')).then(function(data){
    		
    		loadServersData(data);
    		
    		Ext.ux.Deferred.when(vcube.app.ajaxRequest('vmgroups/getGroups'))
	    		.then(function(data) {
	    			
	    			loadGroupsData(data);


	    			loadVMsData(vcube.vmdatamediator.getVMList());
	    			
    				NavTreeView.setLoading(false);

	    		});
    	});
    	
    	// Get VMs
    	function addVMs(connectorid) {
    		
    		var def = Ext.create('Ext.ux.Deferred');
    		
    		vcube.app.ajaxRequest('vbox/vboxGetMachines',{'server':connectorid}, function(data) {
    			loadVMsData(data, connectorid);
    			def.resolve();

    		}, function(){
    			def.reject();
    		});
    		

    		return def;
    		
    	}
    	
    	
    }
});