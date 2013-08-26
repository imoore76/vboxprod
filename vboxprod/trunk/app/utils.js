/**
 * Storage Controller Types conversions
 * 
 * @param {String}
 *            c - storage controller type
 * @return {String} string used for translation
 */
function vboxStorageControllerType(c) {
	switch(c) {
		case 'LsiLogic': return 'Lsilogic';
		case 'LsiLogicSas': return 'LsiLogic SAS';
		case 'IntelAhci': return 'AHCI';
	}
	return c;
}
/**
 * Serial port mode conversions
 * 
 * @param {String}
 *            m - serial port mode
 * @return {String} string used for translation
 */
function vboxSerialMode(m) {
	switch(m) {
		case 'HostPipe': return 'Host Pipe';
		case 'HostDevice': return 'Host Device';
		case 'RawFile': return 'Raw File';
	}
	return m;
}

/**
 * Network adapter type conversions
 * 
 * @param {String}
 *            t - network adapter type
 * @return {String} string used for translation
 */
function vboxNetworkAdapterType(t) {
	switch(t) {
		case 'Am79C970A': return 'PCnet-PCI II (Am79C970A)';
		case 'Am79C973': return 'PCnet-FAST III (Am79C973)';
		case 'I82540EM': return 'Intel PRO/1000 MT Desktop (82540EM)';
		case 'I82543GC': return 'Intel PRO/1000 T Server (82543GC)';
		case 'I82545EM': return 'Intel PRO/1000 MT Server (82545EM)';
		case 'Virtio': return 'Paravirtualized Network (virtio-net)';
	}
}

/**
 * Audio controller conversions
 * 
 * @param {String}
 *            c - audio controller type
 * @return {String} string used for translation
 */
function vboxAudioController(c) {
	switch(c) {
		case 'AC97': return 'ICH AC97';
		case 'SB16': return 'SoundBlaster 16';
		case 'HDA': return 'Intel HD Audio';
	}
}
/**
 * Audio driver conversions
 * 
 * @param {String}
 *            d - audio driver type
 * @return {String} string used for translation
 */
function vboxAudioDriver(d) {
	switch(d) {
		case 'OSS': return 'OSS Audio Driver';
		case 'ALSA': return 'ALSA Audio Driver';
		case 'Pulse': return 'PulseAudio';
		case 'WinMM': return 'Windows Multimedia';
		case 'DirectSound': return 'Windows DirectSound';
		case 'Null': return 'Null Audio Driver';
		case 'SolAudio': return 'Solaris Audio';
	}
	return d;
}
/**
 * VM storage device conversions
 * 
 * @param {String}
 *            d - storage device type
 * @return {String} string used for translation
 */
function vboxDevice(d) {
	switch(d) {
		case 'DVD': return 'CD/DVD-ROM';
		case 'HardDisk': return 'Hard Disk';
	}
	return d;
}

/**
 * VM State functions namespace
 * 
 * @namespace vboxVMStates
 */
var vboxVMStates = {
	
	/* Return whether or not vm is running */
	isRunning: function(vm) {
		return (vm && jQuery.inArray(vm.state, ['Running','LiveSnapshotting','Teleporting']) > -1);
	},
	
	/* Return whether or not a vm is stuck */
	isStuck: function (vm) {
		return (vm && vm.state == 'Stuck');
	},
	
	/* Whether or not a vm is paused */
	isPaused: function(vm) {
		return (vm && jQuery.inArray(vm.state, ['Paused','TeleportingPausedVM']) > -1);
	},
	
	/* True if vm is powered off */
	isPoweredOff: function(vm) {
		return (vm && jQuery.inArray(vm.state, ['PoweredOff','Saved','Teleported', 'Aborted']) > -1);
	},
	
	/* True if vm is saved */
	isSaved: function(vm) {
		return (vm && vm.state == 'Saved');
	},
	
	/* True if vm is editable */
	isEditable: function(vm) {
		return (vm && vm.sessionState == 'Unlocked');
	},
	
	/* True if one VM in list matches item */
	isOne: function(test, vmlist) {
	
		for(var i = 0; i < vmlist.length; i++) {
			if(vboxVMStates['is'+test](vmlist[i]))
				return true;
		}
		return false;
	},
	
	/* Convert Machine state to translatable state */
	convert: function(state) {
		switch(state) {
			case 'PoweredOff': return 'Powered Off';
			case 'LiveSnapshotting': return 'Live Snapshotting';
			case 'TeleportingPausedVM': return 'Teleporting Paused VM';
			case 'TeleportingIn': return 'Teleporting In';
			case 'TakingLiveSnapshot': return 'Taking Live Snapshot';
			case 'RestoringSnapshot': return 'Restoring Snapshot';
			case 'DeletingSnapshot': return 'Deleting Snapshot';
			case 'SettingUp': return 'Setting Up';
			default: return state;
		}
	}
};

