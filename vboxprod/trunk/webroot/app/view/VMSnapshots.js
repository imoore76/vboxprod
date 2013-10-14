/**
 * Virtual Machine Snapshots tab
 * 
 */

Ext.define('vcube.view.VMSnapshots', {
    
	extend: 'Ext.panel.Panel',
    
	alias: 'widget.VMSnapshots',
	
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
		
		/* Snapshot tooltip */
		snapshotTip: function(s) {
			return '<strong>'+Ext.String.htmlEncode(s.name)+'</strong> ('+vcube.utils.trans((s.online ? 'online)' : 'offline)'),'VBoxSnapshotsWgt')+
				'<p>'+ vcube.utils.dateTimeString(s.timeStamp, vcube.utils.trans('Taken at %1','VBoxSnapshotsWgt'), vcube.utils.trans('Taken on %1','VBoxSnapshotsWgt'))+'</p>' +
				(s.description ? '<hr />' + Ext.String.htmlEncode(s.description) : '');
		},
		
		/* Current state tooltip */
		currentStateTip: function(vm) {
			return '<strong>'+
	    		vcube.utils.trans((vm.currentStateModified ? 'Current State (changed)' : 'Current State'),'VBoxSnapshotsWgt') + '</strong><br />'+
	    		vcube.utils.trans('%1 since %2','VBoxSnapshotsWgt').replace('%1',vcube.utils.trans(vcube.utils.vboxVMStates.convert(vm.state),'VBoxGlobal'))
					.replace('%2',vcube.utils.dateTimeString(vm.lastStateChange))
				+ (vm.snapshotCount > 0 ? ('<hr />' + (vm.currentStateModified ?
							vcube.utils.trans('The current state differs from the state stored in the current snapshot','VBoxSnapshotsWgt')
							: vcube.utils.trans('The current state is identical to the state stored in the current snapshot','VBoxSnapshotsWgt')))
				: '');
		},
		
		snapshotNode: function(data, expanded) {
			return Ext.Object.merge({
				'loaded' : true,
				'text': Ext.String.format(vcube.view.VMSnapshots.snapshotTextTpl, Ext.String.htmlEncode(data.name), ''),
				'icon': 'images/vbox/' + (data.online ? 'online' : 'offline') + '_snapshot_16px.png',
				'expanded': expanded
			},data);
		}
		

	},
	
	/* Snapshots */
	title: 'Snapshots',
	icon: 'images/vbox/take_snapshot_16px.png',
	layout: 'fit',
	frame: true,
	items: [{
		xtype: 'treepanel',
		itemId: 'snapshottree',
		viewConfig:{
			markDirty:false
		},
		rootVisible: false,
		lines: true,
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


/**
 * Take snapshot dialog
 */
Ext.define('vcube.view.VMSnapshots.TakeSnapshot', {
	
    extend: 'Ext.window.Window',

    title: vcube.utils.trans('Take Snapshot of Virtual Machine','UIActionPool'),

    icon:'images/vbox/take_snapshot_16px.png',

    width:400,
    height: 240,
    
    closable: true,
    modal: true,
    resizable: true,
    plain: true,
    border: false,
    closeAction: 'destroy',
    layout: 'fit',

    
    items : [{
		frame:true,
		xtype: 'form',
		itemId: 'form',
		buttonAlign:'center',
		monitorValid:true,
		border: false,
		layout: {
			type: 'hbox'
		},
		items:[{
			xtype: 'image',
			height: 32,
			width: 32,
			itemId: 'osimage',
			margin: 10
		},{			
			flex: 1,
			bodyStyle: { background: 'transparent' },
			border: false,
			items: [{
				xtype: 'displayfield',
				value: vcube.utils.trans('Snapshot Name'),
				padding: '0 0 0 0',
				margin: '0 0 0 0',
				hideLabel: true
			},{
				xtype: 'textfield',
				name: 'name',
				allowBlank: false,
				hideLabel: true,
				width: 300
			},{
				xtype: 'displayfield',
				value: vcube.utils.trans('Snapshot Description'),
				padding: '0 0 0 0',
				margin: '0 0 0 0',
				hideLabel: true
			},{
				xtype: 'textareafield',
				hideLabel: true,
				name: 'description',
				width: 300
			}]	
		}],
		buttons:[{ 
			text: vcube.utils.trans('OK'),
			itemId: 'ok',
			formBind: true
		},{
			text: vcube.utils.trans('Cancel'),
			itemId: 'cancel',
			listeners: {
				click: function(btn) {
					btn.up('.window').close();
				}
			}
		}]
	}]
});



/**
 * Snapshot details dialog
 */
Ext.define('vcube.view.VMSnapshots.Details', {
	
    extend: 'Ext.window.Window',

    title: vcube.utils.trans('Take Snapshot of Virtual Machine','UIActionPool'),

    icon: 'images/vbox/show_snapshot_details_16px.png',

    width:600,
    height: 600,
    
    closable: true,
    modal: true,
    resizable: true,
    plain: true,
    border: false,
    closeAction: 'destroy',
    layout: 'fit',

    items: [{
	    frame:true,
	    xtype: 'form',
	    itemId: 'form',
	    monitorValid:true,
	    buttonAlign:'center',
	    items: [{
	    	xtype: 'hidden',
	    	name: 'id'
	    },{
	    	xtype: 'textfield',
	    	name: 'name',
	    	allowBlank: false,
	    	fieldLabel: vcube.utils.trans('Name'),
	    	width: 300
	    },{
	    	xtype: 'displayfield',
	    	fieldLabel: vcube.utils.trans('Taken'),
	    	value: '',
	    	itemId: 'taken'
	    },{
	    	fieldLabel: 'Preview',
	    	xtype: 'image',
	    	itemId: 'preview'
	    },{
	    	xtype: 'textareafield',
	    	fieldLabel: 'Description',
	    	name: 'description',
	    	anchor: '100%'
	    },{
	    	itemId: 'details',
	    	padding: '4 4 4 4',
	    	autoScroll: true,
	    	height: 300
	    }],
	    
	    buttons:[{ 
	    	text: vcube.utils.trans('OK'),
	    	itemId: 'ok',
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
});


