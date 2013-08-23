/**
 * Virtual Machine tabs
 * 
 */

		
Ext.define('vboxprod.view.VMTabs', {
    extend: 'Ext.tab.Panel',
    alias: 'widget.VMTabs',
    defaults: {
    	border: false,
    	layout: 'fit',
    	padding: 5
    },    
    items: [{
    
    	/* Summary tab */
        title: 'Summary',
        itemId: 'SummaryTab',
        items: [{
        	// Summary container
        	xtype: 'panel',
        	flex: 1,
        	layout: {
        		type: 'vbox',
        		pack: 'start'
        	},
        	/*defaults: { border: false },*/
        	defaults: { margin: 5 },
        	items : [{
        		defaults: { border: false },
        		itemId: 'baseinfo',
        		width: '100%',
        		tpl: new Ext.XTemplate('<table style="width:100%;border:0px;border-spacing:0px;">'+
        				'<tr><td width="100%"><h3 align="center">{name}</h3><div>{description}</div></td>'+
        				'<td><div align="center" style="width:300px">'+
        				'<img src="images/vbox/{[vboxGuestOSTypeIcon(values.OSTypeId)]}" style="width:64px;height:64px;display:block;margin:10px;"/>'+
						'<div align="center">{[values.OSTypeId]}</div></td></tr></table>')
        	},{
        		xtype: 'panel',
        		title: 'Resources',
        		width: 300,
        		html: 'asdf a;lsdkjf;lkajs dflk '
        	}]
        }]
    }, {
    	
        title: 'VM Tab 2',
        tabConfig: {
            title: 'Custom Title',
            tooltip: 'A button tooltip'
        }
    }]

});