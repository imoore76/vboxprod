/**
 * Virtual Machine Snapshots tab
 * 
 */

Ext.define('vcube.view.VMTabSnapshots', {
    
	extend: 'Ext.panel.Panel',
    
	alias: 'widget.VMTabSnapshots',
	
	statics: {
		
		// Snapshot node template
		nodeTextTpl : "{0} <span class='vboxSnapshotTimestamp'>{1}</span>",
		
		// Current state node
		currentStateNode: function(vm) {
			return {
				'text': '<strong>'+vcube.utils.trans((vm.currentStateModified ? 'Current State (changed)' : 'Current State'),'VBoxSnapshotsWgt')+'</strong>',
				'icon' : 'images/vbox/'+vcube.utils.vboxMachineStateIcon(vm.state),
				'leaf' : true,
				'cls' : 'snapshotCurrent',
				'id' : 'current'
			}
		}
	},
	
	/* Snapshots */
	title: 'Snapshots',
	icon: 'images/vbox/take_snapshot_16px.png',
	layout: 'fit',
	items: [{
		xtype: 'treepanel',
		itemId: 'snapshottree',
		viewConfig:{
			markDirty:false
		},
		rootVisible: false,
		lines: true,
		store: new Ext.data.TreeStore({
			clearOnLoad: true,
			autoLoad: false,
			
		    fields: ['id', 
		             'name', 'description', 'online', 'timeStamp',
		             'text',
		             { name: 'expanded', type: 'boolean', defaultValue: true, persist: true }],

			listeners: {
								
				append: function(thisNode,newNode,index,eOpts) {
					if(newNode.get('id') == 'current') return;
					newNode.set('text',Ext.String.format(vcube.view.VMTabSnapshots.nodeTextTpl, newNode.raw.name, ''));
					newNode.set('icon', 'images/vbox/' + (newNode.raw.online ? 'online' : 'offline') + '_snapshot_16px.png');
					newNode.set('expanded',(newNode.raw.children && newNode.raw.children.length));
				}
				
			},
			
			proxy: {
				type: 'ajax',
				url: 'vbox/machineGetSnapshots',
				reader: {
					type: 'vcubeJsonReader',
					initialRoot: 'snapshot',
					asChildren: true
				}
			}
			
		}),
		tbar: [
		       {xtype:'button',tooltip:vcube.utils.trans('Take Snapshot...','UIActionPool').replace('...',''),icon:'images/vbox/take_snapshot_16px.png'},
		       '-',
		       {xtype:'button',tooltip:vcube.utils.trans('Restore Snapshot','VBoxSnapshotsWgt'),icon:'images/vbox/discard_cur_state_16px.png'},
		       {xtype:'button',tooltip:vcube.utils.trans('Delete Snapshot','VBoxSnapshotsWgt'),icon:'images/vbox/delete_snapshot_16px.png'},
		       '-',
		       {xtype:'button',tooltip:vcube.utils.trans('Clone...','UIActionPool').replace('...',''),icon:'images/vbox/vm_clone_16px.png'},
		       '-',
		       {xtype:'button',tooltip:vcube.utils.trans('Show Details','VBoxSnapshotsWgt'),icon:'images/vbox/show_snapshot_details_16px.png'}
       ]
	}]
});