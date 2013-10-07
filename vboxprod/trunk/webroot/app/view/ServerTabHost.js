/**
 * Server Host tab
 * 
 */

Ext.define('vcube.view.ServerTabHost', {
    
	extend: 'Ext.panel.Panel',
    
	alias: 'widget.ServerTabHost',
	
    title: 'Host',
    icon: 'images/vbox/OSE/VirtualBox_cube_42px.png',
    iconCls: 'icon16',    
    layout: {
    	type: 'vbox',
    	align: 'stretch',
    	pack: 'start'
    },
    items: [{
    	border: false,
    	defaults: { border: false },
    	items: [{
		    	tpl: '<img src="images/vbox/OSE/VirtualBox_cube_42px.png" height=64 width=64 style="float:left; margin-right: 20px;" /><h3 align="left">{name}</h3>asdf{description}'
		    },{
		    	height: 20,
		    	html: ''
		    },{
		    	tpl: '<div align="left"><b>Location:</b> {location}</div>'
		    },{
		    	tpl: '<div align="left"><b>Status:</b> {status_text}</div>'
		    }]
    }]
});
