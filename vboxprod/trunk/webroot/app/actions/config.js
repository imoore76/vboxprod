/**
 * View configuration for actions
 * 
 * $Id$
 * 
 */
Ext.define('vcube.actions.config',{
	statics: {
		actionTypes: ['machine','server','snapshots','vmgroup']		
	}
});

/**
 * Virtual Machine actions
 */
Ext.define('vcube.actions.config.machine',{
	
	statics: {
		
		actions: ['new','add','start','settings','clone','refresh','remove','discard',
		          'guestAdditionsInstall','logs','savestate','powerbutton','pause',
		          'powerdown','reset','stop'],
			
		/** Invoke the new virtual machine wizard */
		'new':{
			label: vcube.utils.trans('New...','UIActionPool'),
			icon:'vm_new'
		},
		
		/** Add a virtual machine via its settings file */
		add: {
			label:vcube.utils.trans('Add...','UIActionPool'),
			icon:'vm_add'
		},
		
		/** Start VM */
		start: {
			label : vcube.utils.trans('Start','UIActionPool'),
			icon : 'vm_start'	
		},
		
		/** Invoke VM settings dialog */
		settings: {
			label:vcube.utils.trans('Settings...','UIActionPool'),
			icon:'vm_settings',
		},
		
		/** Clone a VM */
		clone: {
			label:vcube.utils.trans('Clone...','UIActionPool'),
			icon:'vm_clone',
		},
		
		/** Refresh a VM's details */
		refresh: {
			label:vcube.utils.trans('Refresh','UIVMLogViewer'),
			icon:'refresh'
		},
		
		/** Delete / Remove a VM */
		remove: {
			label:vcube.utils.trans('Remove...', 'UIActionPool'),
			icon:'vm_delete',
			progressImage: 'progress_delete_90px.png',
			progressTitle: vcube.utils.trans('Remove the selected virtual machines', 'UIActionPool')
		},
		
		/** Discard VM State */
		discard: {
			label:vcube.utils.trans('Discard saved state...','UIActionPool'),
			icon:'vm_discard'
		},
		
		/** Install Guest Additions **/
		guestAdditionsInstall : {
			label: vcube.utils.trans('Install Guest Additions...','UIActionPool'),
			icon: 'guesttools',
			progressImage: 'progress_install_guest_additions_90px.png',
			progressTitle: vcube.utils.trans('Install Guest Additions...','UIActionPool')
		},
		
		/** Show VM Logs */
		logs: {
			label:vcube.utils.trans('Show Log...','UIActionPool'),
			icon:'vm_show_logs'
		},
		
		/** Save the current VM State */
		savestate: {
			label: vcube.utils.trans('Save State', 'UIActionPool'),
			icon: 'vm_save_state',
			progressImage: 'progress_state_save_90px.png'
		},
		
		/** Send ACPI Power Button to VM */
		powerbutton: {
			label: vcube.utils.trans('ACPI Shutdown','UIActionPool'),
			icon: 'vm_shutdown'
		},
		
		/** Pause a running VM */
		pause: {
			label: vcube.utils.trans('Pause','UIActionPool'),
			icon: 'vm_pause'
		},
		
		/** Power off a VM */
		powerdown: {
			label: vcube.utils.trans('Power Off','UIActionPool'),
			icon: 'vm_poweroff',
			progressImage: 'progress_poweroff_90px.png'
		},
		
		/** Reset a VM */
		reset: {
			label: vcube.utils.trans('Reset','UIActionPool'),
			icon: 'vm_reset'
		},
		
		/** Stop a VM */
		stop: {
			name: 'stop',
			label: vcube.utils.trans('Stop','VBoxSelectorWnd'),
			icon: 'vm_shutdown'
		}

	}

});


/**
 * Virtual Machine Group Actions
 */
Ext.define('vcube.actions.config.vmgroup',{
	
	statics : {
		actions: []
	}
	
});


/**
 * Server actions
 */
Ext.define('vcube.actions.config.server',{
	
	statics : {
		actions: []
	}
	
});

/**
 * Snapshot actions
 */
Ext.define('vcube.actions.config.snapshots',{
	
	statics: {
		
		actions: ['take','restore','delete','clone','show'],
		
		take: {
			label: vcube.utils.trans('Take Snapshot...','UIActionPool'),
			icon: 'snapshot_take',
			progressImage: 'progress_snapshot_create_90px.png',
			progressTitle: vcube.utils.trans('Take Snapshot...','UIActionPool'),
			
		},
		
		restore: {
			label: vcube.utils.trans('Restore Snapshot','VBoxSnapshotsWgt'),
			icon: 'snapshot_restore'		
		},
		
		'delete' : {
			label: vcube.utils.trans('Delete Snapshot','VBoxSnapshotsWgt'),
			icon: 'snapshot_delete'		
		},
		
		
		clone: {
			label: vcube.utils.trans('Clone...','UIActionPool'),
			icon: 'vm_clone'
		},
		
		show: {
			label: vcube.utils.trans('Show Details','VBoxSnapshotsWgt'),
			icon: 'snapshot_show_details'    	
		}
		
	}
	
				
	
});

/**
 * Media actions
 */

Ext.define('vcube.actions.config.media',{
	
	statics : {
		actions: []
	}


});
