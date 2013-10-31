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
    		title: 'Storage Tree',
    		xtype: 'treepanel',
    		rootVisible: false,
    		viewConfig: {
    			markDirty: false
    		},
    		region: 'center',
    		split: true,
    		
    		store: Ext.create('Ext.data.TreeStore',{
    			fields: ['leaf','expanded','text','icon','iconCls',
    			         'temporaryEject',
    			         'nonRotational',
    			         'medium',
    			         'slot',
    			         'useHostIOCache',
    			         'name',
    			         'controllerType']
    		})
    	});
    	
    	/*
    	 *	Controller Info Panel 
    	 */
    	var controllerInfoPanel = Ext.create('Ext.form.Panel',{
    		hidden: true,
    		frame: true,
    		layout: 'form',
    		defaults: {
    			labelAlign: 'right'
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
    			listeners: {
    				change: function(cb, val) {
    					this.tree.getSelectionModel().getSelection()[0].set('useHostIOCache', (val ? true: false));
    				},
    				scope: this
    			}
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
    	 * Floppy disk Info panel
    	 */
    	var fdInfoPanel = Ext.create('vcube.form.Panel',{
    		layout: 'form',
    		hidden: true,
    		frame: true,
    		defaults: {
    			labelAlign: 'right',
    			xtype: 'displayfield'
    		},
    		items: [{
    			fieldLabel: 'Floppy Drive',
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
    			})
    		},{
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
    	});

    	/*
    	 * CD / DVD Info panel
    	 */
    	var cdInfoPanel = Ext.create('vcube.form.Panel',{
    		layout: 'form',
    		hidden: true,
    		frame: true,
    		defaults: {
    			labelAlign: 'right',
    			xtype: 'displayfield'
    		},
    		items: [{
    			fieldLabel: 'CD/DVD Drive',
    			xtype: 'combo',
    			editable: false,
    			displayField: 'name',
    			valueField: 'value',
    			name: 'slot',
    			lastQuery: '',
    			store: Ext.create('Ext.data.Store',{
    				fields: ['name', 'value'],
    				data: [],
    				autoload: false,
    				remoteSort: false,
    				remoteFilter: false
    			})
    		},{
    			fieldLabel: ' ',
    			labelSeparator: '',
    			xtype: 'checkbox',
    			boxLabel: 'Live CD/DVD',
    			name: 'temporaryEject'
    		},{
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
    	});
    	
    	/*
    	 * Hard disk info panel
    	 */
    	var hdInfoPanel = Ext.create('vcube.form.Panel',{
    		layout: 'form',
    		hidden: true,
    		frame: true,
    		defaults: {
    			labelAlign: 'right',
    			xtype: 'displayfield'
    		},
    		items: [{
    			fieldLabel: 'Hard Disk',
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
    			})
    		},{
    			fieldLabel: ' ',
    			labelSeparator: '',
    			boxLabel: 'Solid-state Drive',
    			xtype: 'checkbox',
    			name: 'nonRotational'
    		},{
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
    			
    			
    			var slots = [];
    			Ext.iterate(vcube.utils.vboxStorage[selection[0].parentNode.raw.bus].slots(), function(k,v) {
    				slots.push({name: v, value: k});
    			});
    			
    			targetPanel.down('[name=slot]').getStore().loadData(slots);

    			// Set correct value
    			targetPanel.down('[name=slot]').setValue(selection[0].raw.port + '-' + selection[0].raw.device);
    			
    			// If there is no medium, set display fields
    			
    			
    			
    		}
    		targetPanel.getForm().setValues(Ext.Object.merge({},selection[0].getData(),selection[0].raw));
    		targetPanel.show();
    		
    	}, this);
    	
    	this.attribsPanel = Ext.create('Ext.panel.Panel',{
    		title: 'Attributes',
    		region: 'east',
    		width: 310,
    		split: true,
    		layout: 'fit',
    		items: [ {frame: true, html: 'The Storage Tree can contain several controllers of different types. This machine currently has no controllers.'},
    		        controllerInfoPanel, cdInfoPanel, fdInfoPanel, hdInfoPanel]
    	})
    	
    	this.subPanel = this.childComponent = Ext.create('Ext.panel.Panel',{
    		
    		title: 'Storage',
    		height: 300,
    		frame: true,
    		layout: {
    			type: 'border'
    		},
    		items: [this.tree, this.attribsPanel]

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