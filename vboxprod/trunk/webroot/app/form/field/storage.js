Ext.define('vcube.form.field.storage', {

	extend: 'Ext.form.field.Base',
    alias: 'widget.storagefield',

    mixins: {
        field: 'Ext.form.field.Field'
    },
    
    layout: 'fit',
    combineErrors: true,
    msgTarget: 'side',
    submitFormat: 'c',
    
    serverNotify: true,
    serverId: null,
    
    setServer: function(serverid) {
    	var self = this;
    	Ext.each(Ext.ComponentQuery.query('MediaSelectButton', this.attribsPanel), function(b) {
    		b.setServer(serverid);
    	});
    	this.serverId = serverid;
    },
    
    margin: 0,
    
    cachedMedia: {},
    
    statics: {
    	
    	browseMedia: function(mediaType, serverId, initialPathO) {
    		
    		var promise = Ext.create('Ext.ux.Deferred');
    		
    		var browser = Ext.create('vcube.widget.fsbrowser',{
    			browserType: mediaType,
    			serverId: serverId,
    			initialPath: initialPathO
    		});
    		
    		var vboxMediaType = 'HardDisk';
    		if(mediaType == 'fd') {
    			vboxMediaType = 'Floppy';
    		} else if (mediaType == 'cd') {
    			vboxMediaType = 'DVD';
    		}
    		
    		Ext.ux.Deferred.when(browser.browse()).done(function(file) {
    			vcube.app.setLoading(true);
    			Ext.ux.Deferred.when(vcube.utils.ajaxRequest('vbox/mediumAdd',{
    				path:file,
    				connector: serverId,
    				type:vboxMediaType
    			})).done(function(data) {
    				promise.resolve(data);
    			}).always(function(){
    				vcube.app.setLoading(false);
    			});
    		});

    		return promise;
    	}
        

    },
    
    getSubmitValue: function() {
    	return this.getValue();
    },
    
    getValue: function() {
    	return '';
    	var filters = [];
    	this.subPanel.getStore().each(function(record) {
    		filters.push(record.getData());
    	});

    	return filters;
    },
    
    addController: function(c) {
    	
    	
    	var child = this.tree.getRootNode().createNode(Ext.Object.merge({
    		text: c.name,
    		icon: 'images/vbox/' + vcube.utils.vboxStorage.getBusIconName(c.bus) + '_collapse_16px.png',
    		leaf: false,
    		iconCls: 'storageTreeExpander',
    		expanded: true
    	}, c));
    	
    	this.tree.getRootNode().appendChild(child);
    	
    	var self = this;
    	
    	Ext.each(c.mediumAttachments, function(ma) {
    		self.addMediumAttachment(child, ma);
    	});
    	
    	// Remove from being available to add
    	this.actions['add' + c.bus + 'Controller'].disable();
    	
    	// Disable add controller if we've hit the max
		if(this.tree.getRootNode().childNodes.length == vcube.utils.vboxStorage.getBusTypes().length) {
			this.actions['addController'].disable();
		}

		return child;
    },
    
    addMediumAttachment: function(c, ma, select) {
    	
		var maNode = c.createNode(Ext.Object.merge({
			text: ma.medium,
			icon: 'images/vbox/' + vcube.utils.vboxStorage.getMAIconName(ma) + '_16px.png',
			cls: 'mediumAttachment',
			leaf: true
		}, ma));
		
		c.appendChild(maNode);
		
		if(select) this.tree.getSelectionModel.select(maNode);
				
    	
		return maNode;
    },
    
    setValue: function(controllers) {
    
    	var self = this;
    	this.tree.getRootNode().removeAll(true);
    	
    	if(!controllers) controllers = [];
    	
    	this.actions['addController'].enable();

    	// Enable all controllers
    	Ext.each(vcube.utils.vboxStorage.getBusTypes(), function(bus) {
    		self.actions['add'+bus+'Controller'].enable();
    	});
    	Ext.each(controllers, function(c) {
    		
    		self.addController(c);
    		
    	});


    	// There were controllers
    	if(controllers.length) {
    		
    		// select first item in tree
    		this.tree.getSelectionModel().selectRange(0,0);
    		    		
    	}
    	
    },
    
    /**
     * Elect next node to be selected if this one is removed
     */
    electNextNode: function(node) {
    	var selectAfter = node.nextSibling;
		if(!selectAfter) selectAfter = node.previousSibling;
		if(!selectAfter) selectAfter = (node.parentNode.isRoot() ? null : node.parentNode);
		return selectAfter;
    },
    
    initComponent: function(options) {
    	
    	Ext.apply(this,options);
    	
    	/**
    	 * Compose actions
    	 */
    	var self = this;

    	// Global actions
    	this.actions = {
    			
    		removeController: new Ext.Action({
    			icon: 'images/vbox/controller_remove_16px.png',
    			text: 'Remove Controller',
    			handler: function() {
    				
    				var selected = this.tree.getSelectionModel().getSelection()[0];
    				
    				// Re-enable adding of this controller type and the global
    				// add controller button
    				this.actions['add' + selected.raw.bus + 'Controller'].enable();
    				this.actions['addController'].enable();
    				
    				selected.removeAll(true);

    				this.tree.getSelectionModel().deselectAll();
    				
    				var selectAfter = this.electNextNode(selected);
    				selected.parentNode.removeChild(selected, true);
    				
    				if(selectAfter) 
    					this.tree.getSelectionModel().select(selectAfter);
    				
    			},
	    		scope: this
    		}),
    		
    		removeAttachment: new Ext.Action({
    			icon: 'images/vbox/attachment_remove_16px.png',
    			text: 'Remove Attachment',
    			handler: function() {
    				
    				var selected = this.tree.getSelectionModel().getSelection()[0];

    				this.tree.getSelectionModel().deselectAll();
    				
    				var selectAfter = this.electNextNode(selected);
    				selected.parentNode.removeChild(selected, true);
    				
    				if(selectAfter) 
    					this.tree.getSelectionModel().select(selectAfter);

    			},
    			scope: this
    		})

    	};
    	    	
    	
    	// add controller actions and compose attachment types
    	var attachmentTypes = {};
    	var attachmentTypeActions = [];
    	var controllerTypeActions = [];
    	Ext.each(vcube.utils.vboxStorage.getBusTypes(), function(bus) {
    		self.actions['add'+bus+'Controller'] = new Ext.Action({
    			text: 'Add ' + bus + ' Controller',
    			busType: bus,
    			icon: 'images/vbox/' + vcube.utils.vboxStorage.getBusIconName(bus) + '_add_16px.png',
    			handler: function(btn) {
    				
    				var controller = {
        					name: btn.busType,
        					bus: btn.busType,
        					mediumAttachments: []
        				};
    				
    				var busInfo = vcube.utils.vboxStorage[btn.busType];
    				if(busInfo.configurablePortCount) {
    					controller.portCount = busInfo.maxPortCount
    				}
    				controller.controllerType = busInfo.types[0];
    				controller.useHostIOCache = !!(busInfo['useHostIOCacheDefault']);
    				
    				var node = this.addController(controller);
    				this.tree.getSelectionModel().select(node);
				},
				scope: self
    			
    		});
    		
    		controllerTypeActions.push(self.actions['add'+bus+'Controller']);
    		
    		Ext.each(vcube.utils.vboxStorage[bus].driveTypes, function(d) {
    			
    			if(attachmentTypes[d]) return;
    			attachmentTypes[d] = true;
    			
    			self.actions['add'+d+'Attachment'] = new Ext.Action({
        			text: 'Add ' + vcube.utils.vboxStorage.getMATypeText(d) + (d != 'HardDisk' ? ' Device'  : ''),
        			attachmentType: d,
        			icon: 'images/vbox/' + vcube.utils.vboxStorage.getMAIconName({type:d}) + '_add_16px.png',
        			handler: function(btn) {
        				
        				var controller = self.tree.getSelectionModel().getSelection()[0];
        				var buttons = [];
        				var q = '';
        				
        				var electSlot = function() {
        					
        					var slot = null;
        					
        					var selection = self.tree.getSelectionModel().getSelection()[0];
        					
        	    			// Get used slots
        	    			var usedSlots = {};
        	    			selection.eachChild(function(n) {
        	    				if(n.internalId != selection.internalId) {
        	    					usedSlots[n.get('port') + '-' + n.get('device')] = true;
        	    				}
        	    			});
        	    			
        	    			Ext.iterate(vcube.utils.vboxStorage[selection.raw.bus].slots(), function(k,v) {
        	    				if(!usedSlots[k]) {
        	    					slot = k;
        	    					return false;
        	    				}
        	    			});

        	    			return slot.split('-');

        				};
        				
        				switch(btn.attachmentType) {
        				
	        				case 'HardDisk':
	        					break;
	        					
	        				case 'DVD':
	        					
	        					q = String('You are about to add a new CD/DVD drive to the controller <b>%1</b>.<p>Would you'+
		        						'like to choose a virtual CD/DVD disk to put in the drive or to leave '+
		        						'it empty for now?</p>').replace('%1', Ext.String.htmlEncode(controller.get('name')));
		        					
	        					buttons = [{
	        						text: 'Choose disk',
	        						handler: function(btn) {
	        							var self = this;
	        							Ext.ux.Deferred.when(vcube.form.field.storage.browseMedia('cd', this.serverId)).done(function(m) {
	        								var slot = electSlot();
	        								if(!slot) return;
	        								self.tree.getSelectionModel().select(self.addMediumAttachment(self.tree.getSelectionModel().getSelection()[0], {
		        								type: 'DVD',
		        								port: slot[0],
		        								device: slot[1],
		        								medium: m
		        							}));
	        								btn.up('.window').close();
	        							});
	        						},
	        						scope: self
	        					},{
	        						text: 'Leave empty',
	        						handler: function(btn) {
        								var slot = electSlot();
        								if(!slot) return;
        								this.tree.getSelectionModel().select(this.addMediumAttachment(self.tree.getSelectionModel().getSelection()[0], {
	        								type: 'DVD',
	        								port: slot[0],
	        								device: slot[1],
	        								medium: null
	        							}));
	        							btn.up('.window').close();
	        						},
	        						scope: self
	        					}];
	        					break;
	        					
	        				case 'Floppy':

	        					q = String('You are about to add a new floppy drive to the controller <b>%1</b>.<p>Would you'+
	        						'like to choose a virtual floppy disk to put in the drive or to leave '+
	        						'it empty for now?</p>').replace('%1', Ext.String.htmlEncode(controller.get('name')));
	        					
	        					buttons = [{
	        						text: 'Choose disk',
	        						handler: function(btn) {
	        							var self = this;
	        							Ext.ux.Deferred.when(vcube.form.field.storage.browseMedia('fd', this.serverId)).done(function(m) {
	        								var slot = electSlot();
	        								if(!slot) return;
	        								self.tree.getSelectionModel().select(self.addMediumAttachment(self.tree.getSelectionModel().getSelection()[0], {
		        								type: 'Floppy',
		        								port: slot[0],
		        								device: slot[1],
		        								medium: m
		        							}));
	        								btn.up('.window').close();
	        							});
	        						},
	        						scope: self
	        					},{
	        						text: 'Leave empty',
	        						handler: function(btn) {
	        							var slot = electSlot();
	        							if(!slot) return;
	        							this.tree.getSelectionModel().select(this.addMediumAttachment(self.tree.getSelectionModel().getSelection()[0], {
	        								type: 'Floppy',
	        								port: slot[0],
	        								device: slot[1],
	        								medium: null
	        							}));
	        							btn.up('.window').close();
	        						},
	        						scope: self
	        					}];
	        					break;
	        					
        				}
        				vcube.utils.confirm(q,buttons);
    				},
    				scope: self
        			
        		});
    			
    			attachmentTypeActions.push(self.actions['add'+d+'Attachment']);
    			
    		});
    	});
    	
    	// Menus
    	var controllerTypeActionsMenu = Ext.create('Ext.menu.Menu',{
    		items: controllerTypeActions
    	});
    	
    	var attachmentTypeActionsMenu = Ext.create('Ext.menu.Menu',{
    		items: attachmentTypeActions
    	});
    	
    	var attachmentMenu = Ext.create('Ext.menu.Menu',{
    		items: [this.actions.removeAttachment]
    	});
    	
    	var controllerMenu = Ext.create('Ext.menu.Menu',{
    		items: attachmentTypeActions.concat(['-',this.actions.removeController])
    	});
    	
    	// Make sure these aren't left behind
    	this.on('destroy',function() {
    		Ext.each([controllerTypeActionsMenu, attachmentTypeActionsMenu,
    		          attachmentMenu, controllerMenu],function(m) { Ext.destroy(m); });
    	});
    	
    	this.actions = Ext.Object.merge(this.actions, {
    		
    		addController : new Ext.Action({
    			icon: 'images/vbox/controller_add_16px.png',
    			handler: function(btn) {
    			    var coords = btn.getXY();
    			    coords[1] = coords[1] + btn.getHeight();
    			    controllerTypeActionsMenu.showAt(coords);
    			}
    		}),
    		addAttachment: new Ext.Action({
    			icon: 'images/vbox/attachment_add_16px.png',
    			text: 'Add Attachment',
    			handler: function(btn) {
    				
    				// If there is only one visible item, don't show the menu
    				// just run the item handler
    				var bus = this.tree.getSelectionModel().getSelection()[0].raw.bus;
    				if(vcube.utils.vboxStorage[bus].driveTypes.length == 1) {
    					var action = this.actions['add' + (vcube.utils.vboxStorage[bus].driveTypes[0]) + 'Attachment'].initialConfig;
    					action.handler(action);
    					return;
    				}

    				var coords = btn.getXY();
    			    coords[1] = coords[1] + btn.getHeight();
    			    attachmentTypeActionsMenu.showAt(coords);
    			},
    			scope: this
    		})
    	
    	});

    	
    	/**
    	 * Storage tree panel
    	 */
    	this.tree = Ext.create('Ext.tree.Panel',{
    		xtype: 'treepanel',
    		cls: 'storageTree',
    		scroll: 'vertical',
    		rootVisible: false,
    		hideHeaders: true,
    		border: false,
    		viewConfig: {
    			markDirty: false,
    			expanderSelector: '.storageTreeExpander'
    		},
    		columns : [{
                 xtype    : 'treecolumn',
                 text     : 'Name',
                 dataIndex: 'text',
                 flex: 1,
                 renderer: function(val,m,record) {
                	 if(record.get('leaf')) {
                		 return vcube.utils.vboxMedia.getName(record.get('medium'));
                	 }
                	 return 'Controller: ' + Ext.String.htmlEncode(val);
                 }
    		},{
    			dataIndex: 'leaf',
    			cls: 'gridCellButtons',
    			width: 42,
    			padding: '0 2 0 0',
    			renderer: function(val, meta, record) {
    				
    				if(val) return '';
    				
    				var self = this;
    				
    				var id = record.internalId+'-'+Ext.id();
    				
    				Ext.Function.defer(function() {
    					
    					Ext.each(vcube.utils.vboxStorage[record.raw.bus].driveTypes, function(dt) {
    						Ext.create('Ext.button.Button',Ext.Object.merge({
    								renderTo: document.getElementById(id),
    								baseAction: self.actions['add' + dt + 'Attachment']
    							},
    							self.actions['add' + dt + 'Attachment'].initialConfig));
    					});
    				},1000);
    				
    				return '<div class="buttonContainer" id="'+id+'"></div>';
    				
    			},
    			scope: this
    	            
    		}],
    		listeners: {
    			
    			// Context menu for tree
    			containercontextmenu: function(t, e) {
		    		e.stopEvent();
		    		controllerTypeActionsMenu.showAt(e.getXY());
    			},
    			
    			// Context menu for item
    	    	itemcontextmenu: function(t,r,i,index,e) {
    	    		e.stopEvent();
    	    		if(r.raw.mediumAttachments) {
    	    			controllerMenu.showAt(e.getXY());
    	    		} else {
    	    			attachmentMenu.showAt(e.getXY());
    	    		}

    	    	},

    			
    			// Update actions on selection change
    			selectionchange: function(sm, selected) {
    				
    				var self = this;
    				
    				// Disable all actions at first
    				Ext.iterate(this.actions, function(k,v) {
    					// add controllers are handled elsewhere
    					if(k == 'removeController' || k.indexOf('Controller') == -1) v.disable();
    				});

    				// No Selection
    				if(!selected[0]) {
    				
    					this.actions['addAttachment'].disable();
    					
					// Controller select
    				} else if(selected[0].raw.mediumAttachments) {
    					

    					this.actions['removeController'].enable();
    					
    					// hide all unsupported device types
    					Ext.each(['HardDisk','DVD','Floppy'], function(dt) {
    						self.actions['add' + dt + 'Attachment'].setHidden(!Ext.Array.contains(vcube.utils.vboxStorage[selected[0].raw.bus].driveTypes, dt));
    					});
    					
    					// Disable all at first
    					Ext.each(vcube.utils.vboxStorage[selected[0].raw.bus].driveTypes, function(dt){
							self.actions['add' + dt + 'Attachment'].disable();
						});

    					// We have not hit the max device count yet
    					if(selected[0].childNodes.length != (vcube.utils.vboxStorage[selected[0].raw.bus].maxPortCount
    							* vcube.utils.vboxStorage[selected[0].raw.bus].maxDevicesPerPortCount)) {
    						
    						this.actions['addAttachment'].enable();
    						
    						Ext.each(vcube.utils.vboxStorage[selected[0].raw.bus].driveTypes, function(dt){
    							self.actions['add' + dt + 'Attachment'].enable();
    						});
    					}
    					
    					
    				// Medium attachment select
    				} else {
    					
    					this.actions['removeAttachment'].enable();
    					
    				}
    				
    			},
    			scope: this
    		},
    		store: Ext.create('Ext.data.TreeStore',{
    			
    			fields: [
    			         {name: 'leaf', type: 'boolean'},
    			         {name:'expanded', type: 'boolean'},
    			         'text','icon','iconCls',
    			         {name: 'temporaryEject', type: 'boolean'},
    			         {name: 'nonRotational', type: 'boolean'},
    			         'medium',
    			         {name:'port', type: 'int'},
    			         {name: 'portCount', type: 'int'},
    			         {name:'device', type: 'int'},
    			         'device',
    			         'medium',
    			         {name:'useHostIOCache', type: 'boolean'},
    			         'name',
    			         'controllerType'],

		         listeners: {
	    				collapse: function(node) {
	    					if(node.raw.bus)
	    						node.set('icon','images/vbox/' + vcube.utils.vboxStorage.getBusIconName(node.raw.bus) + '_expand_16px.png');
	    				},
	    				expand: function(node) {
	    					if(node.raw.bus)
	    						node.set('icon','images/vbox/' + vcube.utils.vboxStorage.getBusIconName(node.raw.bus) + '_collapse_16px.png');
	    				}
	    			}

    		}),
			dockedItems: [{
			    xtype: 'toolbar',
			    dock: 'bottom',
			    items: ['->',this.actions.addAttachment, this.actions.removeAttachment, this.actions.addController, this.actions.removeController],
			    listeners: {
			    	// remove text and make them tooltips
			    	afterrender: function(tbar) {
						Ext.each(tbar.items.items,function(item) {
							if(item.text) {
								item.setTooltip(item.text + ' &nbsp; ');
								item.setText('');
							}
						})
			    	}
			    }
    		}]
    	});
    	
    	/*
    	 * Check box listener
    	 */
    	var cbListener = {
			change: function(cb, val) {
				this.tree.getSelectionModel().getSelection()[0].set(cb.name, val);
			},
			scope: this
    	};
    	

    	/*
    	 *	Controller Info Panel 
    	 */
    	var controllerInfoPanel = Ext.create('vcube.form.Panel',{
    		hidden: true,
    		frame: false,
    		border: false,
    		items: [{
    			xtype: 'fieldset',
    			title: 'Attributes',
    			layout: 'form',
    			defaults: {
    				labelAlign: 'right',
    				labelWidth: 80
    			},
    			items: [{
    				fieldLabel: 'Name',
    				xtype: 'textfield',
    				name: 'name',
    				enableKeyEvents: true,
    				allowBlank: false,
    				listeners: {
    					change: function(txt, val) {
    						this.tree.getSelectionModel().getSelection()[0].set({
    							text : val,
    							name: val
    						});
    					},
    					scope: this
    				}
    			},{
    				fieldLabel: 'Type',
    				name: 'controllerType',
    				xtype: 'combo',
    				displayField: 'name',
    				valueField: 'value',
    				editable: false,
    				lastQuery: '',
    				store: Ext.create('Ext.data.Store',{
    					fields: ['name','value'],
    					data: []
    				}),
    				listeners: {
    					change: function(cbo, val) {
    						this.tree.getSelectionModel().getSelection()[0].set('controllerType', val);
    					},
    					scope: this
    				}
    			},{
    				xtype: 'numberfield',
    				fieldLabel: 'Port Count',
    				minValue: 1,
    				maxValue: 30,
    				name: 'portCount',
    				listeners: {
    					change: function(cbo, val) {
    						if(val >= cbo.minValue && val <= cbo.maxValue)
    							this.tree.getSelectionModel().getSelection()[0].set('portCount', val);
    					},
    					scope: this
    				},
    			},{
    				xtype: 'checkbox',
    				fieldLabel: ' ',
    				labelSeparator: '',
    				boxLabel: 'Use Host I/O Cache',
    				name: 'useHostIOCache',
    				listeners: cbListener
    			}]
    			
    		}]
    	});
    	
    	/* Renderer generator */
    	function ifVal(fn, asInt) {
    		return function(val) {
    			if(val && ((asInt && vcube.utils.toInt(val) > 0) || !asInt)) return (fn ? fn(val) : val);
    			return '--';    			
    		}
    	}

    	/* 
    	 * Slot combo config data
    	 */
    	var slotCbo = {
			xtype: 'combo',
			displayField: 'name',
			valueField: 'value',
			editable: false,
			name: 'slot',
			lastQuery: '',
			value: null,
			store: Ext.create('Ext.data.Store',{
				autoload: false,
				remoteSort: false,
				remoteFilter: false,
				data: [],
				fields: ['name', 'value']
			}),
			listeners: {
				change: function(cbo, val) {
					var slot = val.split('-');
					this.tree.getSelectionModel().getSelection()[0].set({
						port: slot[0],
						device: slot[1]
					});
				},
				scope: this
			}
    	};
    	
    	/*
    	 * Floppy disk Info panel
    	 */
    	var fdInfoPanel = Ext.create('vcube.form.Panel',{
    		hidden: true,
    		border: false,
    		defaults: {
    			xtype: 'fieldset',
    			layout: 'form',
    			value: '',
				defaults: {
					labelAlign: 'right',
					labelWidth: 80,
					xtype: 'displayfield',
					value: '',
				}
    		},
    		items: [{
    			title: 'Attributes',
    			items: [{
    				xtype: 'fieldcontainer',
    				layout: 'hbox',
    				items: [
    					Ext.Object.merge({labelAlign: 'right', fieldLabel: 'Floppy Drive', flex: 1, labelWidth: 80}, slotCbo),
    					{
    						xtype: 'MediaSelectButton',
    						itemId: 'mediaselect',
    						mediaType: 'fd',
    						serverId: this.serverId,
    						callback: function(medium) {
    							this.tree.getSelectionModel().getSelection()[0].set('medium',medium);
    							fdInfoPanel.getForm().setValues(this.tree.getSelectionModel().getSelection()[0].getData(), true);
    						},
    						scope: this
    					}
    				]
    			}]
    		},{
    			title: 'Information',
    			items: [{
		        	fieldLabel: 'Type',
		        	name: 'medium.type',
		        	renderer: ifVal()
		        },{
		        	fieldLabel: 'Size',
		        	name: 'medium.size',
		        	renderer: ifVal(vcube.utils.bytesConvert, true)
		        },{
		        	fieldLabel: 'Location',
		        	name: 'medium.location',
		        	renderer: ifVal()
		        },{
		        	fieldLabel: 'Attached to',
		        	name: 'medium.attachedTo',
		        	renderer: ifVal()
		        }]
    		}]
    	});

    	/*
    	 * CD / DVD Info panel
    	 */
    	var cdInfoPanel = Ext.create('vcube.form.Panel',{
    		hidden: true,
    		border: false,
    		defaults: {
    			xtype: 'fieldset',
    			layout: 'form',
    			value: '',
    		},
    		items: [{
    			title: 'Attributes',
    			defaults: {
    				labelAlign: 'right',
    				xtype: 'displayfield',
    				value: '',
    			},
    			items: [{
    				xtype: 'fieldcontainer',
    				layout: 'hbox',
    				items: [
    					Ext.Object.merge({labelAlign: 'right', fieldLabel: 'CD/DVD Drive', flex: 1}, slotCbo),
    					{
    						xtype: 'MediaSelectButton',
    						itemId: 'mediaselect',
    						mediaType: 'cd',
    						serverId: this.serverId,
    						callback: function(medium) {
    							this.tree.getSelectionModel().getSelection()[0].set('medium',medium);
    							cdInfoPanel.getForm().setValues(this.tree.getSelectionModel().getSelection()[0].getData(), true);
    						},
    						scope: this
    					}
    				]
    			},{
    				fieldLabel: ' ',
    				labelSeparator: '',
    				xtype: 'checkbox',
    				boxLabel: 'Live CD/DVD',
    				name: 'temporaryEject',
    				listeners: cbListener
    			}]
    		},{
    			title: 'Information',
    			defaults: {
    				labelAlign: 'right',
    				xtype: 'displayfield',
    				labelWidth: 80,
    				value: '',
    			},
    			items: [{
    				fieldLabel: 'Type',
    				name: 'medium.type',
    				renderer: ifVal()
    			},{
    				fieldLabel: 'Size',
    				name: 'medium.size',
    				renderer: ifVal(vcube.utils.bytesConvert, true)
    			},{
    				fieldLabel: 'Location',
    				name: 'medium.location',
    				renderer: ifVal()
    			},{
    				fieldLabel: 'Attached to',
    				name: 'medium.attachedTo',
    				renderer: ifVal()    				
    			}]
    		}]
    	});
    	
    	/*
    	 * Hard disk info panel
    	 */
    	var hdInfoPanel = Ext.create('vcube.form.Panel',{
    		hidden: true,
    		border: false,
    		defaults: {
    			xtype: 'fieldset',
    			layout: 'form',
    			value: ''
    		},
    		items: [{
    			title: 'Attributes',
    			defaults: {
    				labelAlign: 'right',
    				xtype: 'displayfield',
    				value: ''
    			},
    			items: [{
    				xtype: 'fieldcontainer',
    				layout: 'hbox',
    				items: [
    					Ext.Object.merge({labelAlign: 'right', fieldLabel: 'Hard Disk', flex: 1}, slotCbo),
    					{
    						xtype: 'MediaSelectButton',
    						itemId: 'mediaselect',
    						mediaType: 'hd',
    						serverId: this.serverId,
    						callback: function(medium) {
    							this.tree.getSelectionModel().getSelection()[0].set('medium',medium);
    							hdInfoPanel.getForm().setValues(this.tree.getSelectionModel().getSelection()[0].getData(), true);
    						},
    						scope: this
    					}
    				]
    			},{
		        	fieldLabel: ' ',
		        	labelSeparator: '',
		        	boxLabel: 'Solid-state Drive',
		        	xtype: 'checkbox',
		        	name: 'nonRotational',
		        	listeners: cbListener
		        }]
    		},{
    			title: 'Information',
    			defaults: {
    				labelAlign: 'right',
    				xtype: 'displayfield',
    				labelWidth: 90
    			},
    			items: [{
	    			fieldLabel: 'Type (Format)',
	    			name: 'medium',
	    			renderer: ifVal()
	    		},{
	    			fieldLabel: 'Virtual Size',
	    			name: 'medium.logicalSize',
	    			renderer: ifVal(vcube.utils.mbytesConvert, true)
	    		},{
	    			fieldLabel: 'Actual Size',
	    			name: 'medium.size',
	    			renderer: ifVal(vcube.utils.bytesConvert, true)
	    		},{
	    			fieldLabel: 'Details',
	    			name: 'medium.variant',
	    			renderer: ifVal()
	    		},{
	    			fieldLabel: 'Location',
	    			name: 'medium.location',
	    			renderer: ifVal()
	    		},{
	    			fieldLabel: 'Attached to',
	    			name: 'medium.attachedTo',
	    			renderer: ifVal()
	    		}]
    		}]
    	});

    	
    	this.tree.on('selectionchange', function(sm, selection) {
    		var self = this;
    		Ext.each(this.attribsPanel.items.items, function(p) {
    			p.hide();
    		});
    		
    		if(!selection.length) {
    			this.attribsPanel.items.items[0].show();
    			return;
    		}
    		
    		var targetPanel = null;

    		// Controller
    		if(!selection[0].get('leaf')) {
    			
    			targetPanel = controllerInfoPanel;
    			
    			// Load controller types combo
    			controllerInfoPanel.down('[name=controllerType]').getStore().loadData(vcube.utils.vboxStorage.getControllerTypes(selection[0].raw.bus));
    			
    			// Setup port count
    			if(vcube.utils.vboxStorage[selection[0].raw.bus].configurablePortCount) {
    				
    				var f = controllerInfoPanel.down('[name=portCount]');
    				
    				var maxPortNum = 0;
    				
    				Ext.each(selection[0].childNodes, function(node) {
    					maxPortNum = Math.max(maxPortNum, (node.get('port')+1));
    				});
    				// Set min and max values
    				f.setMinValue(maxPortNum);
    				f.setMaxValue(vcube.utils.vboxStorage[selection[0].raw.bus].maxPortCount);
    				f.show();
    				
    				
    			} else {
    				controllerInfoPanel.down('[name=portCount]').hide();
    			}
    			
    		// Medium attachment
    		} else {
    			
    			switch(selection[0].raw.type) {
	    			case 'Floppy':
	    				targetPanel = fdInfoPanel;
	    				break;
	    			case 'DVD':
	    				targetPanel = cdInfoPanel;
	    				break;
	    			default:
	    				targetPanel = hdInfoPanel;
    			}
    			// Update medium select
    			targetPanel.down('#mediaselect').updateMenu(selection[0].get('medium'));
    			
    			// Get used slots
    			var usedSlots = {};
    			selection[0].parentNode.eachChild(function(n) {
    				if(n.internalId != selection[0].internalId) {
    					usedSlots[n.get('port') + '-' + n.get('device')] = true;
    				}
    			});
    			
    			// Populate with unused slots
    			var slots = [];
    			Ext.iterate(vcube.utils.vboxStorage[selection[0].parentNode.raw.bus].slots(), function(k,v) {
    				if(!usedSlots[k])
    					slots.push({name: v, value: k});
    			});
    			
    			targetPanel.down('[name=slot]').getStore().loadData(slots);

    			// Set correct value
    			targetPanel.down('[name=slot]').setValue(selection[0].get('port') + '-' + selection[0].get('device'));
    			
    			
    			
    		}

    		var mdetails = {};
    		if(selection[0].raw.medium) {
    			
    			var mid = selection[0].raw.medium.id;
    			
    			console.log(selection[0].raw.medium);
    			
    			console.log({medium:mid,'type':selection[0].raw.deviceType,connector:this.up('.window').serverId});
    			
    			if(this.cachedMedia[mid]) {
    				mdetails = this.cachedMedia[mid];
    			} else {
    				Ext.ux.Deferred.when(vcube.utils.ajaxRequest('vbox/mediumGetDetails',{medium:mid,'type':selection[0].raw.medium.deviceType,connector:this.up('.window').serverId})).done(function(data) {
    					
    					console.log("Got ...");
    					console.log(data);
    					
    					// Add to cache
    					self.cachedMedia[mid] = data;
    					
    					// Make sure the selection has not changed
    					if(sm.getSelection().length && sm.getSelection()[0].raw.medium && sm.getSelection()[0].raw.medium.id == mid) {
    						targetPanel.getForm().setValues(Ext.Object.merge({},selection[0].raw, selection[0].getData(),{'medium':data}), true);
    					}
    				});
    			}
    			
    		}
			
 
    		targetPanel.getForm().setValues(Ext.Object.merge({},selection[0].raw, selection[0].getData(),{'medium':mdetails}), true);
    		targetPanel.show();
    		
    	}, this);
    	
    	this.attribsPanel = Ext.create('Ext.panel.Panel',{
    		layout: 'fit',
    		margin: '0 6 0 6',
    		frame: false,
    		border: false,
    		cls: 'greyPanel',
    		defaults: {
    			cls: 'greyPanel',
    			border: false
    		},
    		items: [ {padding: 8, html: 'The Storage Tree can contain several controllers of different types. This machine currently has no controllers.'},
    		        controllerInfoPanel, cdInfoPanel, fdInfoPanel, hdInfoPanel]
    	})
    	
    	this.subPanel = this.childComponent = Ext.create('Ext.panel.Panel',{
    		
    		title: 'Storage',
    		height: 300,
    		frame: false,
    		border: true,
    		layout: {
    			type: 'border'
    		},
    		defaults: {
    		    split: true,
    		    layout: 'fit',
    		    frame: false,
    		    border: false
    		},
    		items: [{
    			xtype: 'panel',
    			region: 'center',
    			height: 200,
    			width: 200,
    			items: [{
    				xtype: 'panel',
    				layout: 'fit',
    				cls: 'greyPanel',
    				border: false,
    				items: [{
    					xtype: 'fieldset',
    					title: 'Storage Tree',
    					layout: 'fit',
    					margin: 4,
    					border: true,
    					cls: 'greyPanel',
    					items: [this.tree]			
    				}]
    			}]
    		},{
    			xtype: 'panel',
        		region: 'east',
        		width: 310,
        		cls: 'greyPanel',
        		layout: 'fit',
    			items: [this.attribsPanel]
    		}]

    	});

    	this.callParent(arguments);
    	
    	this.on('destroy', function() { Ext.destroy(this.childComponent); }, this);
    	
    	
    },
    
    // Generates the child component markup and let Ext.form.field.Base handle the rest
    getSubTplMarkup: function() {
        // generateMarkup will append to the passed empty array and return it
    	// but we want to return a single string
        return Ext.DomHelper.generateMarkup(this.childComponent.getRenderTree(), []).join('');
    },

    // Regular containers implements this method to call finishRender for each of their
    // child, and we need to do the same for the component to display smoothly
    finishRenderChildren: function() {
        this.callParent(arguments);
        this.childComponent.finishRender();
    },

    // --- Resizing ---
    // This is important for layout notably
    onResize: function(w, h) {
        this.callParent(arguments);
        this.childComponent.setSize(w - this.getLabelWidth(), h);
    }
	

});


