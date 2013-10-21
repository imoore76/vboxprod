Ext.define('vcube.controller.VMSnapshots', {
	
	extend: 'vcube.controller.XInfoTab',
	
	statics: {
	
		timer : null,
		
		// Max age of snapshot timestamps before we just display
		// a date for timestamp age
		maxAge: (86400 * 30),
		
		timeSpans : new Array(),
		
	    /* Get node title with time (currentTime passed so that it's cached) */
	    nodeTitleWithTimeString: function(name, timeStamp, currentTime) {
	    	
	    	// Shorthand
	    	var timeSpans = vcube.controller.VMSnapshots.timeSpans;
	    	
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
			
			return Ext.String.format(vcube.view.VMSnapshots.snapshotTextTpl, Ext.String.htmlEncode(name), ts)
	    },
	    
	    /**
	     * 
	     * Snapshot action list
	     * 
	     */
	    snapshotActions: {
	    	
		  	takeSnapshot: {
		  		
		  		enabled : function(ss, vm) {
		  			
		  			return (ss && ss.id == 'current' && !Ext.Array.contains(['RestoringSnapshot','LiveSnapshotting','DeletingSnapshot','Starting','PoweringOff'], vm.state));
		  		},
		  		

		  		action : function (ss, vm, rootNode) {
	
		  			/* Since this could be called from restore snapshot,
		  			 * return a deferred object
		  			 */
		  			var promise = Ext.create('Ext.ux.Deferred');
		  			
		  			/* Elect SS name */
		  			var ssNumber = 1; //vm.snapshotCount + 1;
		  			var ssName = vcube.utils.trans('Snapshot %1','VBoxSnapshotsWgt').replace('%1', ssNumber);
		  			
		  			while(rootNode.findChildBy(function(node){
		  				return (node.raw.name == ssName);
		  				},this,true)) {
		  				
		  				ssName = vcube.utils.trans('Snapshot %1','VBoxSnapshotsWgt').replace('%1', ++ssNumber);
		  			}

		  			Ext.create('vcube.view.VMSnapshots.TakeSnapshot',{
		  				listeners: {
		  					show: function(win) {
		  						
		  						win.down('#osimage').setSrc("images/vbox/" + vcube.utils.vboxGuestOSTypeIcon(vm.OSTypeId));
		  						
		  						win.down('#form').getForm().setValues({name:ssName});
		  						
		  						win.down('#ok').on('click',function(btn){
		  							
		  							
		  							win.setLoading(true);
		  							
		  							// Suspend events so that we don't get the task update before
		  							// we tell the application to watch for it
		  							vcube.app.suspendEvents(true);
		  							
		  							// Take snapshot 
		  							Ext.ux.Deferred.when(vcube.utils.ajaxRequest('vbox/snapshotTake',
		  									Ext.apply(win.down('#form').getForm().getValues(), vcube.utils.vmAjaxParams(vm.id))),{watchTask:true})
		  								.done(function(data) {
		  									promise.resolve(data);
		  									win.close();
			  							})
				  						.fail(function() {
				  							promise.reject('taking snapshot failed');
				  							win.setLoading(false);			  								
			  							}).always(function(){
			  								vcube.app.resumeEvents();
			  							});
		  						});
		  						win.down('#cancel').on('click',function(){
		  							promise.reject('snapshot window closed');
		  						});
		  					}
		  				}
		  			}).show();
	
		  			return promise;
		  					  			
		  			
		  	  	}
		  	},
		  	
		  	/*
		  	 * Restore a snapshot
		  	 */
		  	restoreSnapshot: {
		  		
		  		enabled : function(ss, vm) {
		  			
		  			return (ss && ss.id != 'current' && !vcube.utils.vboxVMStates.isRunning(vm) && !vcube.utils.vboxVMStates.isPaused(vm));
		  		},
		  		
		  		action : function (snapshot, vm, rootNode) {
		  			
		  			
					var buttons = {};
					var q = '';
					
					// Check if the current state is modified
					if(vm.currentStateModified) {
	
						q = vcube.utils.trans("<p>You are about to restore snapshot <nobr><b>%1</b></nobr>.</p>" +
		                        "<p>You can create a snapshot of the current state of the virtual machine first by checking the box below; " +
		                        "if you do not do this the current state will be permanently lost. Do you wish to proceed?</p>",'UIMessageCenter');
						q += '<p><label><input type="checkbox" checked /> ' + vcube.utils.trans('Create a snapshot of the current machine state','UIMessageCenter') + '</label></p>';
						
						var buttons = [{
							
							text: vcube.utils.trans('Restore','UIMessageCenter'),
	
							listeners: {
								
								click: function(btn) {
									
									var snrestore = function(){
										
										btn.up('.window').close();
										vcube.utils.ajaxRequest('vbox/snapshotRestore', Ext.apply({'snapshot':snapshot.id}, vcube.utils.vmAjaxParams(vm.id)));										
										
									};
									
									if(Ext.select('input[type=checkbox]',btn.up('.window').getEl().dom).elements[0].checked) {

										Ext.ux.Deferred.when(vcube.controller.VMSnapshots.snapshotActions.takeSnapshot.action(snapshot, vm, rootNode))
											.done(function(sntakepromise) {
												
												// Show progress window
			    								var pwin = Ext.create('vcube.view.common.ProgressWindow',{
			    									operation: 'snapshotTake'
			    								}).show();

												Ext.ux.Deferred.when(sntakepromise)
													.progress(function(pct, text){
														pwin.updateProgress(pct, text);
													}).done(function(){
														snrestore();
													}).always(function(){
														// close progress window
														pwin.close();
													})
											});
										
									} else {
										snrestore();
									}
								}
							}
							
						}];
	
					} else {
						
						q = vcube.utils.trans('<p>Are you sure you want to restore snapshot <nobr><b>%1</b></nobr>?</p>','UIMessageCenter');
						
						var buttons = [{
							text: vcube.utils.trans('Restore','UIMessageCenter'),
							listeners: {
								click: function(btn) {
									
									btn.up('.window').close()
									vcube.utils.ajaxRequest('vbox/snapshotRestore', Ext.apply({'snapshot':snapshot.id}, vcube.utils.vmAjaxParams(vm.id)));
								}
							}
	
					
						}];
					}
	
					vcube.utils.confirm(q.replace('%1',Ext.String.htmlEncode(snapshot.name)),buttons);
		  	  	},
		  	},
		  	
		  	/*
		  	 * Delete snapshot
		  	 */
		  	deleteSnapshot : {
		  		
		  		enabled : function(ss, vm) {
		  			return (ss && ss.id != 'current'); // && ss.children.length <= 1);
		  		},
		  		
		  		action : function (ss, vm) {
		  			
					var buttons = [{
						text: vcube.utils.trans('Delete','UIMessageCenter'),
						listeners: {
							click: function(btn) {
								btn.up('.window').close()
								vcube.utils.ajaxRequest('vbox/snapshotDelete', Ext.apply({'snapshot':ss.id}, vcube.utils.vmAjaxParams(vm.id)));
							}
						}
					}];
					
					vcube.utils.confirm(vcube.utils.trans('<p>Deleting the snapshot will cause the state information saved in it to be lost, and disk data spread over several image files that VirtualBox has created together with the snapshot will be merged into one file. This can be a lengthy process, and the information in the snapshot cannot be recovered.</p></p>Are you sure you want to delete the selected snapshot <b>%1</b>?</p>','UIMessageCenter').replace('%1',Ext.String.htmlEncode(ss.name)),buttons);
		  	  	}
		  	},
		  	
		  	/*
		  	 * CLone
		  	 */
		  	cloneSnapshot: {
		  		
		  		enabled : function(ss, vm) { 
		  			return (ss && !vcube.utils.vboxVMStates.isPaused(vm) && !vcube.utils.vboxVMStates.isRunning(vm));
		  		},
		  		action : function (ss, vm) {
	
		  	  		new vboxWizardCloneVMDialog({'vm':vm,'snapshot':(ss.id == 'current' ? undefined : ss)}).run();
		  			
		  	  	}
		  	},
		  	
		  	/*
		  	 * Show snapshot details
		  	 */
		  	showSnapshot: {
		  		
		  		enabled : function(ss, vm) {
		  			return (ss && ss.id != 'current');
		  		},
		  		
		  		action : function (snapshot, vm) {

		  			
		  			var win = Ext.create('vcube.view.VMSnapshots.Details');
		  			win.show();
		  			win.setLoading(true);
		  			
		  			Ext.ux.Deferred.when(vcube.utils.ajaxRequest('vbox/snapshotGetDetails', Ext.apply({'snapshot':snapshot.id},vcube.utils.vmAjaxParams(vm.id))))
		  				.done(function(data) {
			  				

			  				data.machine._isSnapshot = true;

			  				// Set basic values
							win.down('#form').getForm().setValues({'name':data.name,'description':data.description});
							
							win.down('#taken').setValue(vcube.utils.dateTimeString(data.timeStamp));
							
							// Preview image
							if(data.online) {
								var params = Ext.apply({'snapshot':snapshot.id},vcube.utils.vmAjaxParams(vm.id));
								win.down('#preview').setValue('<a href="vbox/machineGetScreenShot?' + Ext.urlEncode(params)+'&full=1" target=_new><img src="vbox/machineGetScreenShot?' + Ext.urlEncode(params) + '" /></a>');
							} else {
								win.down('#preview').hide();
							}
							
							// Add details
							var sectionsPane = win.down('#details');
							for(var i in vcube.view.VMDetails.sections) {
								
								if(typeof(i) != 'string') continue;
								
								if(vcube.view.VMDetails.sections[i].condition && !vcube.view.VMDetails.sections[i].condition(data.machine)) continue;
								
								sectionsPane.add(Ext.create('vcube.widget.SectionTable',{
									sectionCfg: vcube.view.VMDetails.sections[i],
									'data': data.machine,
									name: i}));
								
							}
							
							win.down('#ok').on('click',function(btn){
								var vals = win.down('#form').getForm().getValues();
								win.setLoading(true);
								Ext.ux.Deferred.when(vcube.utils.ajaxRequest('vbox/snapshotSave',Ext.apply({'snapshot':snapshot.id,'name':vals.name,'description':vals.description},vcube.utils.vmAjaxParams(vm.id))))
									.done(function(){
										win.close();										
									})
									.always(function(){
										win.setLoading(false);
									});
								
							});
							
							win.setLoading(false);
		 
		  				})
		  				
		  				.fail(function(){
		  					win.setLoading(false);
		  				});
		  			
		  	  	}
		  	}	  	
	  	
	    }

	    
	},
	
    /* Watch for events */
    init: function(){
    	
    	/* Sort time spans */
    	vcube.controller.VMSnapshots.timeSpans['days'] = 86400;
        vcube.controller.VMSnapshots.timeSpans['hours'] = 3600;
        vcube.controller.VMSnapshots.timeSpans['minutes'] = 60;
        vcube.controller.VMSnapshots.timeSpans['seconds'] = 1;
    	vcube.controller.VMSnapshots.timeSpans.sort(function(a,b){return (a > b ? -1 : 1);});
    	
    	/* Setup sections */
    	this.sectionConfig = [];

    	/* Selection item type (vm|server|group) */
    	this.selectionItemType = 'vm';
    	
    	/* Repopulate event attribute */
    	this.eventIdAttr = 'machineId';
    	    	
		// Special case for snapshot actions
		this.application.on({
			'MachineStateChanged': this.onMachineStateChanged,
			'SnapshotChanged': this.onSnapshotChanged,
			'SnapshotDeleted' : this.onSnapshotDeleted,
			'SnapshotTaken' : this.onSnapshotTaken,
			scope: this
		});
		
		
        
        this.control({
        	'viewport > #MainPanel > VMTabs > VMSnapshots' : {
        		render: this.onTabRender
        	},
        	'viewport > #MainPanel > VMTabs > VMSnapshots toolbar > button' : {
        		click: this.onButtonClick
        	},
        	'viewport > #MainPanel > VMTabs > VMSnapshots > treepanel' : {
        		selectionchange: this.updateActions
        	}
        });
        
        this.callParent();
        
    },
    
    // Snapshot tree and store refs
    snapshotTree: null,
    snapshotTreeStore: null,
    
    sortFn: function(snNode1, snNode2) {
    	if(snNode1.get('id') == 'current') return 1;
    	if(snNode2.get('id') == 'current') return -1;
    	if(snNode1.get('timeStamp') > snNode2.get('timeStamp')) return -1;
    	if(snNode2.get('timeStamp') > snNode2.get('timeStamp')) return 1;
    	return 0;
    },
    
    /* When a toolbar button is clicked */
    onButtonClick: function(btn) {

    	if(!this.snapshotTree.getView().getSelectionModel().selected.length)
    		return;
    	
    	vcube.controller.VMSnapshots.snapshotActions[btn.itemId].action(
    			this.snapshotTree.getView().getSelectionModel().getSelection()[0].raw,
    			vcube.vmdatamediator.getVMData(this.selectionItemId),
    			this.snapshotTree.getRootNode());
    },
    
    /* Update buttons and menu items */
    updateActions: function() {
    	
    	var self = this;

    	// Snapshot data
    	var ss = null;
    	if(this.snapshotTree.getView().getSelectionModel().selected.length)
    		ss = this.snapshotTree.getView().getSelectionModel().getSelection()[0].raw;
    	
    	// vm data
    	var vm = vcube.vmdatamediator.getVMData(this.selectionItemId);


    	var snActions = vcube.app.getActions('snapshots');
    	for(var i = 0; i < snActions.length; i++) {
    		if(vcube.actions.snapshots[snActions[i]].enabled(ss, vm)) {
    			vcube.app.getAction('snapshots',snActions[i]).enable();
    		} else {
    			vcube.app.getAction('snapshots',snActions[i]).disable();
    		}
    	}
    	
    },
    
    /* Hold ref to snapshot tree store when tab is rendered 
     * and setup tooltips */
    onTabRender: function(tab) {
    	
    	var self = this;
    	
    	this.snapshotTree = tab.down('#snapshottree');
    	this.snapshotTreeStore = this.snapshotTree.getStore();
    	
    	/* 
    	 * Context menu
    	 * 
    	 */
    	this.itemContextMenu = Ext.create('Ext.menu.Menu', {
    	    renderTo: Ext.getBody(),
    	    items: Ext.Array.map(vcube.view.VMSnapshots.contextMenuItems, function(item) {
    	    	return Ext.apply(item, {listeners : { click: self.onButtonClick, scope: self }});
    	    })
    	});

    	var self = this;
    	this.snapshotTree.on('itemcontextmenu',function(t,r,i,index,e) {
    		e.stopEvent();
    		self.itemContextMenu.showAt(e.getXY());

    	});

    	this.snapshotTree.on('beforeitemcontextmenu',function(t,snapshot) {
    		
    		Ext.each(self.itemContextMenu.items.items, function(i){
    			if(i.isDisabled()) i.hide();
    			else i.show();
    		});

    		var lastXtype = null;
			Ext.each(Ext.Array.filter(self.itemContextMenu.items.items, function(i) { return i.isVisible(); }),function(item, index, total){

				var xtype = item.getXType();
				if(item.xtype == 'menuseparator' && (lastXtype == 'menuseparator' || !lastXtype || index == (total.length-1))) {
					item.hide();
				} else {
					item.show();
				}
				lastXtype = xtype;
			});
    		

    	});
    	
    	/*
    	 * Snapshot tool tips 
    	 */
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

    	            		tip.update(vcube.view.VMSnapshots.currentStateTip(
    	            				Ext.Object.merge({'snapshotCount':(snapshotTreeView.getStore().getCount()-1)},vcube.vmdatamediator.getVMData(self.selectionItemId), record.raw)
    	            				));
    	            		
    	            	} else {
    	            		
    	            		tip.update(vcube.view.VMSnapshots.snapshotTip(record.raw));
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
    	
    	var nodeCfg = vcube.view.VMSnapshots.currentStateNode(Ext.Object.merge({currentStateModified:true},vcube.vmdatamediator.getVMData(this.selectionItemId)));
    	this.snapshotTreeStore.getNodeById('current').set(nodeCfg);
    },
    
    /* Fires when a snapshot has been taken */
    onSnapshotTaken: function(event) {
    	
    	if(!this.filterEvent(event)) return;
    	
    	// Nothing to do if tab isn't visible
    	if(!(this.controlledTabView && this.controlledTabView.isVisible())) {
    		this.dirty = true;
    		return;
    	}

    	// Append snapshot to current state's parent
    	this.snapshotTreeStore.getNodeById('current').parentNode.appendChild(vcube.view.VMSnapshots.snapshotNode(event.enrichmentData.snapshot));
    	
    	// Move current to child of just appended snapshot
    	this.snapshotTreeStore.getNodeById(event.enrichmentData.snapshot.id).appendChild(this.snapshotTreeStore.getNodeById('current'));
    	this.snapshotTreeStore.getNodeById(event.enrichmentData.snapshot.id).expand();
    	
    	// Update timestamps
    	this.updateTimestamps();
    	
    	
    	
    	
    },
    
    /* Update a snapshot when it has changed */
    onSnapshotChanged: function(event) {
    	
    	if(!this.filterEvent(event)) return;
    	
    	// Nothing to do if tab isn't visible
    	if(!(this.controlledTabView && this.controlledTabView.isVisible())) {
    		this.dirty = true;
    		return;
    	}

    	
    	var targetNode = this.snapshotTreeStore.getNodeById(event.snapshotId);
    	
    	var currentTime = new Date();
    	currentTime = Math.floor(currentTime.getTime() / 1000);

    	targetNode.set({
    		'text' : vcube.controller.VMSnapshots.nodeTitleWithTimeString(event.enrichmentData.name, targetNode.raw.timeStamp, currentTime),
    		'name': event.enrichmentData.name,
    		'description': event.enrichmentData.description
    	});
    	
    	Ext.apply(targetNode.raw,{name: event.enrichmentData.name, description: event.enrichmentData.description});
    	
    	
    },
    
    /* Remove snapshot when it has been deleted or move
     * current state when a snapshot has been restored */
    onSnapshotDeleted: function(event) {
    	
    	if(!this.filterEvent(event)) return;

    	// Nothing to do if tab isn't visible
    	if(!(this.controlledTabView && this.controlledTabView.isVisible())) {
    		this.dirty = true;
    		return;
    	}

    	// Snapshot deleted
    	if(event.snapshotId && event.snapshotId != '00000000-0000-0000-0000-000000000000') {
    		
    		var removeTarget = this.snapshotTreeStore.getNodeById(event.snapshotId);
    		
    		if(!removeTarget) return;
    		
    		var n = removeTarget.getChildAt(0);
    		
    		while(n) {
    			
    			removeTarget.parentNode.appendChild(n);//.remove());
    			n = removeTarget.getChildAt(0);
    		}
    		
    		removeTarget.parentNode.sort(this.sortFn);
    		removeTarget.parentNode.removeChild(removeTarget, true);

    	// Snapshot restored
    	} else {
    		this.snapshotTreeStore.getNodeById(event.enrichmentData.currentSnapshot).appendChild(this.snapshotTreeStore.getNodeById('current'));
    		this.snapshotTreeStore.getNodeById(event.enrichmentData.currentSnapshot).expand();
    	}
		
    	
    },

    
    /* Update snapshot timestamps */
    updateTimestamps: function() {
    	
    	
    	// Shorthand
    	var timeSpans = vcube.controller.VMSnapshots.timeSpans;
    	
    	// Keep minimum timestamp
    	var minTs = 60;

    	var currentTime = new Date();
    	currentTime = Math.floor(currentTime.getTime() / 1000);

    	function updateChildren(node) {
    		
    		
    		Ext.each(node.childNodes, function(childNode) {
    			
    			if(childNode.raw.id == 'current') return;


    			if(!childNode.raw._skipTS) {
    				
    				minTs = Math.min(minTs,Math.max(parseInt(childNode.raw.timeStamp), 1));
    				
    				childNode.set('text', vcube.controller.VMSnapshots.nodeTitleWithTimeString(childNode.raw.name, childNode.raw.timeStamp, currentTime));
    				
    				if(currentTime - childNode.raw.timeStamp > vcube.controller.VMSnapshots.maxAge)
    					childNode.raw._skipTS = true;
    			}
    			
    			updateChildren(childNode);
    		});
    	}

    	
    	updateChildren(this.snapshotTreeStore.getRootNode());
    	
    	var timerSet = (minTs >= 60 ? 60 : 10);
    	var self = this;
    	vcube.controller.VMSnapshots.timer = window.setTimeout(function(){
    		self.updateTimestamps();
    	}, (timerSet * 1000));
    },

    /* Populate snapshot tree */
    populate: function(recordData) {

    	
    	if(vcube.controller.VMSnapshots.timer) {
    		window.clearTimeout(vcube.controller.VMSnapshots.timer);
    	}
    	
    	// Nothing to do if tab isn't visible
    	if(!(this.controlledTabView && this.controlledTabView.isVisible())) {
    		this.dirty = true;
    		return;
    	}
    	
    	this.snapshotTree.getView().getSelectionModel().deselectAll();
    	this.updateActions();

    	// Data is no longer dirty
    	this.dirty = false;
    	
    	// Show loading mask
    	this.controlledTabView.setLoading(true);
    	
    	this.snapshotTreeStore.getRootNode().removeAll();
    	var self = this;
    	
    	
    	Ext.ux.Deferred.when(vcube.utils.ajaxRequest('vbox/machineGetSnapshots',vcube.utils.vmAjaxParams(recordData.id)))

    		.done(function(responseData) {
    		
	    		self.controlledTabView.setLoading(false);
	    		
	    		
	    		function appendChildren(parentNode, children) {
	    			if(!children) return;
	    			for(var i = 0; i < children.length; i++) {
	
	    				var childNodes = children[i].children;
	    				delete children[i].children;
	    				
	    				var child = parentNode.createNode(vcube.view.VMSnapshots.snapshotNode(children[i], (childNodes && childNodes.length)));
	    				
	    				if(childNodes) appendChildren(child, childNodes);
	    				
	    				child.sort(self.sortFn);
	    				parentNode.appendChild(child);
	    			}
	    		}
	
	    		if(responseData.snapshot && responseData.snapshot.id)
	    			appendChildren(self.snapshotTree.getRootNode(), [responseData.snapshot]);
	    		
	    		self.snapshotTree.getRootNode().sort(self.sortFn);
	    		
	    		// Append current state
	    		var appendTarget = self.snapshotTreeStore.getNodeById(responseData.currentSnapshotId);
	    		
	    		if(!appendTarget) appendTarget = self.snapshotTree.getRootNode();
	    		
	    		
	    		appendTarget.appendChild(
					appendTarget.createNode(
						vcube.view.VMSnapshots.currentStateNode(Ext.Object.merge({},vcube.vmdatamediator.getVMData(recordData.id), {currentSnapshotId: responseData.currentSnapshotId, currentStateModified: responseData.currentStateModified}))
					)
	    		);
	    		appendTarget.expand();
	    		
	    		
	    		// Expand
	    		self.snapshotTree.getRootNode().expand();
	    		self.updateTimestamps();
	    		
	    	})
	    	.fail(function() {
	    		self.controlledTabView.setLoading(false);
	    	});
    	
    }

});
