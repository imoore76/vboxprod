Ext.define('vcube.form.field.sharedfolders', {

	extend: 'Ext.form.field.Base',
    alias: 'widget.sharedfoldersfield',

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
    	store.add(val);
    	
    	console.log(store.getGroups());
    	
    },
    
    initComponent: function(options) {
    	
    	Ext.apply(this,options);
    	
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
			// Selection change
			listeners: {
				
				selectionchange: function(sm, selected) {
					
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
		         }]
			}),
			dockedItems: [{
			    xtype: 'toolbar',
			    dock: 'right',
			    items: [
			        {itemId: 'add', icon: 'images/vbox/sf_add_16px.png'},
			        {itemId: 'edit', icon: 'images/vbox/sf_edit_16px.png'},
			        {itemId: 'remove', icon: 'images/vbox/sf_remove_16px.png'}
			    ]
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