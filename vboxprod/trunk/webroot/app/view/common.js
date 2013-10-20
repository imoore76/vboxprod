Ext.define('vcube.view.common',{});

/**
 * Progress operation window
 */
Ext.define('vcube.view.common.ProgressWindow',{
	
    extend: 'Ext.window.Window',

    alias: 'widget.ProgressWindow',
       
    layout:'fit',
    title: vcube.utils.trans('Progress Operation'),
    icon: 'images/vbox/OSE/about_16px.png',
    width:440,
    height: 180,
    closable: false,
    modal: true,
    resizable: true,
    plain: true,
    border: false,
    
    progressCancelable: true,
    progressImage: 'images/vbox/blank.gif',
    progressText: 'OK GO!',
    
    progressbar: null,
    progressstatus: null,
    
    constructor: function(options){
    
    	if(options.actionType && options.actionName) {
    		var op = vcube.view.actions[options.actionType][options.actionName];
    		Ext.apply(this, {
    			progressImage: op.progressImage,
    			progressText: op.progressTitle.replace('...',''),
    			title: op.progressTitle.replace('...','')
    		});
    	}
    	
    	Ext.apply(this,options);
    	
    	this.callParent.apply(this, arguments);
    },
    
    updateProgress: function(pct, text) {
    	if(!(this.progressbar && this.progressstatus)) return;
    	this.progressbar.updateProgress(pct/100, pct+'%',true);
    	this.progressstatus.update(text);
    },
    
    initComponent: function() {
    	
    	this.items = [{
    		layout: 'hbox',
    		frame: true,
    		items: [{
    			xtype: 'image',
    			src: this.progressImage,
    			height: 90,
    			width: 90
    		},{
    			layout: {
    				type: 'vbox',
    				anchor: '100%',
    				align: 'stretch'
    			},
    			border: false,
    			bodyStyle: { background: 'transparent' },
    			defaults: { bodyStyle: { background: 'transparent' } },
    			flex: 1,
    			items: [{
    				xtype: 'progressbar',
    				flex: 1,
    				margin: '10 10 10 10',
    				text: '0%',
    				listeners: {
    					render: function(pbar) {
    						this.progressbar = pbar;
    					},
    					scope: this
    				}    				
    			},{
    				html: this.progressText,
    				border: false,
    				listeners: {
    					render: function(pnl) {
    						this.progressstatus = pnl;
    					},
    					scope: this
    				}
    			}]
    		}]
    	}];
    	
    	// Add cancel button if this is cancelable
    	if(true) {
    		this.buttons = [{
				xtype: 'button',
				text: vcube.utils.trans('Cancel'),
				itemId: 'cancel',
				listeners: {
					click: function(btn) {
						btn.disable();
					}
				}
			}];
    	}
    	this.callParent.apply(this, arguments);
    }
    

	
});

/**
 * Login form
 */
Ext.define('vcube.view.common.Login', {
	

    extend: 'Ext.window.Window',

    alias: 'widget.Login',
       
    layout:'fit',
    title: vcube.utils.trans('Log in'),
    icon: 'images/vbox/OSE/about_16px.png',
    width:300,
    height: 130,
    closable: false,
    modal: true,
    resizable: false,
    plain: true,
    border: false,
    
    loginFailedMsg : 'Log in failed',
    
    items: [{

    	xtype: 'form',
    	
        labelWidth:80,
        frame:true, 
        defaultType:'textfield',
        monitorValid:true,
        buttonAlign:'center',

        items:[{
            fieldLabel:'Username', 
            name:'loginUsername', 
            allowBlank:false 
        },{ 
            fieldLabel:'Password', 
            name:'loginPassword', 
            inputType:'password', 
            allowBlank:false
        }],
 
        buttons:[{ 
            text: vcube.utils.trans('Log in'),
            formBind: true
        }]
    }]

});