/**
 * VM storage device conversions
 * 
 * @param {String}
 *            d - storage device type
 * @return {String} string used for translation
 */
function vboxDevice(d) {
	switch(d) {
		case 'DVD': return 'CD/DVD-ROM';
		case 'HardDisk': return 'Hard Disk';
	}
	return d;
}

/**
 * Common VM storage / controller namespace
 * 
 * @namespace vboxStorage
 */
var vboxStorage = {

	/**
	 * Return list of bus types
	 * 
	 * @memberOf vboxStorage
	 * @static
	 * @return {Array} list of all storage bus types
	 */
	getBusTypes : function() {
		var busts = [];
		for(var i in vboxStorage) {
			if(typeof i == 'function') continue;
			if(!vboxStorage[i].maxPortCount) continue;
			busts[busts.length] = i;
		}
		return busts;
	},
	
	/**
	 * Return icon name for bus
	 * 
	 * @memberOf vboxStorage
	 * @param {String} bus - bus type
	 * @return {String} icon name
	 */
	getBusIcon : function(bus) {
		if(vboxStorage[bus].displayInherit) bus = vboxStorage[bus].displayInherit
		return bus.toLowerCase();
	},
	
	IDE : {
		maxPortCount : 2,
		limitOneInstance : true,
		maxDevicesPerPortCount : 2,
		types :['PIIX3','PIIX4','ICH6' ],
		ignoreFlush : true,
		slotName : function(p,d) {
			switch(p+'-'+d) {
				case '0-0' : return (trans('IDE Primary Master','VBoxGlobal'));
				case '0-1' : return (trans('IDE Primary Slave','VBoxGlobal'));
				case '1-0' : return (trans('IDE Secondary Master','VBoxGlobal'));
				case '1-1' : return (trans('IDE Secondary Slave','VBoxGlobal'));
			}
		},
		driveTypes : ['dvd','disk'],
		slots : function() { return {
		          	'0-0' : (trans('IDE Primary Master','VBoxGlobal')),
		          	'0-1' : (trans('IDE Primary Slave','VBoxGlobal')),
		          	'1-0' : (trans('IDE Secondary Master','VBoxGlobal')),
		          	'1-1' : (trans('IDE Secondary Slave','VBoxGlobal'))
			};
		}
	},
		
	SATA : {
		maxPortCount : 30,
		maxDevicesPerPortCount : 1,
		ignoreFlush : true,
		types : ['IntelAhci'],
		driveTypes : ['dvd','disk'],
		slotName : function(p,d) { return trans('SATA Port %1','VBoxGlobal').replace('%1',p); },
		slots : function() {
					var s = {};
					for(var i = 0; i < 30; i++) {
						s[i+'-0'] = trans('SATA Port %1','VBoxGlobal').replace('%1',i);
					}
					return s;
				}
	},
		
	SCSI : {
		maxPortCount : 16,
		maxDevicesPerPortCount : 1,
		driveTypes : ['disk'],
		types : ['LsiLogic','BusLogic'],
		ignoreFlush : true,
		slotName : function(p,d) { return trans('SCSI Port %1','VBoxGlobal').replace('%1',p); },
		slots : function() {
						var s = {};
						for(var i = 0; i < 16; i++) {
							s[i+'-0'] = trans('SCSI Port %1','VBoxGlobal').replace('%1',i);
						}
						return s;				
					}
	},
	SAS : {
		maxPortCount : 8,
		maxDevicesPerPortCount : 1,
		types : ['LsiLogicSas'],
		driveTypes : ['disk'],
		slotName : function(p,d) { return trans('SAS Port %1','VBoxGlobal').replace('%1',p); },
		slots : function() {
			var s = {};
			for(var i = 0; i < 8; i++) {
				s[i+'-0'] = trans('SAS Port %1','VBoxGlobal').replace('%1',i);
			}
			return s;				
		},
		displayInherit : 'SATA'
	},
		

	Floppy : {
		maxPortCount : 1,
		limitOneInstance : true,
		maxDevicesPerPortCount : 2,
		types : ['I82078'],
		driveTypes : ['floppy'],
		slotName : function(p,d) { return trans('Floppy Device %1','VBoxGlobal').replace('%1',d); },
		slots : function() { return { '0-0':trans('Floppy Device %1','VBoxGlobal').replace('%1','0'), '0-1' :trans('Floppy Device %1','VBoxGlobal').replace('%1','1') }; }	
	}

};

