/**
 * Virtual Machine tabs
 * 
 */

		
Ext.define('vboxprod.view.VMTabs', {
    extend: 'Ext.tab.Panel',
    alias: 'widget.VMTabs',
    defaults: {
    	border: false,
    	padding: 5
    },    
    items: [{
    	
    	/* Summary tab */
        title: 'Summary',
        itemId: 'SummaryTab',
        /*xtype: 'form',*/
        autoScroll: true,
        items: [{
        	// Summary container
        	xtype: 'panel',
        	flex: 1,
        	border: false,
        	layout: {
        		type: 'vbox',
        		pack: 'start'
        	},
        	/*defaults: { border: false },*/
        	defaults: { margin: 5 },
        	items : [{
        		xtype: 'panel',
        		layout: 'hbox',
        		width: '100%',
        		border: false,
        		items: [{
        			itemId: 'baseinfo',
        			flex: 1,
        			xtype: 'panel',
        			border: false,
        			tpl: new Ext.XTemplate('<table style="border:0px;border-spacing:0px;">'+
        					'<tr valign="top">'+
        					'<td style="border: 0px solid #000; padding: 10px; width: 120px;"><div align="center">'+
        					'<img src="images/vbox/{[vboxGuestOSTypeIcon(values.OSTypeId)]}" style="width:64px;height:64px;display:block;margin-bottom:10px;"/>'+
        					'<div align="center">{[values.OSTypeId]}</div></td>'+
        					'<td><h3 align="left" style="margin-left: 10px">{name}</h3><div>{description}</div></td>'+
        			'</tr></table>')        			
        		},{
        			xtype: 'panel',
        			title: 'Resources',
        			width: 300,
        			defaults: { xtype: 'displayfield'},
        			items: [{
        				fieldLabel: 'CPU(s)',
        				name: 'cpus'
        			},{
        				fieldLabel: 'Execution cap',
        				name: 'executionCap'
        			},{
        				fieldLabel: 'Memory',
        				name: 'baseMemory'
        			}]        			
        		}]
        	},{
        		xtype: 'panel',
        		title: 'Actions',
        		layout: 'vbox',
        		width: 300,
        		defaults: { border: false, xtype: 'button', width: '100%', margin: 4, textAlign: 'left', iconAlign: 'left' },
        		items: [{
        			text: 'Start',
        			icon: 'images/vbox/start_16px.png'
        		},{
        			text: 'Stop'
        		},{
        			text: 'Pause'
        		},{
        			text: 'Save State'
        		},{
        			text: 'Take Snapshot'
        		},{
        			text: 'Clone'
        		},{
        			text: 'Resume'
        		},{
        			text: 'Settings'
        		},{
        			text: 'Export'
        		}]
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