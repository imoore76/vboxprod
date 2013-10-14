Ext.define('vcube.controller.VMTabSnapshots', {
	
	extend: 'vcube.controller.XInfoTab',
	
	views: ['vcube.view.SnapshotTake'],
	    
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
			
			return Ext.String.format(vcube.view.VMTabSnapshots.snapshotTextTpl, Ext.String.htmlEncode(name), ts)
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
		  		

		  		click : function (ss, vm, rootNode) {
	
		  			/* Elect SS name */
		  			var ssNumber = 1; //vm.snapshotCount + 1;
		  			var ssName = vcube.utils.trans('Snapshot %1','VBoxSnapshotsWgt').replace('%1', ssNumber);
		  			
		  			while(rootNode.findChild('name', ssName, true)) {
		  				ssNumber ++;
		  				ssName = vcube.utils.trans('Snapshot %1','VBoxSnapshotsWgt').replace('%1', ssNumber);
		  			}

		  			var win = Ext.create('vcube.view.SnapshotTake',{
		  				listeners: {
		  					show: function(win) {
		  						win.down('#osimage').setSrc("images/vbox/" + vcube.utils.vboxGuestOSTypeIcon(vm.OSTypeId));
		  						win.down('#form').getForm().setValues({name:ssName});
		  						win.down('#ok').on('click',function(btn){
		  							
		  							win.setLoading(true);
		  							vcube.utils.ajaxRequest('vbox/snapshotTake',
		  									Ext.apply(win.down('#form').getForm().getValues(), vcube.utils.vmAjaxParams(vm.id)),
		  									function(data) {
		  										win.setLoading(false);
		  										if(data) win.close();
		  							}, function() {
		  								win.setLoading(false);
		  							})
		  						});
		  					}
		  				}
		  			}).show();
	
		  					  			
		  			
		  	  	}
		  	},
		  	
		  	/*
		  	 * Restore a snapshot
		  	 */
		  	restoreSnapshot: {
		  		
		  		enabled : function(ss, vm) {
		  			
		  			return (ss && ss.id != 'current' && !vcube.utils.vboxVMStates.isRunning(vm) && !vcube.utils.vboxVMStates.isPaused(vm));
		  		},
		  		
		  		click : function (snapshot, vm) {
		  			
		  			
					var buttons = {};
					var q = '';
					
					// Check if the current state is modified
					if(vm.currentStateModified) {
	
						q = vcube.utils.trans("<p>You are about to restore snapshot <nobr><b>%1</b></nobr>.</p>" +
		                        "<p>You can create a snapshot of the current state of the virtual machine first by checking the box below; " +
		                        "if you do not do this the current state will be permanently lost. Do you wish to proceed?</p>",'UIMessageCenter');
						q += '<p><label><input type="checkbox" id="vboxRestoreSnapshotCreate" checked /> ' + vcube.utils.trans('Create a snapshot of the current machine state','UIMessageCenter') + '</label></p>';
						
						var buttons = [{
							
							text: vcube.utils.trans('Restore','UIMessageCenter'),
	
							listeners: {
								
								click: function(btn) {
									
									var snrestore = function(takeSnapshot){
										
										// Don't do anything if taking a snapshot failed
										if(takeSnapshot && !takeSnapshot.success)
											return;
										
										vcube.utils.ajaxRequest('vbox/snapshotRestore', Ext.apply({'snapshot':snapshot.id}, vcube.utils.vmAjaxParams(vm.id)),function(data){
											btn.up('.window').close()
										},function(){
											btn.up('.window').close()
										});
										
										
									};
									
									if($('#vboxRestoreSnapshotCreate').prop('checked')) {
										vboxSnapshotButtons[0].click(snrestore);
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
									
									vcube.utils.ajaxRequest('vbox/snapshotRestore', Ext.apply({'snapshot':snapshot.id}, vcube.utils.vmAjaxParams(vm.id)),function(data){
										btn.up('.window').close()
									},function(){
										btn.up('.window').close()
									});
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
		  		
		  		click : function (ss, vm) {
		  			
					var buttons = [{
						text: vcube.utils.trans('Delete','UIMessageCenter'),
						listeners: {
							click: function(btn) {
								vcube.utils.ajaxRequest('vbox/snapshotDelete', Ext.apply({'snapshot':ss.id}, vcube.utils.vmAjaxParams(vm.id)),function(data){
									btn.up('.window').close()
								},function(){
									btn.up('.window').close()
								});
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
		  		click : function (ss, vm) {
	
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
		  		
		  		click : function (ss, vm) {
	
		  			// Current snapshot
		  	  		var snapshot = $('#vboxSnapshotList').find('div.vboxListItemSelected').first().parent().data('vboxSnapshot');
		  			
					var l = new vboxLoader();
					l.add('snapshotGetDetails',function(d){
	
						$('#vboxSnapshotDetailsName').val(d.responseData.name);
						$('#vboxSnapshotDetailsTaken').html(vboxDateTimeString(d.responseData.timeStamp));
						$('#vboxSnapshotDetailsDesc').val(d.responseData.description);
						
						if(d.responseData.online) {
							$('#vboxSnapshotSS').html('<a href="screen.php?vm='+vm.id+'&snapshot='+d.responseData.id+'&full=1" target="_blank"><img src="screen.php?vm='+vm.id+'&snapshot='+d.responseData.id+'" /></a>').show();
						} else {
							$('#vboxSnapshotSS').empty().hide();
						}
						
			  	  		// Display details
			  	  		$('#vboxSnapshotDetailsVM').empty();
			  	  		
				  	  	// Enclosing details Table
				  	  	var vboxDetailsTable = $('<table />').attr({'class':'vboxDetailsTable'});
				  	  	
				  	  	// Set to isSnapshot
				  	  	d.responseData.machine._isSnapshot = true;
				  	  	
				  	  	for(var i in vboxVMDetailsSections) {
				
				  	  		section = vboxVMDetailsSections[i];
				  	  		
				  	  		if(section.noSnapshot) continue;
				  	  		
					  	  	$('<tr />').attr({'class':'vboxDetailsHead'}).append(
					  	  		$('<th />').attr({'class':'vboxDetailsSection','colspan':'2'}).disableSelection()
					  	  			.html("<img style='float:left; margin-right: 3px; ' src='images/vbox/" + section.icon + "' height='16' width='16' /> ")
					  	  			.append(
					  	  				$('<span />').css({'float':'left'}).append(document.createTextNode(section.title +' '))
					  	  			)
					  	  	).appendTo(vboxDetailsTable);
	
				  	  		__vboxDetailAddRows(d.responseData.machine, section.rows, vboxDetailsTable);
				
				  	  	}
			  	  	
				  	  $('#vboxSnapshotDetailsVM').append(vboxDetailsTable);
	
			  	  		
					},{'vm':vm.id,'snapshot':snapshot.id});
					l.onLoad = function(){
		  			
			  			var buttons = {};
						buttons[vcube.utils.trans('OK','QIMessageBox')] = function() {
	
				  			// Current snapshot
				  	  		var snapshot = $('#vboxSnapshotList').find('div.vboxListItemSelected').first().parent().data('vboxSnapshot');
									
				  	  		var l = new vboxLoader();
				  	  		l.add('snapshotSave',function(d){
				  	  			
				  	  			// Let events get picked up. Nothing to do here
				  	  		
				 	  		},{'vm':vm.id,'snapshot':snapshot.id,'name':$('#vboxSnapshotDetailsName').val(),'description':$('#vboxSnapshotDetailsDesc').val()});
				 	  		$(this).dialog('close');
							l.run();
							
						};
						buttons[vcube.utils.trans('Cancel','QIMessageBox')] = function(){
							$(this).dialog('close');
						};
						$('#vboxSnapshotDetails').dialog({'closeOnEscape':false,'width':'600px','height':'auto','buttons':buttons,'modal':true,'autoOpen':true,'dialogClass':'vboxDialogContent','title':'<img src="images/vbox/show_snapshot_details_16px.png" class="vboxDialogTitleIcon" /> '+vcube.utils.trans('Details of %1 (%2)','VBoxSnapshotDetailsDlg').replace('%1',$('<div />').text(snapshot.name).html()).replace('%2',vm.name)});
					};
					l.run();
		  	  	}
		  	}
	  	
	  	
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
			'MachineDataChanged': this.onMachineDataChanged,
			'SnapshotChanged': this.onSnapshotChanged,
			'SnapshotDeleted' : this.onSnapshotDeleted,
			scope: this
		});
		
		
        /* Tab rendered */
        this.control({
        	'viewport > #MainPanel > VMTabs > VMTabSnapshots' : {
        		render: this.onTabRender
        	},
        	'viewport > #MainPanel > VMTabs > VMTabSnapshots toolbar > button' : {
        		click: this.onButtonClick
        	},
        	'viewport > #MainPanel > VMTabs > VMTabSnapshots > treepanel' : {
        		selectionchange: this.updateButtons
        	}
        });
        
        this.callParent();
        
    },
    
    // Snapshot tree and store refs
    snapshotTree: null,
    snapshotTreeStore: null,
    
    
    /* When a toolbar button is clicked */
    onButtonClick: function(btn) {

    	if(!this.snapshotTree.getView().getSelectionModel().selected.length)
    		return;
    	
    	vcube.controller.VMTabSnapshots.snapshotActions[btn.itemId].click(
    			this.snapshotTree.getView().getSelectionModel().getSelection()[0].raw,
    			vcube.vmdatamediator.getVMData(this.selectionItemId),
    			this.snapshotTree.getRootNode());
    },
    
    /* Update buttons */
    updateButtons: function() {
    	
    	var self = this;

    	// Snapshot data
    	var ss = null;
    	if(this.snapshotTree.getView().getSelectionModel().selected.length)
    		ss = this.snapshotTree.getView().getSelectionModel().getSelection()[0].raw;
    	
    	// vm data
    	var vm = vcube.vmdatamediator.getVMData(this.selectionItemId);
    	
    	Ext.each(this.snapshotTree.getDockedItems('toolbar')[0].items.items, function(btn) {
    		
    		
    		if(btn.xtype == 'button') {
    			
    			if(vcube.controller.VMTabSnapshots.snapshotActions[btn.itemId].enabled(ss, vm))
    				btn.enable();
    			else
    				btn.disable();    			
    		}
    		
    		
    	});
    	
    	return;
    	
    	
    },
    
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
    
    /* Repopulate on machine data changed because it could be a snapshot
     * restore
     */
    onMachineDataChanged: function(event) {
    	if(!this.filterEvent(event)) return;
    	this.populate({'id':this.selectionItemId});
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
    		
    		if(!removeTarget) return;
    		
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
    	
    	this.snapshotTree.getView().getSelectionModel().deselectAll();
    	this.updateButtons();

    	// Data is no longer dirty
    	this.dirty = false;
    	
    	// Show loading mask
    	this.controlledTabView.setLoading(true);
    	
    	this.snapshotTreeStore.getProxy().extraParams = vcube.utils.vmAjaxParams(recordData.id);
    	
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
