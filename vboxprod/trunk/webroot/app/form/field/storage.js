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
    
    margin: 0,

    mediaStore: Ext.create('Ext.data.Store',{
    	fields: ['id','base']
    }),

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
    		text: Ext.String.htmlEncode(c.name),
    		icon: 'images/vbox/' + vcube.utils.vboxStorage.getBusIcon(c.bus) + '_expand_16px.png',
    		leaf: false,
    		expanded: true
    	}, c));
    	
    	this.tree.getRootNode().appendChild(child);
    	
    	Ext.each(c.mediumAttachments, function(ma) {
    		var maNode = child.createNode(Ext.Object.merge({
    			text: vcube.utils.vboxMedia.getName(ma.medium),
    			icon: 'images/vbox/' + vcube.utils.vboxStorage.getMAIcon(ma) + '_16px.png',
    			leaf: true
    		}, ma));
    		
    		child.appendChild(maNode);
    	});
    },
    
    setValue: function(controllers) {
    
    	var self = this;
    	this.tree.getRootNode().removeAll(true);
    	
    	if(!controllers) controllers = [];
    	
    	Ext.each(controllers, function(c) {
    		
    		self.addController(c);
    		
    	});
    	
    },
    
    initComponent: function(options) {
    	
    	Ext.apply(this,options);
    	
    	this.tree = Ext.create('Ext.tree.Panel',{
    		xtype: 'treepanel',
    		rootVisible: false,
    		viewConfig: {
    			markDirty: false
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
    			         {name:'device', type: 'int'},
    			         'device',
    			         'medium',
    			         {name:'useHostIOCache', type: 'boolean'},
    			         'name',
    			         'controllerType']
    		})
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
    		layout: 'form',
    		frame: false,
    		border: false,
    		items: [{
    			xtype: 'fieldset',
    			title: 'Attributes',
    			layout: 'form',
    			defaults: {
    				labelAlign: 'right',
    				labelWidth: 60
    			},
    			items: [{
    				fieldLabel: 'Name',
    				xtype: 'textfield',
    				name: 'name',
    				enableKeyEvents: true,
    				listeners: {
    					keyup: function(txt) {
    						this.tree.getSelectionModel().getSelection()[0].set('text', Ext.String.htmlEncode(txt.getValue()));
    					},
    					change: function(txt, val) {
    						this.tree.getSelectionModel().getSelection()[0].set({
    							text : Ext.String.htmlEncode(val),
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
    	function ifVal(fn) {
    		return function(val) {
    			if(val) return (fn ? fn(val) : val);
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
    		layout: 'form',
    		hidden: true,
    		defaults: {
    			xtype: 'fieldset',
    			layout: 'form'
    		},
    		items: [{
    			title: 'Attributes',
    			defaults: {
    				labelAlign: 'right',
    				labelWidth: 60
    			},
    			items: [Ext.Object.merge({fieldLabel: 'Floppy Drive'}, slotCbo)]
    		},{
    			title: 'Information',
    			defaults: {
    				labelAlign: 'right',
    				labelWidth: 80
    			},
    			items: [{
		        	fieldLabel: 'Type',
		        	name: 'medium.type',
		        	renderer: ifVal()
		        },{
		        	fieldLabel: 'Size',
		        	name: 'medium.size',
		        	renderer: ifVal(vcube.utils.bytesConvert)
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
    		layout: 'form',
    		hidden: true,
    		border: false,
    		defaults: {
    			xtype: 'fieldset',
    			layout: 'form'
    		},
    		items: [{
    			title: 'Attributes',
    			defaults: {
    				labelAlign: 'right',
    				xtype: 'displayfield'
    			},
    			items: [Ext.Object.merge({fieldLabel: 'CD/DVD Drive'}, slotCbo)
		        ,{
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
    				labelWidth: 80
    			},
    			items: [{
    				fieldLabel: 'Type',
    				name: 'medium.type',
    				renderer: ifVal()
    			},{
    				fieldLabel: 'Size',
    				name: 'medium.size',
    				renderer: ifVal(vcube.utils.bytesConvert)
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
    		layout: 'form',
    		hidden: true,
    		border: false,
    		defaults: {
    			xtype: 'fieldset',
    			layout: 'form'
    		},
    		items: [{
    			title: 'Attributes',
    			defaults: {
    				labelAlign: 'right',
    				xtype: 'displayfield'
    			},
    			items: [
    			        Ext.Object.merge({fieldLabel: 'Hard Disk'}, slotCbo)
    			        ,{
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
    				labelWidth: 80
    			},
    			items: [{
	    			fieldLabel: 'Type (Format)',
	    			name: 'medium',
	    			renderer: ifVal()
	    		},{
	    			fieldLabel: 'Virtual Size',
	    			name: 'medium.logicalSize',
	    			renderer: ifVal(vcube.utils.mbytesConvert)
	    		},{
	    			fieldLabel: 'Actual Size',
	    			name: 'medium.size',
	    			renderer: ifVal(vcube.utils.bytesConvert)
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

    	
    	this.tree.on('selectionchange', function(tree, selection) {
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

    		targetPanel.getForm().setValues(Ext.Object.merge({},selection[0].raw, selection[0].getData()));
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
    		items: [ {html: 'The Storage Tree can contain several controllers of different types. This machine currently has no controllers.'},
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
    		items: [{
    			xtype: 'panel',
    			region: 'center',
    			cls: 'greyPanel',
    			split: true,
    			height: 200,
    			width: 200,
    			layout: 'fit',
        		frame: false,
        		border: false,
    			items: [{
    				xtype: 'panel',
    				layout: 'fit',
    				cls: 'greyPanel',
    				items: [{
    					xtype: 'fieldset',
    					title: 'Storage Tree',
    					layout: 'fit',
    					margin: 4,
    					items: [this.tree]    				    					
    				}]
    			}]
    		},{
    			xtype: 'panel',
        		region: 'east',
        		width: 310,
        		split: true,
        		border: false,
        		cls: 'greyPanel',
        		frame: false,
        		layout: 'fit',
    			items: [this.attribsPanel]
    		}]

    	});

    	this.callParent(arguments);
    	
    	
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