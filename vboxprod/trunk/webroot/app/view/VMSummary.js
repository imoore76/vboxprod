/**
 * Virtual Machine Summary tab
 * 
 */

var previewWidth = 200;
var previewAspectRatio = 1.6;
var previewUpdateInterval = 3;

Ext.define('vcube.view.VMSummary', {
    
	extend: 'Ext.panel.Panel',
    
	alias: 'widget.VMSummary',
	
	
	statics: {
		
		/*
		 * List of actions that can be performed on this vm
		 */
		vmactions : ['start','pause','reset','savestate','discard','powerbutton','powerdown'],
		
		machine: ['settings','logs','clone','remove'],
		
		buttonDefaults: { border: true, xtype: 'button', width: '100%', margin: 2, textAlign: 'left', iconAlign: 'left' },

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
					return (vm.accessible || vm._isSnapshot);
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
					return (vm.accessible || vm._isSnapshot);
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
					return (!vm.accessible && !vm._isSnapshot);
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
    				tpl: new Ext.XTemplate('<table class="infoTable"><tr valign="top"><td class="summaryName">{name}</td>'+
    						'<td class="description"><div class="description">{[Ext.util.Format.nl2br(Ext.String.htmlEncode(values.description))]}</td>'+
    						'<td class="icon"><div align="center">{[(values.icon ? \'<img src="\' + values.icon +\'" />\' : \'No Icon\')]}</td>'+
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
				title: 'Machine',
    			layout: 'vbox',
    			itemId: 'machine',
    			margin: '0 0 0 20',
    			bodyStyle: { background: '#fff' },
    			border: false,
    			frame: true,
    			width: 200,
    			listeners: {
    				
    				beforerender: function(vmactions) {
    					
    					Ext.each(vcube.view.VMSummary.machine, function(action, i) {
    						
    						/*
    						vmactions.add(Ext.create('Ext.Button',Ext.apply({},
    								vcube.vmactions.toItemConfig(action, true), vcube.view.VMSummary.buttonDefaults)));
    						*/

    					});

    				}
    			}
				
    		},{
    			title: 'Actions',
    			layout: 'vbox',
    			itemId: 'vmactions',
    			margin: '0 0 0 20',
    			bodyStyle: { background: '#fff' },
    			border: false,
    			frame: true,
    			width: 200,
    			listeners: {
    				
    				beforerender: function(vmactions) {
    					
    					Ext.each(vcube.view.VMSummary.vmactions, function(action, i) {
    						
    						/*
    						vmactions.add(Ext.create('Ext.Button',Ext.apply({},
    								vcube.vmactions.toItemConfig(action, true), vcube.view.VMSummary.buttonDefaults)));
    								
    						*/

    					});

    				}
    			}
    		}]
    	}]
    }]
});

Ext.define('vcube.view.VMSummary.Edit', {
	
    extend: 'Ext.window.Window',

    title: 'Edit Virtual Machine Summary',
    
    icon: 'images/vbox/machine_16px.png',

    width:560,
    height: 240,
    
    closable: true,
    modal: true,
    resizable: true,
    plain: true,
    border: false,
    closeAction: 'destroy',
    layout: 'fit',

    initComponent: function() {
    	
    	this.items = [{
    		xtype: 'form',
    		itemId: 'form',
    		frame:true,
    		defaultType:'textfield',
    		monitorValid:true,
    		buttonAlign:'center',
    		
    		items: [{
    			xtype: 'hidden',
    			name: 'id'
    		},{
    			fieldLabel: 'Name',
    			name: 'name',
    			width: 500,
    			itemId: 'vmname',
    			allowBlank: false
    		},{
    			fieldLabel: 'Icon',
    			name: 'icon',
    			width: 500,
    			allowBlank: true,
    			plugins: [{
    				ptype: 'fieldhelptext',
    				text: 'Full or relative URL of an image'
    			}]
    		},{
    			xtype: 'textareafield',
    			fieldLabel: 'Description',
    			name: 'description',
    			anchor: '100%'
    		}],
    		
    		buttons:[{ 
    			text: vcube.utils.trans('Save'),
    			itemId: 'save',
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
    	this.callParent();
    },
});
