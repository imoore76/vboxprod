Ext.define('vcube.form.field.usbfilters', {

	extend: 'Ext.form.field.Base',
    alias: 'widget.usbfiltersfield',

    mixins: {
        field: 'Ext.form.field.Field'
    },

    combineErrors: true,
    msgTarget: 'side',
    submitFormat: 'c',

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
    	
    },
    
    initComponent: function(options) {
    	
    	Ext.apply(this,options);
    	
    	this.grid = this.childComponent = Ext.create('Ext.grid.Panel',{
    		
			height: 100,
			title: 'USB Device Filters',
			hideHeaders: true,
			frame: true,
			columns: [{
				dataIndex: 'active',
				xtype: 'checkcolumn'
			},{
				dataIndex: 'description'
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
				         {name: 'vendorId', type: 'string'},
				         {name: 'product', type: 'string'},
				         {name: 'remote', type: 'string'},
				         {name: 'name', type: 'string'},
				         {name: 'serialNumber', type: 'string'},
				         {name: 'productId', type:'string'},
				         {name: 'active', type: 'boolean'},
				         {name: 'manufacturer', type: 'string'},
				         {name: 'port', type: 'string'},
				         {name: 'revision', type: 'string'}
				         ]
			}),
			rbar: [
			       {itemId: 'new', icon: 'images/vbox/usb_new_16px.png'},
			       {itemId: 'add', icon: 'images/vbox/usb_add_16px.png'},
			       {itemId: 'edit', icon: 'images/vbox/usb_filter_edit_16px.png'},
			       {itemId: 'remove', icon: 'images/vbox/usb_remove_16px.png'},
			       {itemId: 'up', icon: 'images/vbox/usb_moveup_16px.png'},
			       {itemId: 'down', icon: 'images/vbox/usb_movedown_16px.png'}
			       ],
	       columns: [{
	    	   dataIndex: 'active',
	    	   xtype: 'checkcolumn',
	    	   submitValue: false,
	    	   width: 20
	       },{
	    	   dataIndex: 'name',
	    	   flex: 1
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