Ext.define('vcube.form.field.storage.MediaSelectButton',{
	
	alias: 'widget.MediaSelectButton',
	
	extend: 'Ext.button.Button',
	mediaType: 'cd', // One of cd / fd / hd
	
	margin: '2 0 0 4',
		
	callback: null,
	serverId: null,
	
	scope: null,
	
	setServer: function(serverId) {
		this.serverId = serverId;
		if(this.mediaType != 'hd') this.loadDrives();
	},
	
	browseLocation: null,
	
	updateMenu: function(media) {
		var empty = this.menu.down('#empty');
		if(media && media.location && !media.hostDrive) {
			this.browseLocation = media.location;
		} else {
			this.browseLocation = null;
		}
		if(!empty) return;
		empty.setDisabled(!media);
	},
	
	browseMedia: function() {
		
		var self = this;
		
		Ext.ux.Deferred.when(vcube.form.field.storage.browseMedia(this.mediaType, this.serverId, this.browseLocation)).done(function(data){
			self.callback.call(self.scope, data);
		});
		
	},
	
	loadDrives: function() {
		
		var self = this;
		
		// Load host drives
		Ext.ux.Deferred.when(vcube.utils.ajaxRequest('vbox/hostGet'+(this.mediaType == 'fd' ? 'Floppy' : 'DVD') + 'Drives',{connector:this.serverId})).done(function(drives){
			self.menu.remove('hostdrives', true);
			Ext.each(drives, function(d) {
				self.menu.insert(1, {
					text: vcube.utils.vboxMedia.getName(d),
					_medium: d,
					handler: function(item) {
						self.callback.call(self.scope, item.initialConfig._medium);
						self.updateMenu(item.initialConfig._medium);
					},
					scope: self
				})
			});
		});
		
	},
	
	initComponent: function(config) {
		
		Ext.apply(this, config);
		
		switch(this.mediaType) {
		
			// Floppy media
			case 'fd':
				this.icon = 'images/vbox/fd_16px.png',
				this.menu = [{
					text: 'Choose a virtual floppy disk file...',
					icon: 'images/vbox/select_file_16px.png',
					handler: function() {
						this.browseMedia();
					},
					scope: this
				},{
					text: 'Loading host drives...',
					itemId: 'hostdrives'
				},
				'-',
				{
					text: 'Remove disk from virtual drive',
					itemId: 'empty',
					icon: 'images/vbox/fd_unmount_16px.png',
					handler: function() {
						this.callback.call(this.scope, null);
						this.updateMenu(null);
					},
					scope: this
				}];
				
				if(this.serverId) this.loadDrives();
				
				break;
				
			// CD/DVD media
			case 'cd':
				this.icon = 'images/vbox/cd_16px.png',
				this.menu = [{
					text: 'Choose a virtual CD/DVD disk file...',
					icon: 'images/vbox/select_file_16px.png',
					handler: function() {
						this.browseMedia();
					},
					scope: this
				},{
					text: 'Loading host drives...',
					itemId: 'hostdrives'
				},
				'-',
				{
					text: 'Remove disk from virtual drive',
					itemId: 'empty',
					icon: 'images/vbox/cd_unmount_16px.png',
					handler: function() {
						this.callback.call(this.scope, null);
						this.updateMenu(null);
					},
					scope: this
				}];
				
				if(this.serverId) this.loadDrives();
				break;
				
			// Hard disk
			default:
				this.icon = 'images/vbox/hd_16px.png',
				this.menu = [{
					text: 'Create a new hard disk...',
					icon: 'images/vbox/vdm_new_16px.png',
					handler: function() {
						
					},
					scope: this
				},{
					text: 'Choose a virtual hard disk file...',
					icon: 'images/vbox/select_file_16px.png',
					handler: function() {
						this.browseMedia();
					},
					scope: this
				}]
		}
		
		this.callParent(arguments);
		
	}
});