/**
 * Storage Controller Types conversions
 * 
 * @param {String}
 *            c - storage controller type
 * @return {String} string used for translation
 */
function vboxStorageControllerType(c) {
	switch(c) {
		case 'LsiLogic': return 'Lsilogic';
		case 'LsiLogicSas': return 'LsiLogic SAS';
		case 'IntelAhci': return 'AHCI';
	}
	return c;
}


/**
 * Return the correct icon relative to images/vbox/ for the VM state.
 * @param {String} state - virtual machine state
 * @return {String} icon file name
 */
function vboxMachineStateIcon(state)
{
	var strIcon = "state_powered_off_16px.png";
    var strNoIcon = "state_running_16px.png";

    switch (state)
    {
        case "PoweredOff": strIcon = "state_powered_off_16px.png"; break;
        case "Saved": strIcon = "state_saved_16px.png"; break;
        case "Teleported": strIcon = strNoIcon; break;
        case "LiveSnapshotting": strIcon = "online_snapshot_16px.png"; break;
        case "Aborted": strIcon = "state_aborted_16px.png"; break;
        case "Running": strIcon = "state_running_16px.png"; break;
        case "Paused": strIcon = "state_paused_16px.png"; break;
        case "Stuck": strIcon = "state_stuck_16px.png"; break;
        case "Teleporting": strIcon = strNoIcon; break;
        case "Starting": strIcon = strNoIcon; break;
        case "Stopping": strIcon = strNoIcon; break;
        case "Saving": strIcon = "state_discarding_16px.png"; break;
        case "Restoring": strIcon = "settings_16px.png"; break;
        case "TeleportingPausedVM": strIcon = strNoIcon; break;
        case "TeleportingIn": strIcon = strNoIcon; break;
        case "RestoringSnapshot": strIcon = "discard_cur_state_16px.png"; break;
        case "DeletingSnapshot": strIcon = "state_discarding_16px.png"; break;
        case "SettingUp": strIcon = strNoIcon; break;
        case "Hosting" : strIcon = "settings_16px.png"; break;
        case "Inaccessible": strIcon = "state_aborted_16px.png"; break;
        default:
            break;
    }
    
    return strIcon;

}

function trans(a,b,c,d,e) {
	return a;
}

/**
 * Return the correct icon string relative to images/vbox/ for the guest OS type
 * @param {String} osTypeId - guest OS type id
 * @return {String} icon file name
 */
