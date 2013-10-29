Ext.define('vcube.form.field.networkadapters', {
    extend: 'Ext.form.field.Base',
    mixins: {
        field: 'Ext.form.field.Field'
    },
    alias: 'widget.networkadaptersfield',
    combineErrors: true,
    border: false,
    padding: 0,
    margin: 0,
    msgTarget: 'side',
    submitFormat: 'c',
    
    maxAdapters: 8,
    
    _origData: null,
    
    natEnginePropsEditor: Ext.create('Ext.window.Window',{
    	title: 'NAT Engine',
    	icon: 'images/vbox/nw_16px.png',
    	height: 300,
    	width: 600,
    	modal: true,
    	layout: 'fit',
    	items: [{
    		xtype: 'tabpanel',
    		frame: true,
    		layout: 'fit',
    		items: [{
    			title: 'Properties',
    			xtype: 'form',
    			layout: 'form',
    			frame: true,
    			defaults: {
    				xtype: 'textfield',
    				labelAlign: 'right'
    			},
    			items: [{
    				fieldLabel: 'Alias Mode',
    				xtype: 'checkbox',
    				name: 'aliasModeProxy',
    				boxLabel: 'Proxy Only'
    			},{
    				xtype: 'checkbox',
    				fieldLabel: ' ',
    				labelSeparator: '',
    				name: 'aliasModeSame',
    				boxLabel: 'Same Ports'
    			},{
    				boxLabel: 'DNS Pass Domain',
    				fieldLabel: 'Options',
    				xtype: 'checkbox',
    				name: 'DNSPassDomain'
    			},{
    				boxLabel: 'DNS Proxy',
    				fieldLabel: ' ',
    				labelSeparator: '',
    				xtype: 'checkbox',
    				name: 'DNSProxy'
    			},{
    				boxLabel: 'Use Host Resolver',
    				fieldLabel: ' ',
    				labelSeparator: '',
    				xtype: 'checkbox',
    				name: 'DNSUseHostResolver'
    			},{
    				fieldLabel: 'Host IP',
    				name: 'hostIP',
    				inputWidth: 200
    			}]
    		},{
    			title: 'Port Forwarding Rules',
    			xtype: 'gridpanel',
    			frame: true,
    			layout: 'fit',
    			store: Ext.create('Ext.data.Store',{
    				fields: [
    				   {name: 'name', type: 'string'},
    				   {name: 'protocol', type: 'string'},
    				   {name: 'hostip', type: 'string'},
    				   {name: 'hostport', type: 'int'},
    				   {name: 'guestip', type: 'string'},
    				   {name: 'guestport', type: 'int'}
    				]
    			}),
    			columns: [{
    				header: 'Name',
    				dataindex: 'name'
    			},{
    				header: 'Protocol',
    				dataindex: 'protocol',
    				width: 75
    			},{
    				header: 'Host IP',
    				dataindex: 'hostip'
    			},{
    				header: 'Host Port',
    				dataindex: 'hostport',
    				width: 75
    			},{
    				header: 'Guest IP',
    				dataindex: 'guestip'
    			},{
    				header: 'Guest Port',
    				dataindex: 'guestport',
    				width: 75
    			}],
    			rbar: [{
    				icon: 'images/vbox/controller_add_16px.png'
    			},{
    				icon: 'images/vbox/controller_remove_16px.png'
    			}]
    		}]
    	}],
    	
    	buttons: [{
    		text: 'OK',
    		itemId: 'ok'
    	},{
    		text: 'Cancel',
    		itemId: 'cancel'
    	}]
    }),
    
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
    			var f = tab.down('[name=netAdapter-'+k+'-'+i+']');
    			if(f)
    				self._origData[i][k] = Ext.isObject(self._origData[i][k]) ? Ext.Object.merge(self._origData[i][k], f.getValue()) : f.getValue();
    		})
    	}
    	return this._origData;
    },
    
    setValue: function(val) {
    	
    	this._origData = val;
    	
    	console.log("Network");
    	console.log(val);
    	
    	if(!val) val = [];
    	for(var i = 0; i < Math.min(val.length,this.maxAdapters); i++) {
    		var tab = this.childComponent.items.items[i];
    		Ext.iterate(val[i], function(k, v) {
    			var f = tab.down('[name=netAdapter-'+k+'-'+i+']');
    			if(f && f.setValue) f.setValue(v);
    		});
    	}
    },
    
    initComponent: function(options) {
    	
    	Ext.apply(this, options);
    	
    	this.childComponent = Ext.create('Ext.tab.Panel',{
    		title: 'Network',
    		frame: true,
    		padding: 6,
    		layout: 'form',
    		defaults: {
    			frame: true,
    			padding: 6,
    			layout: 'form',
    			submitValue: false,
    			fieldDefaults: {
    				labelAlign: 'right'
    			}
    		},
    	    border: false
    	});
    	
    	for(var i = 0; i < this.maxAdapters; i++) {
    		
    		this.childComponent.add({
    			title: 'Adapter ' + (i+1),
    			frame: true,
    			layout: 'form',
    			defaults: {
    				labelWidth: 130,
    				labelAlign: 'right'
    			},
    			items: [{
    				xtype: 'checkbox',
    				boxLabel: 'Enable Network Adapter',
    				name: 'netAdapter-enabled-'+i,
    			},{
    				xtype: 'combo',
    				editable: false,
    				fieldLabel: 'Attached to',
    				name: 'netAdapter-attachmentType-'+i
    			},{
    				xtype: 'textfield',
    				name: 'netAdapter-name-'+i,
    				fieldLabel: 'Name'
    			},{
    				xtype: 'combo',
    				editable: false,
    				fieldLabel: 'Adapter Type',
    				name: 'netAdapter-adapterType-'+i
    			},{
    				xtype: 'combo',
    				editable: false,
    				fieldLabel: 'Promiscuous Mode',
    				name: 'netAdapter-promiscModePolicy-'+i
    			},{
    				xtype: 'fieldcontainer',
    				layout: 'hbox',
        			defaults: {
        				labelWidth: 130,
        				labelAlign: 'right'
        			},
    				items: [{
    					xtype: 'textfield',
    					fieldLabel: 'MAC Address',
    					name: 'netAdapter-MACAddress-'+i,
    					labelAlign: 'right'
    				},{
    					xtype: 'button',
    					icon: 'images/vbox/refresh_16px.png',
    					itemId: 'refreshmac',
    					margin: '2 0 0 0',
    					border: false,
    					frame: false
    				}]
    			},{
    				fieldLabel: ' ',
    				labelSeparator: '',
    				xtype: 'checkbox',
    				name: 'netAdapter-cableConnected-'+i,
    				boxLabel: 'Cable Connected'
    			},{
    				xtype: 'button',
    				text: 'NAT Engine',
    				listeners: {
    					click: function() {
    						this.natEnginePropsEditor.show();
    					},
    					scope: this
    				}
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