Ext.define('vcube.form.field.serialports', {
    extend: 'Ext.form.field.Base',
    mixins: {
        field: 'Ext.form.field.Field'
    },
    alias: 'widget.serialportsfield',
    combineErrors: true,
    border: false,
    padding: 0,
    margin: 0,
    msgTarget: 'side',
    submitFormat: 'c',
    
    maxPorts: 2,
    
	defaults: {
		frame: true,
		padding: 6,
		layout: 'form',
		fieldDefaults: {
			labelAlign: 'right'
		}
	},
    
    getSubmitValue: function() {
    	return this.getValue();
    },
    
    getValue: function() {
    	var self = this;
    	
    	for(var i = 0; i < self._origData.length; i++) {
    		var tab = self.childComponent.items.items[i];
    		Ext.iterate(self._origData[i], function(k,v) {
    			var f = tab.down('[name=serialPort-'+k+'-'+i+']');
    			if(f)
    				self._origData[i][k] = Ext.isObject(self._origData[i][k]) ? Ext.Object.merge(self._origData[i][k], f.getValue()) : f.getValue();
    		})
    	}
    	return this._origData;
    },
    
    setValue: function(val) {
    	console.log("SerialPort");
    	console.log(val);
    	
    	this._origData = val;
    	
    	if(!val) val = [];
    	for(var i = 0; i < Math.min(val.length,this.maxPorts); i++) {
    		var tab = this.childComponent.items.items[i];
    		Ext.iterate(val[i], function(k, v) {
    			var f = tab.down('[name=serialPort-'+k+'-'+i+']');
    			if(f && f.setValue) f.setValue(v);
    		});
    	}
    },
    
    initComponent: function(options) {
    	
    	Ext.apply(this, options);
    	
    	this.childComponent = Ext.create('Ext.tab.Panel',{
    		title: 'Serial Ports',
    		frame: true,
    		padding: 6,
    		layout: 'form',
    		defaults: {
    			frame: true,
    			padding: 6,
    			layout: 'form',
    			fieldDefaults: {
    				labelAlign: 'right'
    			}
    		},
    	    border: false
    	});
    	
    	for(var i = 0; i < this.maxPorts; i++) {
    		
    		this.childComponent.add({
    			title: 'Port ' + (i+1),
    			frame: true,
    			layout: 'form',
    			defaults: {
    				labelAlign: 'right',
    				submitValue: false
    			},
    			items: [{
    				xtype: 'checkbox',
    				boxLabel: 'Enable Serial Port',
    				name: 'serialPort-enabled-'+i
    			},{
    				xtype: 'fieldcontainer',
    				layout: 'hbox',
    				defaults: {
    					labelAlign: 'right',
    					defaults: {
    						submitValue: false
    					}
    				},
    				items: [{
    					xtype: 'combo',
    					editable: false,
    					fieldLabel: 'Port Number'
    				},{
    					xtype: 'numberfield',
    					labelWidth: 50,
    					inputWidth: 50,
    					fieldLabel: 'IRQ',
    					name: 'serialPort-IRQ-'+i
    				},{
    					xtype: 'textfield',
    					labelWidth: 80,
    					inputWidth: 50,
    					fieldLabel: 'I/O Port',
    					name: 'serialPort-IOBase-'+i
    				}]
    			},{
    				xtype: 'combo',
    				editable: false,
    				fieldLabel: 'Port Mode',
    				name: 'serialPort-hostMode-'+i
    			},{
    				fieldLabel: ' ',
    				labelSeparator: '',
    				xtype: 'checkbox',
    				boxLabel: 'Create Pipe',
    				name: 'serialPort-server-'+i
    			},{
    				xtype: 'textfield',
    				fieldLabel: 'Port/File Path',
    				name: 'serialPort-path-'+i
    			}]
    		});
    	}
    	
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