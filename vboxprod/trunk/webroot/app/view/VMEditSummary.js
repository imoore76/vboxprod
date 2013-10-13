Ext.define('vcube.view.VMEditSummary', {
	
    extend: 'Ext.window.Window',

    title: 'Edit Virtual Machine Summary',
    
    icon: 'images/vbox/machine_16px.png',

    width:560,
    height: 240,
    
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
    			itemId: 'vmname',
    			allowBlank: false
    		},{
    			fieldLabel: 'Icon',
    			name: 'icon',
    			width: 500,
    			allowBlank: true,
    			plugins: [{
    				ptype: 'fieldhelptext',
    				text: 'Full or relative URL of an image'
    			}]
    		},{
    			xtype: 'textareafield',
    			fieldLabel: 'Description',
    			name: 'description',
    			anchor: '100%'
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