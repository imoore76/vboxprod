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
    	
    	this.tree.getTreeStore().add({
    		text: Ext.String.htmlEncode(c.name),
    		icon: 'images/vbox/' + c.bus.toLowerCase() + '_expand_16px.png',
    		leaf: false
    	})
    },
    
    setValue: function(controllers) {
    
    	var self = this;
    	this.tree.getTreeStore().removeAll();
    	
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
    		region: 'center',
    		split: true    		
    	});
    	
    	this.subPanel = this.childComponent = Ext.create('Ext.panel.Panel',{
    		
    		title: 'Storage',
    		height: 300,
    		frame: true,
    		layout: {
    			type: 'border'
    		},
    		items: [
    		    this.tree,
    		{
    			title: 'Attributes',
    			region: 'east',
    			width: 290,
    			split: true
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