Ext.define('vcube.view.ConnectorAddEdit', {
	
    extend: 'Ext.window.Window',

    title: 'Add Connector',
    
    icon: 'images/vbox/virtualbox-vdi.png',

    width:560,
    height: 260,
    
    closable: true,
    modal: true,
    resizable: true,
    plain: true,
    border: false,
    closeAction: 'destroy',
    layout: 'fit',

    initComponent: function() {
    	
    	this.items = [{
    		xtype: 'form',
    		itemId: 'form',
    		frame:true,
    		defaultType:'textfield',
    		monitorValid:true,
    		buttonAlign:'center',
    		
    		items: [{
    			xtype: 'hidden',
    			name: 'id'
    		},{
    			fieldLabel: 'Name',
    			name: 'name',
    			width: 500,
    			allowBlank: false
    		},{
    			fieldLabel: 'Location',
    			name: 'location',
    			width: 500,
    			allowBlank: false,
    			validator: function(location) {
    				var re = new RegExp("^vbox://[0-9\.a-zA-Z]+:[0-9]+$");
    				if(re.test(location)) return true;
    				return 'Location must be in the form of vbox://hostname.or.ip.address:port';
    			},
    			plugins: [{
    				ptype: 'fieldhelptext',
    				text: 'Location must be in the form of vbox://hostname.or.ip.address:port'
    			}]
    		},{
    			xtype: 'textareafield',
    			fieldLabel: 'Description',
    			name: 'description',
    			anchor: '100%'
    		},{
    			xtype: 'combobox',
    			fieldLabel: 'State',
    			name: 'status',
    			queryMode: 'local',
    			displayField: 'name',
    			valueField: 'value',
    			width: 300,
    			store: Ext.create('Ext.data.Store',{
            		fields: ['name','value'],
            		data: [{
            			name: "Disabled", value: vcube.app.constants.CONNECTOR_STATES['DISABLED']
            		},{
            			name: "Enabled", value: vcube.app.constants.CONNECTOR_STATES['DISCONNECTED']
            		}]
    			})
    		}],
    		
    		buttons:[{ 
    			text: vcube.utils.trans('Save'),
    			itemId: 'save',
    			formBind: true
    		},{
    			text: vcube.utils.trans('Cancel'),
    			listeners: {
    				click: function(btn) {
    					btn.up('.window').close();
    				}
    			}
    		}]
    	
    	}]
    	this.callParent();
    },
});