function vboxGuestOSTypeIcon(osTypeId) {
	
    var strIcon = "os_other.png";
    switch (osTypeId)
    {
        case "Other":           strIcon = "os_other.png"; break;
        case "DOS":             strIcon = "os_dos.png"; break;
        case "Netware":         strIcon = "os_netware.png"; break;
        case "L4":              strIcon = "os_l4.png"; break;
        case "Windows31":       strIcon = "os_win31.png"; break;
        case "Windows95":       strIcon = "os_win95.png"; break;
        case "Windows98":       strIcon = "os_win98.png"; break;
        case "WindowsMe":       strIcon = "os_winme.png"; break;
        case "WindowsNT4":      strIcon = "os_winnt4.png"; break;
        case "Windows2000":     strIcon = "os_win2k.png"; break;
        case "WindowsXP":       strIcon = "os_winxp.png"; break;
        case "WindowsXP_64":    strIcon = "os_winxp_64.png"; break;
        case "Windows2003":     strIcon = "os_win2k3.png"; break;
        case "Windows2003_64":  strIcon = "os_win2k3_64.png"; break;
        case "WindowsVista":    strIcon = "os_winvista.png"; break;
        case "WindowsVista_64": strIcon = "os_winvista_64.png"; break;
        case "Windows2008":     strIcon = "os_win2k8.png"; break;
        case "Windows2008_64":  strIcon = "os_win2k8_64.png"; break;
        case "Windows7":        strIcon = "os_win7.png"; break;
        case "Windows7_64":     strIcon = "os_win7_64.png"; break;
        case "Windows81":
        case "Windows8":        strIcon = "os_win8.png"; break;
        case "Windows81_64":
        case "Windows8_64":     strIcon = "os_win8_64.png"; break;
        case "WindowsNT":       strIcon = "os_win_other.png"; break;
        case "Windows2012_64":	strIcon = "os_win2k12_64.png"; break;
        case "OS2Warp3":        strIcon = "os_os2warp3.png"; break;
        case "OS2Warp4":        strIcon = "os_os2warp4.png"; break;
        case "OS2Warp45":       strIcon = "os_os2warp45.png"; break;
        case "OS2eCS":          strIcon = "os_os2ecs.png"; break;
        case "OS2":             strIcon = "os_os2_other.png"; break;
        case "Linux22":         strIcon = "os_linux22.png"; break;
        case "Linux24":         strIcon = "os_linux24.png"; break;
        case "Linux24_64":      strIcon = "os_linux24_64.png"; break;
        case "Linux26":         strIcon = "os_linux26.png"; break;
        case "Linux26_64":      strIcon = "os_linux26_64.png"; break;
        case "ArchLinux":       strIcon = "os_archlinux.png"; break;
        case "ArchLinux_64":    strIcon = "os_archlinux_64.png"; break;
        case "Debian":          strIcon = "os_debian.png"; break;
        case "Debian_64":       strIcon = "os_debian_64.png"; break;
        case "OpenSUSE":        strIcon = "os_opensuse.png"; break;
        case "OpenSUSE_64":     strIcon = "os_opensuse_64.png"; break;
        case "Fedora":          strIcon = "os_fedora.png"; break;
        case "Fedora_64":       strIcon = "os_fedora_64.png"; break;
        case "Gentoo":          strIcon = "os_gentoo.png"; break;
        case "Gentoo_64":       strIcon = "os_gentoo_64.png"; break;
        case "Mandriva":        strIcon = "os_mandriva.png"; break;
        case "Mandriva_64":     strIcon = "os_mandriva_64.png"; break;
        case "RedHat":          strIcon = "os_redhat.png"; break;
        case "RedHat_64":       strIcon = "os_redhat_64.png"; break;
        case "Turbolinux":      strIcon = "os_turbolinux.png"; break;
        case "Ubuntu":          strIcon = "os_ubuntu.png"; break;
        case "Ubuntu_64":       strIcon = "os_ubuntu_64.png"; break;
        case "Xandros":         strIcon = "os_xandros.png"; break;
        case "Xandros_64":      strIcon = "os_xandros_64.png"; break;
        case "Linux":           strIcon = "os_linux_other.png"; break;
        case "FreeBSD":         strIcon = "os_freebsd.png"; break;
        case "FreeBSD_64":      strIcon = "os_freebsd_64.png"; break;
        case "OpenBSD":         strIcon = "os_openbsd.png"; break;
        case "OpenBSD_64":      strIcon = "os_openbsd_64.png"; break;
        case "NetBSD":          strIcon = "os_netbsd.png"; break;
        case "NetBSD_64":       strIcon = "os_netbsd_64.png"; break;
        case "Solaris":         strIcon = "os_solaris.png"; break;
        case "Solaris_64":      strIcon = "os_solaris_64.png"; break;
        case "Solaris11_64":      strIcon = "os_oraclesolaris_64.png"; break;
        case "OpenSolaris":     strIcon = "os_oraclesolaris.png"; break;
        case "OpenSolaris_64":  strIcon = "os_oraclesolaris_64.png"; break;
        case "QNX":             strIcon = "os_qnx.png"; break;
        case 'MacOS':			strIcon = "os_macosx.png"; break;
        case 'MacOS_64':			strIcon = "os_macosx_64.png"; break;
        case 'Oracle':			strIcon = "os_oracle.png"; break;
        case 'Oracle_64':			strIcon = "os_oracle_64.png"; break;
        case 'JRockitVE':		strIcon = 'os_jrockitve.png'; break;
        case "VirtualBox_Host":	strIcon = "os_virtualbox.png"; break;

        default:
            break;
    }
    return strIcon;
}

