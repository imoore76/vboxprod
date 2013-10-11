/**
 * Virtual Machine Snapshots tab
 * 
 */

Ext.define('vcube.view.VMTabSnapshots', {
    
	extend: 'Ext.panel.Panel',
    
	alias: 'widget.VMTabSnapshots',
	
	statics: {
		
		// Snapshot node template
		snapshotTextTpl : "{0} <span class='vboxSnapshotTimestamp'>{1}</span>",
		
		// Current state node
		currentStateNode: function(vm) {
			return {
				text: '<strong>'+vcube.utils.trans((vm.currentStateModified ? 'Current State (changed)' : 'Current State'),'VBoxSnapshotsWgt')+'</strong>',
				icon : 'images/vbox/'+vcube.utils.vboxMachineStateIcon(vm.state),
				leaf : true,
				cls : 'snapshotCurrent',
				id : 'current'
			}
		},
		
		snapshotTip: function(s) {
			return '<strong>'+s.name+'</strong> ('+vcube.utils.trans((s.online ? 'online)' : 'offline)'),'VBoxSnapshotsWgt')+
				'<p>'+ vcube.utils.dateTimeString(s.timeStamp, vcube.utils.trans('Taken at %1','VBoxSnapshotsWgt'), vcube.utils.trans('Taken on %1','VBoxSnapshotsWgt'))+'</p>' +
				(s.description ? '<hr />' + s.description : '');
		},
		
		currentStateTip: function(vm) {
			return '<strong>'+
	    		vcube.utils.trans((vm.currentStateModified ? 'Current State (changed)' : 'Current State'),'VBoxSnapshotsWgt') + '</strong><br />'+
	    		vcube.utils.trans('%1 since %2','VBoxSnapshotsWgt').replace('%1',vcube.utils.trans(vcube.utils.vboxVMStates.convert(vm.state),'VBoxGlobal'))
					.replace('%2',vcube.utils.dateTimeString(vm.lastStateChange))
				+ (vm.snapshotCount > 0 ? ('<hr />' + (vm.currentStateModified ?
							vcube.utils.trans('The current state differs from the state stored in the current snapshot','VBoxSnapshotsWgt')
							: vcube.utils.trans('The current state is identical to the state stored in the current snapshot','VBoxSnapshotsWgt')))
				: '');
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
			autosync: false,
		    fields: ['id', 
		             'name', 'description', 'online', 'timeStamp',
		             'text',
		             { name: 'expanded', type: 'boolean', defaultValue: true, persist: true }],

			listeners: {
								
				append: function(thisNode,newNode,index,eOpts) {
					if(newNode.get('id') == 'current') return;
					newNode.set({
						'text': Ext.String.format(vcube.view.VMTabSnapshots.snapshotTextTpl, newNode.raw.name, ''),
						'icon': 'images/vbox/' + (newNode.raw.online ? 'online' : 'offline') + '_snapshot_16px.png',
						'expanded': (newNode.raw.children && newNode.raw.children.length)
					});
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
		tbar:[{
	    	   xtype:'button',
	    	   itemId:'takeSnapshot',
	    	   tooltip:vcube.utils.trans('Take Snapshot...','UIActionPool').replace('...',''),
	    	   icon:'images/vbox/take_snapshot_16px.png'
	    	},
	       '-',
	       {
	    		xtype:'button',
	    		itemId: 'restoreSnapshot',
	    		tooltip:vcube.utils.trans('Restore Snapshot','VBoxSnapshotsWgt'),
	    		icon:'images/vbox/discard_cur_state_16px.png'
		    },{
		    	xtype:'button',
		    	itemId: 'deleteSnapshot',
		    	tooltip:vcube.utils.trans('Delete Snapshot','VBoxSnapshotsWgt'),
		    	icon:'images/vbox/delete_snapshot_16px.png'
		    },
		    '-',
		    {
		    	xtype:'button',
		    	itemId: 'cloneSnapshot',
		    	tooltip:vcube.utils.trans('Clone...','UIActionPool').replace('...',''),
		    	icon:'images/vbox/vm_clone_16px.png'
		    },
		    '-',
		    {
		    	xtype:'button',
		    	itemId: 'showSnapshot',
		    	tooltip:vcube.utils.trans('Show Details','VBoxSnapshotsWgt'),
		    	icon:'images/vbox/show_snapshot_details_16px.png'
		    }
       ]
	}]
});