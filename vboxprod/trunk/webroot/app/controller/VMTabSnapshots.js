Ext.define('vcube.controller.VMTabSnapshots', {
	
	extend: 'vcube.controller.XInfoTab',
	    
	statics: {
	
		timer : null,
		
		timeSpans : new Array(),
		
	    /* Get node title with time (currentTime passed so that it's cached) */
	    nodeTitleWithTimeString: function(name, timeStamp, currentTime) {
	    	
	    	// Shorthand
	    	var timeSpans = vcube.controller.VMTabSnapshots.timeSpans;
	    	
			var sts = parseInt(timeStamp);
			var t = Math.max(currentTime - sts, 1);
			
			var ts = '';
			
			// Check for max age.
			if(Math.floor(t / 86400) > 30) {
				
				var sdate = new Date(sts * 1000);
				ts = vcube.utils.trans(' (%1)','VBoxSnapshotsWgt').replace('%1',sdate.toLocaleString());
				
				
			} else {
				
				var ago = 0;
				var ts = 'seconds';
				for(var i in timeSpans) {
					var l = Math.floor(t / timeSpans[i]);
					if(l > 0) {
						ago = l;
						ts = i;
						break;
					}
				}
				switch(ts) {
				case 'days':
					ts = vcube.utils.trans('%n day(s)', 'VBoxGlobal', ago).replace('%n', ago);
					break;
				case 'hours':
					ts = vcube.utils.trans('%n hour(s)', 'VBoxGlobal', ago).replace('%n', ago);
					break;				
				case 'minutes':
					ts = vcube.utils.trans('%n minute(s)', 'VBoxGlobal', ago).replace('%n', ago);
					break;				
				case 'seconds':
					ts = vcube.utils.trans('%n second(s)', 'VBoxGlobal', ago).replace('%n', ago);
					break;				
				}
				
				ts = vcube.utils.trans(' (%1 ago)','VBoxSnapshotsWgt').replace('%1', ts);
				
			}
			
			return Ext.String.format(vcube.view.VMTabSnapshots.snapshotTextTpl, name, ts)
	    }

	},
	
    /* Watch for events */
    init: function(){
    	
    	/* Sort time spans */
    	vcube.controller.VMTabSnapshots.timeSpans['days'] = 86400;
        vcube.controller.VMTabSnapshots.timeSpans['hours'] = 3600;
        vcube.controller.VMTabSnapshots.timeSpans['minutes'] = 60;
        vcube.controller.VMTabSnapshots.timeSpans['seconds'] = 1;
    	vcube.controller.VMTabSnapshots.timeSpans.sort(function(a,b){return (a > b ? -1 : 1);});
    	
    	/* Setup sections */
    	this.sectionConfig = [];

    	/* Selection item type (vm|server|group) */
    	this.selectionItemType = 'vm';
    	
    	/* Repopulate on Events*/
    	this.repopulateOn = ['SnapshotTaken'];//,'SnapshotDeleted'];
    	
    	/* Repopulate event attribute */
    	this.eventIdAttr = 'machineId';
    	    	
		// Special case for snapshot actions
		this.application.on({
			'MachineStateChanged': this.onMachineStateChanged,
			'SnapshotChanged': this.onSnapshotChanged,
			'SnapshotDeleted' : this.onSnapshotDeleted,
			scope: this
		});
		
		
        /* Tab rendered */
        this.control({
        	'viewport > #MainPanel > VMTabs > VMTabSnapshots' : {
        		render: this.onTabRender
        	}
        });
        
        this.callParent();
        
    },
    
    // Snapshot tree and store refs
    snapshotTree: null,
    snapshotTreeStore: null,
    
    /* Hold ref to snapshot tree store when tab is rendered */
    onTabRender: function(tab) {
    	
    	var self = this;
    	
    	this.snapshotTree = tab.down('#snapshottree');
    	this.snapshotTreeStore = this.snapshotTree.getStore();
    	
    	
    	/**
    	 * 
    	 * Snapshot tooltips
    	 * 
    	 **/
    	var snapshotTreeView = this.snapshotTree.getView();

    	this.snapshotTree.on('render', function(view) {
    		
    	    view.tip = Ext.create('Ext.tip.ToolTip', {
    	        // The overall target element.
    	        target: view.el,
    	        // Each grid row causes its own seperate show and hide.
    	        delegate: 'span.x-tree-node-text', //view.itemSelector,
    	        // Moving within the row should not hide the tip.
    	        trackMouse: true,
    	        // Render immediately so that tip.body can be referenced prior to the first show.
    	        renderTo: Ext.getBody(),
    	        listeners: {
    	            // Change content dynamically depending on which element triggered the show.
    	        	
    	            beforeshow: function updateTipBody(tip) {
    	            	
    	            	var record = snapshotTreeView.getRecord(Ext.get(tip.triggerEvent.target).findParentNode(snapshotTreeView.itemSelector));

    	            	if(!record) return false;
    	            	
    	            	if(record.get('id') =='current') {

    	            		tip.update(vcube.view.VMTabSnapshots.currentStateTip(
    	            				Ext.Object.merge({'snapshotCount':(snapshotTreeView.getStore().getCount()-1)},vcube.vmdatamediator.getVMData(self.selectionItemId), record.data)
    	            				));
    	            		
    	            	} else {
    	            		
    	            		tip.update(vcube.view.VMTabSnapshots.snapshotTip(record.data));
    	            	}
    	            	
    	            }
    	        }
    	    });
    	});
    	this.callParent(arguments);
    },
    
    /* Update current state when machine state changes */
    onMachineStateChanged: function(event) {
    	
    	if(!this.filterEvent(event)) return;
    	
    	var nodeCfg = vcube.view.VMTabSnapshots.currentStateNode(Ext.Object.merge({currentStateModified:true},vcube.vmdatamediator.getVMData(this.selectionItemId)));
    	this.snapshotTreeStore.getNodeById('current').set(nodeCfg);
    },
    
    /* Update a snapshot when it has changed */
    onSnapshotChanged: function(event) {
    	
    	if(!this.filterEvent(event)) return;
    	
    	var targetNode = this.snapshotTreeStore.getNodeById(event.snapshotId);
    	
    	var currentTime = new Date();
    	currentTime = Math.floor(currentTime.getTime() / 1000);

    	targetNode.set({
    		'text' : vcube.controller.VMTabSnapshots.nodeTitleWithTimeString(event.enrichmentData.name, targetNode.get('timeStamp'), currentTime),
    		'name': event.enrichmentData.name,
    		'description': event.enrichmentData.description
    	});
    	
    	
    },
    
    /* Remove snapshot when it has been deleted */
    onSnapshotDeleted: function(event) {
    	
    	if(!this.filterEvent(event)) return;
    	
    		var removeTarget = this.snapshotTreeStore.getNodeById(event.snapshotId);
    		
    		
    		var n = removeTarget.getChildAt(0);
    		//console.log(n);
    		//return;
    		
    		while(n) {
    			
    			removeTarget.parentNode.appendChild(n);//.remove());
    			n = removeTarget.getChildAt(0);
    		}

    		var parent = removeTarget.parentNode;
    		console.log(parent.childNodes.length);
    		parent.removeChild(removeTarget, true, true, true);
    		//removeTarget.remove(true, true);
		
    	
    },

    
    /* Update snapshot timestamps */
    updateTimestamps: function() {
    	
    	// Shorthand
    	var timeSpans = vcube.controller.VMTabSnapshots.timeSpans;
    	
    	// Keep minimum timestamp
    	var minTs = 60;

    	var currentTime = new Date();
    	currentTime = Math.floor(currentTime.getTime() / 1000);


    	function updateChildren(node) {
    		
    		
    		Ext.each(node.childNodes, function(childNode) {
    			
    			if(childNode.data.id == 'current') return;

    			minTs = Math.min(minTs,Math.max(parseInt(childNode.data.timeStamp), 1));
    			
    			childNode.set('text', vcube.controller.VMTabSnapshots.nodeTitleWithTimeString(childNode.data.name, childNode.data.timeStamp, currentTime));
    			
    			updateChildren(childNode);
    		});
    	}

    	
    	updateChildren(this.snapshotTreeStore.getRootNode());
    	
    	console.log("Min");
    	console.log(minTs);

    	var timerSet = (minTs >= 60 ? 60 : 10);
    	var self = this;
    	vcube.controller.VMTabSnapshots.timer = window.setTimeout(function(){
    		self.updateTimestamps();
    	}, (timerSet * 1000));
    },

    /* Populate snapshot tree */
    populate: function(recordData) {

    	if(vcube.controller.VMTabSnapshots.timer) {
    		window.clearTimeout(vcube.controller.VMTabSnapshots.timer);
    	}
    	
    	// Nothing to do if tab isn't visible
    	if(!(this.controlledTabView && this.controlledTabView.isVisible())) {
    		return;
    	}
    	
    	// Data is no longer dirty
    	this.dirty = false;
    	
    	// Show loading mask
    	this.controlledTabView.setLoading(true);
    	
    	this.snapshotTreeStore.getProxy().extraParams = {'vm' : recordData.id, 'connector': recordData.connector_id};
    	
    	this.snapshotTreeStore.load({
			scope: this,
			callback: function(r,o,success) {
				this.controlledTabView.setLoading(false);
				if(!success) {
					return;
				}
				
				// Append current state
				var meta = this.snapshotTreeStore.getProxy().getReader().getMetaData();
				
				var appendTarget = this.snapshotTreeStore.getNodeById(meta.currentSnapshotId);
				
				if(!appendTarget) appendTarget = this.snapshotTree.getRootNode();
				
				
				appendTarget.appendChild(
					appendTarget.createNode(
						vcube.view.VMTabSnapshots.currentStateNode(Ext.Object.merge({},vcube.vmdatamediator.getVMData(recordData.id), meta))
					)
				);
				appendTarget.expand();

				
				// Expand
				this.snapshotTree.getRootNode().expand();
				this.updateTimestamps();
				
			}
    	});

    }

});
