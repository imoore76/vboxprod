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
		bodyStyle: 'background: url(images/vbox/vmw_first_run_bg.png) 700px 40px no-repeat',
        /*xtype: 'form',*/
        autoScroll: true,
        defaults: {
        	bodyStyle: { background: 'transparent' }
		},
        items: [{
        	// Summary container
        	xtype: 'panel',
        	flex: 1,
        	border: false,
        	layout: {
        		type: 'vbox',
        		pack: 'start'
        	},
        	defaults: { margin: 5, bodyStyle: { background: 'transparent' } },
        	items : [{
        		xtype: 'panel',
        		layout: 'hbox',
        		width: '100%',
        		border: false,
    			bodyStyle: { background: 'transparent' },
    			defaults: { bodyStyle: { background: 'transparent' } },
        		items: [{
        			title: 'Preview',
        			itemId: 'PreviewPanel',
        			autoWidth: true,
        			autoHeight: true,
        			bodyStyle: {
        			    background: '#fff'
        			},
        			html: '<canvas id="vboxPreviewBox" />',
        			border: true
        		},{
    				width: 20,
    				html: ' ',
    				border: false
    			},{
        			xtype: 'panel',
        			layout: 'vbox',
        			flex: 1,
        			border: false,
        			bodyStyle: { background: 'transparent' },
        			defaults: { border: false, bodyStyle: { background: 'transparent' } },
        			items: [{
        				itemId: 'baseinfo',
        				flex: 1,
        				xtype: 'panel',
        				width: '100%',
        				tpl: new Ext.XTemplate('<table style="border:0px;border-spacing:0px;width:100%;">'+
        						'<tr valign="top">'+
        						'<td width=100%><h3 align="left" style="margin-left: 10px">{name}</h3><div>{description}</div></td>'+
        						'<td style="border: 0px solid #000; width: 120px;"><div align="center">'+
        						'<img src="images/vbox/{[vboxGuestOSTypeIcon(values.OSTypeId)]}" style="width:64px;height:64px;display:block;margin-bottom:10px;"/>'+
        						'<div align="center">{[values.OSTypeId]}</div></td>'+
        				'</tr></table>')        			
        			},{
        				height: 20,
        				html: '',
        				border: false
        			},{
        				itemId: 'state',
        				tpl: new Ext.XTemplate('<img src="images/vbox/{[vboxMachineStateIcon(values.state)]}" height=16 width=16 valign=top/>&nbsp;{[values.state]}')
        			},{
        				height: 20,
        				html: '',
        				border: false
        			},{
	        			xtype: 'panel',
	        			title: 'Resources',
	        			border: true,
	        			width: 300,
	        			defaults: { xtype: 'displayfield'},
	        			bodyStyle: { background: '#fff' },
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
    				width: 20,
    				html: ' ',
    				border: false
        		},{
        			title: 'Actions',
        			layout: 'vbox',
        			bodyStyle: { background: '#fff' },
        			border: true,
        			width: 300,
        			defaults: { border: false, xtype: 'button', width: '100%', margin: 4, textAlign: 'left', iconAlign: 'left' },
        			items: [{
        				text: 'Start',
        				icon: 'images/vbox/start_16px.png'
        			},{
        				text: 'Power Off'
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
        }]
    }, {
    	
    	/* Details */
        title: 'Details'
    }, {
    	
    	/* Snapshots */
    	title: 'Snapshots'
    		
    },{
    	/* Console */
    	title: 'Console'
    }]

});