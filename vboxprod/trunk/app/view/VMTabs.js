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
        xtype: 'form',
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
        						'</td>'+
        				'</tr></table>')        			
        			},{
        				height: 20,
        				html: '',
        				border: false
        			},{
        				xtype: 'panel',
        				layout: 'hbox',
        				items: [{
        					xtype: 'panel',
        					title: 'Info',
        					border: true,
        					width: 300,
        					defaults: { xtype: 'displayfield'},
        					bodyStyle: { background: '#fff' },
        					items: [{
        						fieldLabel: 'OS Type',
        						name: 'OSTypeDesc'
        					},{
        						fieldLabel: 'State',
        						name: 'state',
        						displayTpl: new Ext.XTemplate('d<img src="images/vbox/{[vboxMachineStateIcon(state)]}" height=16 width=16 valign=top/>&nbsp;{[state]}')
        					},{
        						fieldLabel: 'Current Snapshot',
        						name: 'currentSnapshot'
        					}]
        				},{
        					html: '',
        					width: 20,
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
        						name: 'CPUCount'
        					},{
        						fieldLabel: 'Execution cap',
        						name: 'CPUExecutionCap'
        					},{
        						fieldLabel: 'Memory',
        						name: 'memorySize'
        					}]        			        					
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
        				icon: 'images/vbox/start_16px.png',
        				disabled: true
        			},{
        				text: 'Power Off',
        				icon: 'images/vbox/poweroff_16px.png'
        			},{
        				text: 'Pause',
        				icon: 'images/vbox/pause_16px.png',
        				disabled: true
        			},{
        				text: 'Save State',
        				icon: 'images/vbox/save_state_16px.png'
        			},{
        				text: 'Take Snapshot',
        				icon: 'images/vbox/take_snapshot_16px.png'
        			},{
        				text: 'Clone',
        				icon: 'images/vbox/vm_clone_16px.png'
        			},{
        				text: 'Resume',
        				icon: 'images/vbox/start_16px.png'
        			},{
        				text: 'Settings',
        				icon: 'images/vbox/settings_16px.png'
        			},{
        				text: 'Export',
        				icon: 'images/vbox/export_16px.png'
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