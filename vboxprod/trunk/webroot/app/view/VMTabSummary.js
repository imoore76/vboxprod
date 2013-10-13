/**
 * Virtual Machine Summary tab
 * 
 */

var previewWidth = 200;
var previewAspectRatio = 1.6;
var previewUpdateInterval = 3;

Ext.define('vcube.view.VMTabSummary', {
    
	extend: 'Ext.panel.Panel',
    
	alias: 'widget.VMTabSummary',
	
	
	statics: {
		
		/*
		 * List of actions that can be performed on this vm
		 */
		vmactions : ['start','powerdown','pause','savestate','clone','settings'],

		/*
		 * 
		 * Tables for summary tab
		 * 
		 */
		sections : {
			
			info: {
				
				tableCfg: {
					title: vcube.utils.trans('Info'),
					icon: 'images/vbox/name_16px.png',
					border: true,
					width: 400,
					bodyStyle: { background: '#fff' },
					style: { margin: '0 20px 20px 0', display: 'inline-block', float: 'left' }
				},
				condition: function(vm) {
					return vm.accessible;
				},
				redrawOnEvents: ['SessionStateChanged','MachineStateChanged','SnapshotTaken','SnapshotChanged','SnapshotDeleted'],
				rows: [{
					title: 'State',
					renderer: function(vm) {
						return '<img src="images/vbox/'+vcube.utils.vboxMachineStateIcon(vm.state) +'" height=16 width=16 valign=top />&nbsp;' + vcube.utils.vboxVMStates.convert(vm.state);
					}
				},{
					title: 'Since',
					renderer: function(vm) {
						return vcube.utils.dateTimeString(vm.lastStateChange)
					}
				},{
					title: 'Session',
					attrib: 'sessionState'
				},{
					/* Such a hack... */
					title: 'OS Type',
					renderer: function(vm) {
						return '<img src="images/vbox/' + vcube.utils.vboxGuestOSTypeIcon(vm.OSTypeId) +'" height=16 width=16 valign=top />&nbsp;' + vm.OSTypeDesc;
					}
				},{
					title: 'Current Snapshot',
					renderer: function(vm) {
						return (vm.currentSnapshotName ? vm.currentSnapshotName : '<span style="font-style: italic">none</span>');
					}
				}]
				
			},
			
			resources: {
				
				tableCfg: {
					title: vcube.utils.trans('Resources'),
					itemId: 'resourcesTable',
					icon: 'images/vbox/chipset_16px.png',
					border: true,
					width: 200,
					bodyStyle: { background: '#fff' },
					style: { margin: '0 20px 20px 0', display: 'inline-block', float: 'left' }
				},
				redrawOnEvents: ['CPUChanged','CPUExecutionCapChanged'],
				condition: function(vm) {
					return vm.accessible;
				},
				rows: [{
					title: vcube.utils.trans('CPU(s)'),
					attrib: 'CPUCount'
				},{
					title: vcube.utils.trans('Execution Cap'),
					condition : function(vm) {
						return parseInt(vm.CPUExecutionCap) != 100;
					},
					renderer: function(vm) {
						return vm.CPUExecutionCap + '%';
					}
				},{
					title: vcube.utils.trans('Memory'),
					renderer: function(vm) {
						return vm.memorySize + ' MB';
					}
				}]        			        					

			},
			
			inaccessible: {
				
				tableCfg: {
					title: vcube.utils.trans('Error'),
					itemId: 'inaccessibleTable',
					icon: 'images/vbox/state_aborted_16px.png',
					border: true,
					width: 500,
					bodyStyle: { background: '#fff' },
					style: { margin: '0 20px 20px 0', display: 'inline-block', float: 'left' }
				},
				condition: function(vm) {
					return (!vm.accessible);
				},
				rows: [{
					title: 'The selected Virtual Machine is <i>inaccessible</i>. Please inspect the error message shown below and press the <b>Refresh</b> button if you want to repeat the accessibility check:',
					data: ''
				},{
					title: '',
					renderer : function(vm) {
						return vm.accessError.text
					}
				},{
					title: 'Result Code',
					renderer : function(vm) {
						return vm.accessError.resultCode
					}
				},{
					title: 'Component',
					renderer : function(vm) {
						return vm.accessError.component
					}
				},{
					title: 'Interface',
					renderer : function(vm) {
						return vm.accessError.interfaceID
					}
				},{
					title:'<div align="center"><input type="button" onClick="vcubeVMRefresh()" value="Refresh" /></div>'
				}]	        					
				
			}
			
		}

	},

	/* Summary tab */
    title: 'Summary',
    itemId: 'SummaryTab',
    icon: 'images/vbox/machine_16px.png',
    cls: 'vmTabSummary',
	bodyStyle: 'background: url(images/vbox/vmw_first_run_bg.png) 700px 40px no-repeat',
    autoScroll: true,
    defaults: {
    	bodyStyle: { background: 'transparent' }
	},
    items: [{
    	// Summary container
    	xtype: 'panel',
    	itemId: 'SummaryTabItems',
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
    			icon: 'images/vbox/vrdp_16px.png',
    			itemId: 'PreviewPanel',
    			autoWidth: true,
    			autoHeight: true,
    			bodyStyle: {
    			    background: '#fff'
    			},
    			html: '<div id="vboxPreviewBox" />',
    			border: true,
    			margin: '0 20 0 0',
			},{
    			xtype: 'panel',
    			layout: {
    				type: 'vbox',
    				align: 'stretch'
    			},
    			flex: 1,
    			border: false,
    			bodyStyle: { background: 'transparent' },
    			defaults : { border: false, bodyStyle: { background: 'transparent' } },
    			items: [{
    				itemId: 'infopane',
    				padding: 0,
    				bodyStyle: { background: 'transparent' },
    				width: '100%',
    				tpl: new Ext.XTemplate('<table><tr valign="top"><td><h3 align="left">{name}</h3><div></td>'+
    						'<td width="100%; padding: 4px;"><div style="overflow: auto; height:64px; font-size: 11px; margin-left: 10px; margin-right: 10px;">{[Ext.util.Format.nl2br(Ext.String.htmlEncode(values.description))]}</td>'+
    						'<td width="68"><div align="center">{[(values.icon ? \'<img src="\' + values.icon +\'" style="width:64px;height:64px;display:block;"/>\' : \'No Icon\')]}</div></td>'+
    						'</tr></table>')
    			},{
    				items: [{
    					xtype: 'button',
    					text: 'Edit',
    					itemId: 'edit'
    				}]
    			},{
    				xtype: 'panel',
    				itemId: 'sectionspane',
    				margin: '10 0 0 0'
    			}]
    		},{
    			title: 'Actions',
    			layout: 'vbox',
    			itemId: 'vmactions',
    			margin: '0 0 0 20',
    			bodyStyle: { background: '#fff' },
    			border: true,
    			width: 200,
    			listeners: {
    				
    				beforerender: function(vmactions) {
    					
    					defaults = { border: false, xtype: 'button', width: '100%', margin: 4, textAlign: 'left', iconAlign: 'left' };

    					Ext.each(vcube.view.VMTabSummary.vmactions, function(action, i) {
    						
    						vmactions.add(Ext.create('Ext.Button',Ext.apply({},{
    							
    							itemId : action,
    							
    							text: vcube.vmactions[action].label.replace('...',''),
    							
    							icon: 'images/vbox/' + (vcube.vmactions[action].icon_16 ? vcube.vmactions[action].icon_16 : vcube.vmactions[action].icon) + '_16px.png'
								
    						}, defaults)));

    					});

    				}
    			}
    		}]
    	}]
    }]
});
