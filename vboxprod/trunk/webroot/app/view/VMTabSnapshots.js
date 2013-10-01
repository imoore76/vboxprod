/**
 * Virtual Machine Snapshots tab
 * 
 */

Ext.define('vcube.view.VMTabSnapshots', {
    
	extend: 'Ext.panel.Panel',
    
	alias: 'widget.VMTabSnapshots',
	
	/* Snapshots */
	title: 'Snapshots',
	icon: 'images/vbox/take_snapshot_16px.png',
	layout: 'fit',
	items: [{
		xtype: 'treepanel',
		itemId: 'snapshottree',
		listeners: {
			show: function(p) {
				p.getComponent('snapshottree').doLayout().getStore().getRootNode().expand();
				
			}
		},
		viewConfig:{
			markDirty:false
		},
		rootVisible: false,
		lines: true,
		store: new Ext.data.TreeStore({
			
			model: 'vcube.model.Snapshot',
			autoLoad: false,
			
			listeners: {
				
				
				append: function(thisNode,newNode,index,eOpts) {
					newNode.set('text',newNode.raw.name + ' <span class="vboxSnapshotTimestamp"> </span>');
					newNode.set('icon', 'images/vbox/' + (newNode.raw.online ? 'online' : 'offline') + '_snapshot_16px.png');
					newNode.set('expanded',(newNode.raw.children && newNode.raw.children.length));
				},
				
				// Append current state
				load: function(s, node, records, success) {
					var cState = {
							id: 'current',
							text: 'Current State',
							name: 'Current State',
							leaf: true
					};
					var rData = s.getProxy().getReader().responseData;
					var pNode = null;
					if(rData.currentSnapshotId) {
						pNode = s.getNodeById(rData.currentSnapshotId);
					} else {
						pNode = s.getRootNode();
					}
					
					pNode.appendChild(pNode.createNode(cState));
					pNode.expand();
				}
			},
			
			proxy: {
				type: 'ajax',
				url: 'data/operasnapshots.json',
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