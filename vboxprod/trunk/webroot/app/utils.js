/**
 * Utilities used by vcube
 */
Ext.define('vcube.utils', {
	
	singleton: true,
	
	/**
	 * Return VRDE Host
	 */
	vboxGetVRDEHost : function(vm) {
		var chost = (vm && vm.VRDEServer && vm.VRDEServer.netAddress ? vm.VRDEServer.netAddress : null);
		if(!chost) {
			// Set to host
			//chost = $('#vboxPane').data('vboxConfig').host;
			// Check for localhost / 127.0.0.1
			if(!chost || chost == 'localhost' || chost == '127.0.0.1')
				chost = location.hostname;
		}
		return chost;
	},

	/**
	 * Serial port namespace
	 * 
	 * @namespace vcube.utils.vboxSerialPorts
	 */
	vboxSerialPorts : {
		
		ports : [
	      { 'name':"COM1", 'irq':4, 'port':'0x3F8' },
	      { 'name':"COM2", 'irq':3, 'port':'0x2F8' },
	      { 'name':"COM3", 'irq':4, 'port':'0x3E8' },
	      { 'name':"COM4", 'irq':3, 'port':'0x2E8' },
		],
		
		/**
		 * Return port name based on irq and port
		 * 
		 * @param {Integer}
		 *            irq - irq number
		 * @param {String}
		 *            port - IO port
		 * @return {String} port name
		 */
		getPortName : function(irq,port) {
			for(var i = 0; i < vcube.utils.vboxSerialPorts.ports.length; i++) {
				if(vcube.utils.vboxSerialPorts.ports[i].irq == irq && vcube.utils.vboxSerialPorts.ports[i].port.toUpperCase() == port.toUpperCase())
					return vcube.utils.vboxSerialPorts.ports[i].name;
			}
			return 'User-defined';
		}
		
	},

	/**
	 * LPT port namespace
	 * 
	 * @namespace vboxParallelPorts
	 */
	vboxParallelPorts : {
		
		ports : [
	      { 'name':"LPT1", 'irq':7, 'port':'0x3BC' },
	      { 'name':"LPT2", 'irq':5, 'port':'0x378' },
	      { 'name':"LPT3", 'irq':5, 'port':'0x278' }
		],

		/**
		 * Return port name based on irq and port
		 * 
		 * @param {Integer}
		 *            irq - irq number
		 * @param {String}
		 *            port - IO port
		 * @return {String} port name
		 */	
		getPortName : function(irq,port) {
			for(var i = 0; i < vboxParallelPorts.ports.length; i++) {
				if(vboxParallelPorts.ports[i].irq == irq && vboxParallelPorts.ports[i].port.toUpperCase() == port.toUpperCase())
					return vboxParallelPorts.ports[i].name;
			}
			return 'User-defined';
		}
		
	},


	/**
	 * Storage Controller Types conversions
	 * 
	 * @param {String}
	 *            c - storage controller type
	 * @return {String} string used for translation
	 */
	vboxStorageControllerType : function(c) {
		switch(c) {
		case 'LsiLogic': return 'Lsilogic';
		case 'LsiLogicSas': return 'LsiLogic SAS';
		case 'IntelAhci': return 'AHCI';
		}
		return c;
	},
	
	/**
	 * Serial port mode conversions
	 * 
	 * @param {String}
	 *            m - serial port mode
	 * @return {String} string used for translation
	 */
	vboxSerialMode : function(m) {
		switch(m) {
		case 'HostPipe': return 'Host Pipe';
		case 'HostDevice': return 'Host Device';
		case 'RawFile': return 'Raw File';
		}
		return m;
	},
	
	/**
	 * Network adapter type conversions
	 * 
	 * @param {String}
	 *            t - network adapter type
	 * @return {String} string used for translation
	 */
	vboxNetworkAdapterType : function(t) {
		switch(t) {
		case 'Am79C970A': return 'PCnet-PCI II (Am79C970A)';
		case 'Am79C973': return 'PCnet-FAST III (Am79C973)';
		case 'I82540EM': return 'Intel PRO/1000 MT Desktop (82540EM)';
		case 'I82543GC': return 'Intel PRO/1000 T Server (82543GC)';
		case 'I82545EM': return 'Intel PRO/1000 MT Server (82545EM)';
		case 'Virtio': return 'Paravirtualized Network (virtio-net)';
		}
	},
	
	/**
	 * Audio controller conversions
	 * 
	 * @param {String}
	 *            c - audio controller type
	 * @return {String} string used for translation
	 */
	vboxAudioController : function(c) {
		switch(c) {
		case 'AC97': return 'ICH AC97';
		case 'SB16': return 'SoundBlaster 16';
		case 'HDA': return 'Intel HD Audio';
		}
	},
	
	/**
	 * Audio driver conversions
	 * 
	 * @param {String}
	 *            d - audio driver type
	 * @return {String} string used for translation
	 */
	vboxAudioDriver : function(d) {
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
	},
	
	/**
	 * VM storage device conversions
	 * 
	 * @param {String}
	 *            d - storage device type
	 * @return {String} string used for translation
	 */
	vboxDevice : function(d) {
		switch(d) {
		case 'DVD': return 'CD/DVD-ROM';
		case 'HardDisk': return 'Hard Disk';
		}
		return d;
	},
	
	/**
	 * VM State functions namespace
	 * 
	 * @namespace vboxVMStates
	 */
	vboxVMStates : {
			
		/* Return whether or not vm is running */
		isRunning: function(vm) {
			return (vm && Ext.Array.contains(['Running','LiveSnapshotting','Teleporting'], vm.state));
		},
		
		/* Return whether or not a vm is stuck */
		isStuck: function(vm) {
			return (vm && vm.state == 'Stuck');
		},
		
		/* Whether or not a vm is paused */
		isPaused: function(vm) {
			return (vm && Ext.Array.contains(['Paused','TeleportingPausedVM'], vm.state));
		},
		
		/* True if vm is powered off */
		isPoweredOff: function(vm) {
			return (vm && Ext.Array.contains(['PoweredOff','Saved','Teleported', 'Aborted'], vm.state));
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
		isOne: function(states, vmlist) {
			
			if(typeof(states) == 'string') states = [states];
			
			for(var i = 0; i < vmlist.length; i++) {
				for(var a = 0; a < states.length; states++) {
					if(vboxVMStates['is'+(states[a])](vmlist[i]))
						return true;					
				}
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
	},
	
	/**
	 * VM storage device conversions
	 * 
	 * @param {String}
	 *            d - storage device type
	 * @return {String} string used for translation
	 */
	vboxDevice : function(d) {
		switch(d) {
		case 'DVD': return 'CD/DVD-ROM';
		case 'HardDisk': return 'Hard Disk';
		}
		return d;
	},
	
	/**
	 * Common VM storage / controller namespace
	 * 
	 * @namespace vboxStorage
	 */
	vboxStorage : {
			
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
					case '0-0' : return (vcube.utils.trans('IDE Primary Master','VBoxGlobal'));
					case '0-1' : return (vcube.utils.trans('IDE Primary Slave','VBoxGlobal'));
					case '1-0' : return (vcube.utils.trans('IDE Secondary Master','VBoxGlobal'));
					case '1-1' : return (vcube.utils.trans('IDE Secondary Slave','VBoxGlobal'));
					}
				},
				driveTypes : ['dvd','disk'],
				slots : function() { return {
					'0-0' : (vcube.utils.trans('IDE Primary Master','VBoxGlobal')),
					'0-1' : (vcube.utils.trans('IDE Primary Slave','VBoxGlobal')),
					'1-0' : (vcube.utils.trans('IDE Secondary Master','VBoxGlobal')),
					'1-1' : (vcube.utils.trans('IDE Secondary Slave','VBoxGlobal'))
				};
				}
			},
			
			SATA : {
				maxPortCount : 30,
				maxDevicesPerPortCount : 1,
				ignoreFlush : true,
				types : ['IntelAhci'],
				driveTypes : ['dvd','disk'],
				slotName : function(p,d) { return vcube.utils.trans('SATA Port %1','VBoxGlobal').replace('%1',p); },
				slots : function() {
					var s = {};
					for(var i = 0; i < 30; i++) {
						s[i+'-0'] = vcube.utils.trans('SATA Port %1','VBoxGlobal').replace('%1',i);
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
				slotName : function(p,d) { return vcube.utils.trans('SCSI Port %1','VBoxGlobal').replace('%1',p); },
				slots : function() {
					var s = {};
					for(var i = 0; i < 16; i++) {
						s[i+'-0'] = vcube.utils.trans('SCSI Port %1','VBoxGlobal').replace('%1',i);
					}
					return s;				
				}
			},
			SAS : {
				maxPortCount : 8,
				maxDevicesPerPortCount : 1,
				types : ['LsiLogicSas'],
				driveTypes : ['disk'],
				slotName : function(p,d) { return vcube.utils.trans('SAS Port %1','VBoxGlobal').replace('%1',p); },
				slots : function() {
					var s = {};
					for(var i = 0; i < 8; i++) {
						s[i+'-0'] = vcube.utils.trans('SAS Port %1','VBoxGlobal').replace('%1',i);
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
				slotName : function(p,d) { return vcube.utils.trans('Floppy Device %1','VBoxGlobal').replace('%1',d); },
				slots : function() { return { '0-0':vcube.utils.trans('Floppy Device %1','VBoxGlobal').replace('%1','0'), '0-1' :vcube.utils.trans('Floppy Device %1','VBoxGlobal').replace('%1','1') }; }	
			}
			
	},
	
	/**
	 * Storage Controller Types conversions
	 * 
	 * @param {String}
	 *            c - storage controller type
	 * @return {String} string used for translation
	 */
	vboxStorageControllerType : function(c) {
		switch(c) {
		case 'LsiLogic': return 'Lsilogic';
		case 'LsiLogicSas': return 'LsiLogic SAS';
		case 'IntelAhci': return 'AHCI';
		}
		return c;
	},
	
	
	/**
	 * Return the correct icon relative to images/vbox/ for the VM state.
	 * @param {String} state - virtual machine state
	 * @return {String} icon file name
	 */
	vboxMachineStateIcon : function(state) {
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
		
	},
	
	trans : function(a,b,c,d,e) {
		return a;
	},
	
	/**
	 * Return the correct icon string relative to images/vbox/ for the guest OS type
	 * @param {String} osTypeId - guest OS type id
	 * @return {String} icon file name
	 */
	vboxGuestOSTypeIcon : function(osTypeId) {
		
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
	},
	
	/**
	 * Return a time or date+time string depending on
	 * how much time has elapsed
	 * @param {Integer} t - seconds since 1/1/1970 0:0:0
	 * @param {String} replaceTime - optional string to return replacing time
	 * @param {String} replaceDateTime - optional string to return replace date_time
	 * @return {String} time or date+time string
	 */
	dateTimeString : function(t, replaceTime, replaceDateTime) {

		var sdate = new Date(t*1000);
		if((new Date().getTime() - sdate.getTime())/1000 > 86400
				|| new Date().getDate() != sdate.getDate()) {
				return (replaceDateTime ? replaceDateTime.replace('%1',sdate.toLocaleString()) : sdate.toLocaleString());
			}
		return (replaceTime ? replaceTime.replace('%1',sdate.toLocaleTimeString()) : sdate.toLocaleTimeString());
	},
	
	/**
	 * Returns the result of case-insensitive string comparison using 'natural' algorithm comparing str1 to str2
	 * @param {String} str1 - 1st string
	 * @param {String} str2 - 2nd string
	 * @return {Integer} integer for use in list sorting comparison
	 */
	strnatcasecmp : function(str1, str2) {
	    // Returns the result of case-insensitive string comparison using 'natural' algorithm  
	    // 
	    // version: 1004.2314
	    // discuss at: http://phpjs.org/functions/strnatcasecmp    // +      original by: Martin Pool
	    // + reimplemented by: Pierre-Luc Paour
	    // + reimplemented by: Kristof Coomans (SCK-CEN (Belgian Nucleair Research Centre))
	    // + reimplemented by: Brett Zamir (http://brett-zamir.me)
	    // +      bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)    // *     example 1: strnatcasecmp(10, 1);
	    // *     returns 1: 1
	    // *     example 1: strnatcasecmp('1', '10');
	    // *     returns 1: -1
	    var a = (str1+'').toLowerCase();    var b = (str2+'').toLowerCase();
	 
	    var isWhitespaceChar = function (a) {
	        return a.charCodeAt(0) <= 32;
	    }; 
	    var isDigitChar = function (a) {
	        var charCode = a.charCodeAt(0);
	        return ( charCode >= 48  && charCode <= 57 );
	    }; 
	    var compareRight = function (a,b) {
	        var bias = 0;
	        var ia = 0;
	        var ib = 0; 
	        var ca;
	        var cb;
	 
	        // The longest run of digits wins.  That aside, the greatest        // value wins, but we can't know that it will until we've scanned
	        // both numbers to know that they have the same magnitude, so we
	        // remember it in BIAS.
	        for (;; ia++, ib++) {
	            ca = a.charAt(ia);            cb = b.charAt(ib);
	 
	            if (!isDigitChar(ca) &&
	                !isDigitChar(cb)) {
	                return bias;            } else if (!isDigitChar(ca)) {
	                return -1;
	            } else if (!isDigitChar(cb)) {
	                return +1;
	            } else if (ca < cb) {                if (bias == 0) {
	                    bias = -1;
	                }
	            } else if (ca > cb) {
	                if (bias == 0) {                    bias = +1;
	                }
	            } else if (ca == 0 && cb == 0) {
	                return bias;
	            }        }
	    };
	 
	    var ia = 0, ib = 0;
	    var nza = 0, nzb = 0;    var ca, cb;
	    var result;
	 
	    while (true) {
	        // only count the number of zeroes leading the last number compared        nza = nzb = 0;
	 
	        ca = a.charAt(ia);
	        cb = b.charAt(ib);
	         // skip over leading spaces or zeros
	        while (isWhitespaceChar( ca ) || ca =='0') {
	            if (ca == '0') {
	                nza++;
	            } else {                // only count consecutive zeroes
	                nza = 0;
	            }
	 
	            ca = a.charAt(++ia);        }
	 
	        while (isWhitespaceChar( cb ) || cb == '0') {
	            if (cb == '0') {
	                nzb++;            } else {
	                // only count consecutive zeroes
	                nzb = 0;
	            }
	             cb = b.charAt(++ib);
	        }
	 
	        // process run of digits
	        if (isDigitChar(ca) && isDigitChar(cb)) {            if ((result = compareRight(a.substring(ia), b.substring(ib))) != 0) {
	                return result;
	            }
	        }
	         if (ca == 0 && cb == 0) {
	            // The strings compare the same.  Perhaps the caller
	            // will want to call strcmp to break the tie.
	            return nza - nzb;
	        } 
	        if (ca < cb) {
	            return -1;
	        } else if (ca > cb) {
	            return +1;        }
	 
	        ++ia; ++ib;
	    }
	}


});
