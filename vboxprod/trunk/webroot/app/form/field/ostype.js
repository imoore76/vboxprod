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
    
    ostypes: {},
    
    serverNotify: true,
    
    setServer: function(serverid) {
    	
    	var self = this;
    	this.ostypes = {};
    	
    	Ext.ux.Deferred.when(vcube.utils.ajaxRequest('vbox/vboxGetGuestOSTypes',{connector:serverid})).done(function(data) {
    		
    		var famIdsSeen = {};
    		var families = [];
    		
    		Ext.each(data, function(ostype) {
    			
    			// Skip if not supported
    			if(ostype.supported) {
    				
    				if(!famIdsSeen[ostype.familyId]) {
    					famIdsSeen[ostype.familyId] = true;
    					families.push({
    						familyId: ostype.familyId,
    						familyDescription: ostype.familyDescription
    					});
    					
    				}
    				
    				self.ostypes[ostype.id] = {
    						'id': ostype.id,
    						'description' : ostype.description,
    						'familyId': ostype.familyId
    				}    				
    			}
    			
    		});
    		
    		// Populte family id store
    		self.osFamilyIdCombo.store.loadRawData(families);
    		
    		// Set initial value
    		var initVal = self.osTypeIdCombo.getValue() || 'WindowsXP';
    		
    		// Find family id of value
    		self.osFamilyIdCombo.select(self.ostypes[initVal].familyId);
    		self.osTypeIdCombo.select(initVal);
    		
    		
    		
    	});
    	
    	
    },
    
    
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
    	
    	/* OS Type image */
    	this.osTypeImage = Ext.create('Ext.Img',{
			src: 'images/vbox/blank.gif',
			height: 32,
			width: 32,
			margin: 8

    	});
    	
    	/* OS Family - only used for organization */
    	this.osFamilyIdCombo = Ext.create('Ext.form.field.ComboBox',{
			editable: false,
			fieldLabel: 'Type',
			labelAlign: 'right',
			submitValue: false,
			displayField: 'familyDescription',
			valueField: 'familyId',
			queryMode : 'local',
			store: Ext.create('Ext.data.Store',{
				fields: ['familyId', 'familyDescription']
			}),
			listeners: {
				change: function(cbo, value) {
					
					var store = this.osTypeIdCombo.getStore();
					
					store.removeAll();
					var osTypes = [];
					
					Ext.iterate(this.ostypes, function(k,v) {
						if(v.familyId == value) {
							osTypes.push({
								id: v.id,
								description: v.description
							});
						}
					});
					
					store.loadRawData(osTypes);
					this.osTypeIdCombo.select(store.first());
					
				},
				scope: this
			}
    	});
    	
    	/* OS Type ID */
    	this.osTypeIdCombo = Ext.create('Ext.form.field.ComboBox',{
			editable: false,
			fieldLabel: 'Version',
			itemId: 'OSTypeVersion',
			labelAlign: 'right',
			submitValue: false,
			displayField: 'description',
			valueField: 'id',
			queryMode : 'local',
			store: Ext.create('Ext.data.Store',{
				fields: ['id', 'description']
			}),
			listeners: {
				change: function(cbo, value, old) {
					
					this.osTypeImage.setSrc('images/vbox/'+vcube.utils.vboxGuestOSTypeIcon(value));
					
					// Set family combo if this is an initial selection
					try {
						this.osFamilyIdCombo.select(this.ostypes[value].familyId);						
					} catch (err) {
						
					}

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
    			items: [this.osFamilyIdCombo, this.osTypeIdCombo]
    		},
    		this.osTypeImage
    		]
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
    
    // This is important for layout notably
    onResize: function(w, h) {
        this.callParent(arguments);
        this.childComponent.setSize(w - this.getLabelWidth(), h);
    }
});