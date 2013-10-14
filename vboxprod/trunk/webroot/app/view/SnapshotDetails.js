Ext.define('vcube.view.SnapshotDetails', {
	
    extend: 'Ext.window.Window',

    title: vcube.utils.trans('Take Snapshot of Virtual Machine','UIActionPool'),

    icon: 'images/vbox/show_snapshot_details_16px.png',

    width:400,
    height: 600,
    
    closable: true,
    modal: true,
    resizable: true,
    plain: true,
    border: false,
    closeAction: 'destroy',
    layout: 'fit',

    initComponent: function() {
    	
    	this.items = [{
    		frame:true,
    		defaultType:'textfield',
    		monitorValid:true,
    		buttonAlign:'center',
    		layout: {
    			type: 'hbox'
    		},
    		items: [{
    			xtype: 'image',
    			height: 32,
    			width: 32,
    			itemId: 'osimage',
    			margin: 10
    		},{
        		xtype: 'form',
        		itemId: 'form',
        		border: false,
        		bodyStyle: { background: 'transparent' },
        		flex: 1,
    			items:[{
    				xtype: 'displayfield',
    				value: vcube.utils.trans('Snapshot Name'),
    				padding: '0 0 0 0',
    				margin: '0 0 0 0',
	    			hideLabel: true
	    		},{
	    			xtype: 'textfield',
	    			name: 'name',
	    			allowBlank: false,
	    			hideLabel: true,
	    			width: 300
	    		},{
    				xtype: 'displayfield',
    				value: vcube.utils.trans('Snapshot Description'),
    				padding: '0 0 0 0',
    				margin: '0 0 0 0',
	    			hideLabel: true
	    		},{
	    			xtype: 'textareafield',
	    			hideLabel: true,
	    			name: 'description',
	    			anchor: '100%'
	    		}],
	    		
    		}],
    		
    		buttons:[{ 
    			text: vcube.utils.trans('OK'),
    			itemId: 'ok',
    			formBind: true
    		},{
    			text: vcube.utils.trans('Cancel'),
    			listeners: {
    				click: function(btn) {
    					btn.up('.window').close();
    				}
    			}
    		}]
    	}];
		
    	this.callParent();
    },
});