/**
 * Login window
 * 
 */

Ext.define('vcube.view.Login', {
	

    extend: 'Ext.window.Window',

    alias: 'widget.Login',
       
    layout:'fit',
    title: trans('Log in'),
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
        url:'login.asp', 
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
            text: trans('Log in'),
            formBind: true
        }]
    }]

});
