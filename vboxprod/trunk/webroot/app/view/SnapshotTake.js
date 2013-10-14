Ext.define('vcube.view.SnapshotTake', {
	
    extend: 'Ext.window.Window',

    title: vcube.utils.trans('Take Snapshot of Virtual Machine','UIActionPool'),

    icon:'images/vbox/take_snapshot_16px.png',

    width:400,
    height: 240,
    
    closable: true,
    modal: true,
    resizable: true,
    plain: true,
    border: false,
    closeAction: 'destroy',
    layout: 'fit',

    
    items : [{
		frame:true,
		xtype: 'form',
		itemId: 'form',
		buttonAlign:'center',
		monitorValid:true,
		border: false,
		layout: {
			type: 'hbox'
		},
		items:[{
			xtype: 'image',
			height: 32,
			width: 32,
			itemId: 'osimage',
			margin: 10
		},{			
			flex: 1,
			bodyStyle: { background: 'transparent' },
			border: false,
			items: [{
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
				width: 300
			}]	
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
	}]
});