Ext.define('vcube.form.field.sharedfolders', {

	extend: 'Ext.form.field.Base',
    alias: 'widget.sharedfoldersfield',
    
    requires: ['vcube.widget.selectfolder'],

    mixins: {
        field: 'Ext.form.field.Field'
    },
    
    statics: {
    	
    	recentSharedFoldersStoreOtherPath: 'Other ...'
    		/*,
    	
    	sfStoreSortFn: function(o1, o2){
        	if(o1.get('path') == vcube.form.field.sharedfolders.recentSharedFoldersStoreOtherPath) return 1;
        	if(o2.get('path') == vcube.form.field.sharedfolders.recentSharedFoldersStoreOtherPath) return -1;
        	return vcube.utils.strnatcasecmp(o1.get('path'), o2.get('path'));
        }*/
    },

    layout: 'fit',
    combineErrors: true,
    msgTarget: 'side',
    submitFormat: 'c',
    
    serverId: null,
    serverNotify: true,
    setServer: function(serverId) {
    	
    	this.serverId = serverId;
    	
    	// Set up recent shared folders store
    	this.recentSharedFoldersStore.setProxy({
	        type: 'localstorage',
	        id  : 'recent-shared-folders-' + serverId
	    });
    	
    	var otherFound = false;
    	this.recentSharedFoldersStore.load(function(records, operation, success) {
			Ext.each(records, function(r) {
				if(r.get('path') == vcube.form.field.sharedfolders.recentSharedFoldersStoreOtherPath) {
					otherFound = true;
					return false;
				}
			});
    	});

    	
    	if(!otherFound)
    		this.recentSharedFoldersStore.add({path:vcube.form.field.sharedfolders.recentSharedFoldersStoreOtherPath});
    	
    },
    
    margin: 0,
    
    
    recentSharedFoldersStore: null,


    getSubmitValue: function() {
    	return this.getValue();
    },
    
    getValue: function() {
    	var filters = [];
    	this.grid.getStore().each(function(record) {
    		filters.push(record.getData());
    	});

    	return filters;
    },
    
    setValue: function(val) {
    
    	var store = this.grid.getStore();
    	store.removeAll();
    	
    	if(!val) val = [];
    	store.loadData(val);
    	
    },
    
    initComponent: function(options) {
    	
    	Ext.apply(this,options);
    	
    	
    	this.recentSharedFoldersStore: Ext.create('Ext.data.Store',{
    		fields: ['id','path'],
    		autoload: false,
    		sortOnLoad: true,
    		remoteSort: false,
    		buffered: false,
    		autoSync: true,
    		sorters: [{
    	        sorterFn: vcube.form.field.sharedfolders.sfStoreSortFn
    	    }],
    		listeners: {
    			add: function(store, records) {				
    				store.sort(vcube.form.field.sharedfolders.sfStoreSortFn);
    			},
    			load: function(store) {
    				store.sort(vcube.form.field.sharedfolders.sfStoreSortFn);
    			}
    		}
        });
    	
        this.sharedFolderDialog = {
        	
        	title: 'Add Share',
        	icon: 'images/vbox/vm_settings_16px.png',
        	height: 200,
        	width: 500,
        	modal: true,
        	layout: 'fit',
        	items: [{
        		xtype: 'form',
        		layout: 'form',
        		listeners: {
        			validitychange: function(frm, valid) {
        				frm.owner.up('.window').down('#ok').setDisabled(!valid);
        			}
        		},
        		frame: true,
        		defaults: {
        			xtype: 'textfield',
        			labelAlign: 'right'
        		},
        		items: [{
    				fieldLabel: 'Folder Path',
        			xtype: 'combo',
    				name: 'hostPath',
    				allowBlank:false,
    				editable: true,
    				store: this.recentSharedFoldersStore,
    				displayField: 'path',
    				valueField: 'path',
    				lastQuery: '',
    				listConfig: {
    			        getInnerTpl: function() {
    			            // here you place the images in your combo
    			            return '<div><tpl if="path==\'' + vcube.form.field.sharedfolders.recentSharedFoldersStoreOtherPath +'\'">'+
    			                      '<img src="images/vbox/select_file_16px.png" align="left">&nbsp;&nbsp;'+
    			                      '</tpl>{path}</div>';
    			        }
    			    },
    				listeners: {
    					
    					change: function(cbo, val, oldVal) {
    						
    						// "Other ... browse for folder 
    						if(val == vcube.form.field.sharedfolders.recentSharedFoldersStoreOtherPath) {
    							
    							console.log(oldVal);
    							
    				    		var browser = Ext.create('vcube.widget.fsbrowser',{
    				    			browserType: 'folder',
    				    			serverId: this.serverId,
    				    			title: 'Select folder...',
    				    			initialPath: (oldVal ? oldVal : null)
    				    		});
    				    		
    				    		Ext.ux.Deferred.when(browser.browse()).done(function(f) {
    				    			cbo.setValue(f);
    				    		});

    							cbo.setValue(oldVal);
    							return;
    						}
    						
    						var text = vcube.utils.basename(val.replace(/[\\|\/]$/,''));
    						
    						// Windows drive letter
    						if(/^[a-z]:[\\|\/]?$/i.test(val)) {
    							text = String(val[0] + '_DRIVE').toUpperCase();
    							// root folder
    						} else if(val == '/') {
    							text = 'root';
    						} else if(!text) {
    							text = val.replace(/\\|\//g, '');
    						}
    						cbo.up('.form').down('[name=name]').setValue(text);
    					},
    					scope: this
    				}
    			},{
        			fieldLabel: 'Folder Name',
        			name: 'name',
        			allowBlank:false
        		},{
        			xtype: 'checkbox',
        			fieldLabel: ' ',
        			labelSeparator: '',
        			boxLabel: 'Read-only',
        			name: 'writable',
        			itemId: 'writable'
        		},{
        			xtype: 'checkbox',
        			fieldLabel: ' ',
        			labelSeparator: '',
        			boxLabel: 'Auto-mount',
        			name: 'autoMount',
        			inputValue: 1
        		},{
        			xtype: 'checkbox',
        			fieldLabel: ' ',
        			labelSeparator: '',
        			boxLabel: 'Make Permanent',
        			inputValue: 'machine',
        			itemId: 'makePermanent',
        			name: 'type'
        		}]
        		
        	}],
        	
    		buttons: [{
    			text: 'OK',
    			itemId: 'ok',
    			disabled: true
    		},{
    			text: 'Cancel',
    			listeners: {
    				click: function(btn) {
    					btn.up('.window').close();
    				}
    			}
    		}]

    		

        };
        
    	this.grid = this.childComponent = Ext.create('Ext.grid.Panel',{
    		
    		title: 'Shared Folders',
			xtype: 'gridpanel',
			height: 300,
			frame: true,
			features: [{
				ftype:'grouping',
				enableGroupingMenu: false,
				groupHeaderTpl: '<tpl if="name==\'machine\'">Machine Folders</tpl><tpl if="name==\'transient\'">Transient Folders</tpl>'
			}],
			columns: [{
				header: 'Name',
				dataIndex: 'name',
				renderer: function(v) {
					return '<div style="margin-left: 24px">'+v+'</div>';
				}
			},{
				header: 'Path',
				dataIndex: 'hostPath',
				flex: 1
			},{
				header: 'Auto-mount',
				dataIndex: 'autoMount',
				width: 80,
				renderer: function(v) {
					return (v ? 'Yes' : 'No');
				}
			},{
				header: 'Access',
				dataIndex: 'writable',
				width: 80,
				renderer: function(v) {
					return (v ? 'Full' : 'Read-only');
				}
			}],
			
			viewConfig: {
				markDirty: false
			},

			listeners: {
				
				itemdblclick: function() {
					this.grid.down('#edit').fireEvent('click');
				},

				selectionchange: function(sm, selected) {
					this.grid.down('#edit').setDisabled(!selected.length);
					this.grid.down('#remove').setDisabled(!selected.length);
				},
				scope: this
			},
			store: Ext.create('Ext.data.Store',{
				fields: [
			         {name: 'accessible', type: 'int'},
			         'name',
			         {name:'autoMount', type: 'int'},
			         {name:'writable', type: 'int'},
			         'lastAccessError',
			         'hostPath',
			         'type'
		         ],
		         groupers: [{
		        	 property: 'type',
				     sorterFn: function(a, b) {
				    	 return vcube.utils.strnatcasecmp(a.data.name, b.data.name);
				    }
		         }],
		         listeners: {
		        	 
	        	 	add: function(store, records) {
	        	 	
	        	 		var sfstore = this.recentSharedFoldersStore;
	        	 		
	        	 		console.log("In add...");
	        	 		console.log(records);
	        	 		for(var i = 0; i < records.length; i++) {
	        	 			
	        	 			console.log(records[i]);
	        	 			// Add to recent list
	        	 			var sfrecord = sfstore.findExact('path',records[i].get('hostPath'));
	        	 			
	        	 			// Doesn't exist.. adding
	        	 			if(sfrecord == -1) {
	        	 				
	        	 				console.log("About to add..")
	        	 				sfstore.add({path:records[i].get('hostPath')});
	        	 				//sfstore.sync();
	        	 			}
	        	 		}
	        	 		
	        	 		console.log(this.recentSharedFoldersStore);
	        	 	},
	        	 	
	        	 	update: function(store, record, op, fields) {
	        	 		
	        	 		if(op != Ext.data.Model.EDIT) return;
	        	 		
	        	 		if(!Ext.Array.contains(fields, 'hostPath')) return;
	        	 		
	        	 		var sfstore = this.recentSharedFoldersStore;
	        	 		
        	 			// Add to recent list
        	 			var sfrecord = sfstore.findExact('path',record.get('hostPath'));
        	 			        	 			
        	 			if(sfrecord == -1) {
        	 				        	 				
        	 				sfstore.add({path:record.get('hostPath')});
        	 				//sfstore.sync();

        	 			}

        	 			
	        	 	},
	        	 	
	        	 	scope: this
		         }
			}),
			dockedItems: [{
			    xtype: 'toolbar',
			    dock: 'right',
			    items: [
			        {
			        	icon: 'images/vbox/sf_add_16px.png',
			        	listeners: {
			        		click: function(btn) {
			        			
			        			var dlg = Ext.create('Ext.window.Window',Ext.apply({title:'Add Share'}, this.sharedFolderDialog));
			        			
			        			if(!vcube.utils.vboxVMStates.isRunning(vcube.storemanager.getStoreRecord('vm',this.up('.window')._data.id)))
			        				dlg.down('#makePermanent').hide();
			        			
			        			

			        			dlg.down('#ok').on('click',function(btn) {
			        				
			        				var data = dlg.down('.form').getForm().getValues();

			        				data.writable = (data.writable ? 0 : 1);
			        				data.autoMount = (data.autoMount ? 1 : 0);			        				
			        				data.type = (dlg.down('#makePermanent').isVisible() && !dlg.down('#makePermanent').getValue() ? 'transient' : 'machine');
			        				
			        				this.grid.getStore().add(data);
			        				btn.up('.window').close();
			        				
			        			},this);
			        			
			        			dlg.show();
			        		},
			        		scope: this
			        	}
			        },{
			        	icon: 'images/vbox/sf_edit_16px.png',
			        	disabled: true,
			        	itemId: 'edit',
			        	listeners: {
			        		click: function() {
			        			
			        			var dlg = Ext.create('Ext.window.Window',this.sharedFolderDialog);
			        			dlg.title = 'Edit Share';
			        			
			        			if(!vcube.utils.vboxVMStates.isRunning(vcube.storemanager.getStoreRecord('vm',this.up('.window')._data.id)))
			        				dlg.down('#makePermanent').hide();
			        			
			        			var data = this.grid.getSelectionModel().getSelection()[0].getData();
			        			data.writable = !(data.writable);
			        			
			        			dlg.down('.form').getForm().setValues(data);
			        						        			
			        			dlg.down('#ok').on('click',function(btn) {
			        				
			        				var data = dlg.down('.form').getForm().getValues();
			        				data.writable = (data.writable ? 0 : 1);
			        				data.autoMount = (data.autoMount ? 1 : 0);
			        				
			        				data.type = (dlg.down('#makePermanent').isVisible() && !dlg.down('#makePermanent').getValue() ? 'transient' : 'machine');
			        				
			        				console.log(dlg.down('.form').getForm().getValues());
			        				console.log(data);

			        				this.grid.getSelectionModel().getSelection()[0].set(data);
			        				btn.up('.window').close();
			        				
			        			},this);
			        			
			        			dlg.show();
			        		},
			        		scope: this
			        	}

			        },{
			        	icon: 'images/vbox/sf_remove_16px.png',
			        	disabled: true,
			        	itemId: 'remove',
			        	listeners: {
			        		
			        		click: function() {
			        			var sm = this.grid.getSelectionModel();
			        			var record = this.grid.getSelectionModel().getSelection()[0];
			        			var store = this.grid.getStore();
			        			var index = store.indexOf(record);
			        			
			        			var nextRecord = store.getAt(index+1);
			        			if(!nextRecord) nextRecord = store.getAt(index-1);
			        			
			        			store.remove(record);
			        			
			        			if(nextRecord) sm.select(nextRecord);
			        			
			        		},
			        		scope: this
			        	}

			        }
			    ]
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