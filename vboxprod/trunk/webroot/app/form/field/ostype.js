Ext.define('vcube.form.field.ostype', {
    extend: 'Ext.form.field.Base',
    mixins: {
        field: 'Ext.form.field.Field'
    },
    alias: 'widget.ostypefield',
    combineErrors: true,
    border: false,
    msgTarget: 'side',
    submitFormat: 'c',
    
    height:56,
    
    defaults: {},
    
    getSubmitValue: function() {
    	return this.getValue();
    },
    
    getValue: function() {
    	this.osTypeIdCombo.getValue();
    },
    
    setValue: function(val) {
    	this.osTypeIdCombo.setValue(val);
    },
    
    initComponent: function(options) {
    	
    	Ext.apply(this, options);
    	
    	this.osTypeImage = Ext.create('Ext.Img',{
			src: 'images/vbox/blank.gif',
			height: 32,
			width: 32,
			margin: 8

    	});
    	
    	this.osTypeIdCombo = Ext.create('Ext.form.field.ComboBox',{
			editable: false,
			fieldLabel: 'Version',
			itemId: 'OSTypeVersion',
			labelAlign: 'right',
			submitValue: false,
			listeners: {
				change: function(cbo, value) {
					this.osTypeImage.setSrc('images/vbox/'+vcube.utils.vboxGuestOSTypeIcon(value));
				},
				scope: this
			}
    	});
    	
    	this.childComponent = Ext.create('Ext.panel.Panel',{
    	    layout: {
    	    	type: 'hbox'
    	    },
    	    border: false,
    		bodyStyle: { background: 'transparent' },
    		defaults: {
        		border: false,
        		bodyStyle: { background: 'transparent' }    			
    		},
    		items: [{
    			layout: 'form',
    			flex: 1,
    			defaults: {
    				labelAlign: 'right'
    			},
    			items: [{
					xtype: 'combo',
					editable: false,
					fieldLabel: 'Type',
					submitValue: false,
					itemId: 'OSTypeFamily'
				},
				this.osTypeIdCombo
				]
    		},
    		this.osTypeImage
    		]
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
    
    // This is important for layout notably
    onResize: function(w, h) {
        this.callParent(arguments);
        this.childComponent.setSize(w - this.getLabelWidth(), h);
    }
});