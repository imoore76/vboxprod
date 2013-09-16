
import sys, os, time, traceback, threading, Queue
import signal
import pprint

from multiprocessing import Process

from vboxapi import VirtualBoxManager, PlatformXPCOM


sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))+'/lib')


""" Helpers """
def enumToString(constants, enum, elem):
    all = constants.all_values(enum)
    for e in all.keys():
        if str(elem) == str(all[e]):
            return e
    return "<unknown>"


"""
Return base machine info
"""
def _machineGetBaseInfo(mach):
    return { 
       'id':mach.id,
       'name':mach.name,
       'state':enumToString(vboxMgr.constants, "MachineState", mach.state),
       'sessionState':enumToString(vboxMgr.constants, "SessionState", mach.sessionState),
       'OSTypeId':mach.OSTypeId
    }

"""
Return a list of network adapters attached to machine m

 @param IMachine m virtual machine instance
 @param int slot optional slot of single network adapter to get
 @return array of network adapter information
"""
def _machineGetNetworkAdapters(m, slot=None):

    adapters = []
    
    print "Slot is " + str(slot)
    
    if slot is not None:
        adapterRange = [slot]
    else:
        adapterRange = range(0,7)
        
    for i in adapterRange:

        n = m.getNetworkAdapter(i)

        aType = enumToString(vboxMgr.constants, 'NetworkAttachmentType', n.attachmentType)
        
        if aType == 'NAT':
            nd = n.NATEngine
        else:
             nd = None

        props = n.getProperties('')
        props = dict(zip(props[0],props[1]))
         
        adapters.append({
            'adapterType' : enumToString(vboxMgr.constants, 'NetworkAdapterType', n.adapterType),
            'slot' : n.slot,
            'enabled' : int(n.enabled),
            'MACAddress' : n.MACAddress,
            'attachmentType' : aType,
            'genericDriver' : n.genericDriver,
            'hostOnlyInterface' : n.hostOnlyInterface,
            'bridgedInterface' : n.bridgedInterface,
            'properties' : props,
            'internalNetwork' : n.internalNetwork,
            'NATNetwork' : n.NATNetwork,
            'promiscModePolicy' : enumToString(vboxMgr.constants, 'NetworkAdapterPromiscModePolicy', n.promiscModePolicy),     
            'cableConnected' : int(n.cableConnected),
            'NATEngine' : {
               'aliasMode' : int(nd.aliasMode),
               'DNSPassDomain' : int(nd.DNSPassDomain),
               'DNSProxy' : int(nd.DNSProxy),
               'DNSUseHostResolver' : int(nd.DNSUseHostResolver),
               'hostIP' : nd.hostIP} if aType == 'NAT' else {},
            'lineSpeed' : n.lineSpeed,
            'redirects' : nd.getRedirects() if aType == 'Nat' else []
        })
        
    return adapters


class vboxconnector():

    """
     * Error number describing a fatal error
     * @integer
     """
    PHPVB_ERRNO_FATAL = 32

    """
     * Error number describing a connection error
     * @integer
     """
    PHPVB_ERRNO_CONNECT = 64

    """
     * Holds any errors that occur during processing. Errors are placed in here
     * when we want calling functions to be aware of the error, but do not want to
     * halt processing
     *
     * @array
     """
    errors = []

    """
     * Holds any debug messages
     *
     * @array
     """
    messages = []
    
    """
     * IVirtualBox instance
     * @IVirtualBox
     """
    vbox = None
    
    """
    * Settings
    """
    settings = {}

    """
     * VirtualBox web session manager
     * @IWebsessionManager
     """
    websessionManager = None

    """
     * Holds IWebsessionManager session object if created
     * during processing so that it can be properly shutdown
     * in __destruct
     * @ISession
     * @see self.__destruct()
     """
    session = None

    """
     * Holds VirtualBox version information
     * @array
     """
    version = None

    """
     * Holds VirtualBox host OS specific directory separator set by getDSep()
     * @string
     * @see self.getDsep()
     """
    dsep = None

    """
     * Get VirtualBox version
     * @return array version information
     """
    def getVersion(self):

        if not self.version:

            self.version = self.vbox.version.split('.')
            self.version = {
                'ose':self.version[2].find('ose') > -1,
                'string':self.version.join('.'),
                'major':int(array_shift(self.version)),
                'minor':int(array_shift(self.version)),
                'sub':int(array_shift(self.version)),
                'revision':self.vbox.revision,
                'settingsFilePath' : self.vbox.settingsFilePath
            }

        return self.version

    """
     * Enumerate guest properties of a vm
     * 
     * @param array args array of arguments. See def body for details.
     * @return array of guest properties
     """
    def remote_machineEnumerateGuestProperties(self, args):

        """ @m IMachine """
        m = self.vbox.findMachine(args['vm'])

        props = m.enumerateGuestProperties(args['pattern'])
        m.releaseRemote()

        return props

    """
     * Set extra data of a vm
     *
     * @param array args array of arguments. See def body for details.
     * @return array of extra data
     """
    def remote_machineSetExtraData(self, args):
    
        """ @m IMachine """
        m = self.vbox.findMachine(args['vm'])
    
        m.setExtraData(args['key'],args['value'])
    
        return True
    
    """
     * Enumerate extra data of a vm
     *
     * @param array args array of arguments. See def body for details.
     * @return array of extra data
     """
    def remote_machineEnumerateExtraData(self, args):
    
        """ @m IMachine """
        m = self.vbox.findMachine(args['vm'])
    
        props = {}
        
        keys = m.getExtraDataKeys()
        
        #usort(keys,'strnatcasecmp')
        
        for k in keys:
            props[k] = m.getExtraData(k)
        
        return props
    
    """
     * Uses VirtualBox's vfsexplorer to check if a file exists
     * 
     * @param array args array of arguments. See def body for details.
     * @return boolean True if file exists
     """
    def remote_fileExists(self, args):

        dsep = self.getDsep()

        path = args['file'].replace(desep + dsep, dsep)
        dir = dirname(path)
        file = basename(path)

        if dir[-1] != dsep: dir = dir + dsep

        """ @appl IAppliance """
        appl = self.vbox.createAppliance()


        """ @vfs IVFSExplorer """
        vfs = appl.createVFSExplorer('file://'.dir)

        """ @progress IProgress """
        progress = vfs.update()
        progress.waitForCompletion(-1)
        progress.releaseRemote()

        exists = vfs.exists(array(file))

        return len(exists)
    
        
    """
     * Install guest additions
     *
     * @param array args array of arguments. See def body for details.
     * @return array result data
     """
    def remote_consoleGuestAdditionsInstall(self, args):

        results = {'errored' : 0}

        """ @gem IMedium|None """
        gem = None
        for m in self.vbox.DVDImages:
            if m.name.lower() == 'vboxguestadditions.iso':
                gem = m
                break

        # Not in media registry. Try to register it.
        if not gem:
                  
            checks = {
                'linux' : '/usr/share/virtualbox/VBoxGuestAdditions.iso',
                'osx' : '/Applications/VirtualBox.app/Contents/MacOS/VBoxGuestAdditions.iso',
                'sunos' : '/opt/VirtualBox/additions/VBoxGuestAdditions.iso',
                'windows' : 'C:\Program Files\Oracle\VirtualBox\VBoxGuestAdditions.iso',
                'windowsx86' : 'C:\Program Files (x86)\Oracle\VirtualBox\VBoxGuestAdditions.iso' # Does this exist?
            }
            
            hostos = self.vbox.host.operatingSystem.lower()
            
            if hostos.find('windows') > -1:
                checks = [checks['windows'],checks['windowsx86']]
            elif hostos.find('solaris') > -1 or hostos.find('sunos') > -1:
                checks = [checks['sunos']]
            # not sure of uname returned on Mac. This should cover all of them 
            elif hostos.find('mac') + hostos.find('apple') + hostos.find('osx') + hostos.find('os x') + hostos.find('darwin') > -1:
                checks = [checks['osx']]
            elif hostos.find('linux') > -1:
                checks = [checks['linux']]

            # Check for config setting
            if self.settings.get('vboxGuestAdditionsISO',None):
                checks = [self.settings.vboxGuestAdditionsISO]

            # Unknown os and no config setting leaves all checks in place.
            # Try to register medium.
            for iso in checks:
                try:
                    gem = self.vbox.openMedium(iso,'DVD','ReadOnly')
                    break
                except:
                    pass

            results['sources'] = checks

        # No guest additions found
        if not gem:
            results['result'] = 'noadditions'
            return results

        # create session and lock machine
        """ @machine IMachine """
        machine = self.vbox.findMachine(args['vm'])
        self.session = self.websessionManager.getSessionObject(self.vbox.handle)
        machine.lockMachine(self.session.handle, 'Shared')

        # Try update from guest if it is supported
        if not args.get('mount_only', None):
            
            try:

                """ @progress IProgress """
                progress = self.session.console.guest.updateGuestAdditions(gem.location,'WaitForUpdateStartOnly')

                # No error info. Save progress.
                gem.releaseRemote()
                self._util_progressStore(progress)
                results['progress'] = progress.handle
                return results

            except:
                
                if results.get('progress', None):
                    del results['progress']

                # Try to mount medium
                results['errored'] = 1

        # updateGuestAdditions is not supported. Just try to mount image.
        results['result'] = 'nocdrom'
        mounted = False
        
        for sc in machine.storageControllers:

            for ma in machine.getMediumAttachmentsOfController(sc.name):

                if ma.type == 'DVD':
                    self.session.machine.mountMedium(sc.name, ma.port, ma.device, gem.handle, True)
                    results['result'] = 'mounted'
                    mounted = True
                    break

            if mounted: break
        


        self.session.unlockMachine()
        self.session = None

        return results

    """
     * Attach USB device identified by args['id'] to a running VM
     *
     * @param array args array of arguments. See def body for details.
     * @return boolean True on success
     """
    def remote_consoleUSBDeviceAttach(self, args):

        # create session and lock machine
        """ @machine IMachine """
        machine = self.vbox.findMachine(args['vm'])
        self.session = self.websessionManager.getSessionObject(self.vbox.handle)
        machine.lockMachine(self.session.handle, 'Shared')

        self.session.console.attachUSBDevice(args['id'])

        self.session.unlockMachine()
        return True

    """
     * Detach USB device identified by args['id'] from a running VM
     * 
     * @param array args array of arguments. See def body for details.
     * @return boolean True on success
     """
    def remote_consoleUSBDeviceDetach(self, args):

        # create session and lock machine
        """ @machine IMachine """
        machine = self.vbox.findMachine(args['vm'])
        self.session = self.websessionManager.getSessionObject(self.vbox.handle)
        machine.lockMachine(self.session.handle, 'Shared')

        self.session.console.detachUSBDevice(args['id'])

        self.session.unlockMachine()
        self.session = None
        machine.releaseRemote()

        return True

    """
     * Save vms' groups if they have changed
     * 
     * @param array args array of arguments. See def body for details.
     * @return array response data
     """
    def remote_machinesSaveGroups(self, args):
        
        response = {'saved':[],'errored':False}
        
        for vm in args['vms']:
            
            # create session and lock machine
            """ @machine IMachine """
            try:
                machine = self.vbox.findMachine(vm['id'])
            except:
                continue
            
            group = vm['group_id']

            try:
                
                self.session = self.websessionManager.getSessionObject(self.vbox.handle)
                
                machine.lockMachine(self.session.handle, 'Shared')
                
                machine.setExtraData(self.phpVboxGroupKey, group)
                self.session.machine.saveSettings()
                self.session.unlockMachine()
                
                self.session = None
                
            except Exception as e:
                
                self.errors.append(e)
                response['errored'] = True
                
                continue

            # Add to saved list
            response['saved'].append(vm['id'])
            
        
        
        return response
        
      


    """
     * Clone a virtual machine
     * 
     * @param array args array of arguments. See def body for details.
     * @return array response data
     """
    def remote_machineClone(self, args):

        """ @src IMachine """
        src = self.vbox.findMachine(args['src'])

        if args['snapshot'] and args['snapshot']['id']:
            """ @nsrc ISnapshot """
            nsrc = src.findSnapshot(args['snapshot']['id'])
            src = None
            src = nsrc.machine

        """ @m IMachine """
        m = self.vbox.createMachine(self.vbox.composeMachineFilename(args['name'],None,None),args['name'],None,None,None,False)
        sfpath = m.settingsFilePath

        """ @cm CloneMode """
        #cm = new CloneMode(None,args['vmState'])
        #state = cm.ValueMap[args['vmState']]

        opts = []
        if not args.get('reinitNetwork', None): opts.append('KeepAllMACs')
        if args.get('link', None): opts.append('Link')

        """ @progress IProgress """
        progress = src.cloneTo(m.handle,args['vmState'],opts)

        # Does an exception exist?
        try:
            if progress.errorInfo.handle:
                ##self.errors.append(new Exception(progress.errorInfo.text))
                return False
            
        except:
            pass

        self._util_progressStore(progress)

        return {
                'progress' : progress.handle,
                'settingsFilePath' : sfpath}


    """
     * Turn VRDE on / off on a running VM
     *
     * @param array args array of arguments. See def body for details.
     * @return boolean True on success
     """
    def remote_consoleVRDEServerSave(self, args):

        # create session and lock machine
        """ @m IMachine """
        m = self.vbox.findMachine(args['vm'])
        self.session = self.websessionManager.getSessionObject(self.vbox.handle)
        m.lockMachine(self.session.handle, 'Shared')
        
        if int(args.get('enabled', None)) == -1:
            args['enabled'] = int(not self.session.machine.VRDEServer.enabled)
        
        self.session.machine.VRDEServer.enabled = int(args['enabled'])

        self.session.unlockMachine()
        self.session = None

        return True

    """
     * Save running VM settings. Called from machineSave method if the requested VM is running.
     *
     * @param array args array of machine configuration items.
     * @param string state state of virtual machine.
     * @return boolean True on success
     """
    def _machineSaveRunning(self, args, state):

        # Client and server must agree on advanced config setting
        self.settings.enableAdvancedConfig = (self.settings.get('enableAdvancedConfig',None) and args['clientConfig'].get('enableAdvancedConfig',None))
        self.settings.enableHDFlushConfig = (self.settings.get('enableHDFlushConfig',None) and args['clientConfig'].get('enableHDFlushConfig', None))

        # Shorthand
        """ @m IMachine """
        m = self.session.machine

        m.CPUExecutionCap = int(args['CPUExecutionCap'])
        m.description = args['description']
        
        # Start / stop config
        if self.settings.get('startStopConfig', None):
            m.setExtraData('pvbx/startupMode', args['startupMode'])

        # VirtualBox style start / stop config
        if self.settings.get('vboxAutostartConfig', None) and args['clientConfig'].get('vboxAutostartConfig', None):
        
            m.autostopType = args['autostopType']
            m.autostartEnabled = int(args['autostartEnabled'])
            m.autostartDelay = int(args['autostartDelay'])
        
        
        # Custom Icon
        m.setExtraData('phpvb/icon', args['customIcon'])
        
        m.setExtraData('GUI/SaveMountedAtRuntime', args['GUI'].get('SaveMountedAtRuntime','yes'))

        # VRDE settings
        try:
            if m.VRDEServer and self.vbox.systemProperties.defaultVRDEExtPack:
                
                m.VRDEServer.enabled = int(args['VRDEServer']['enabled'])
                m.VRDEServer.setVRDEProperty('TCP/Ports',args['VRDEServer']['ports'])
                m.VRDEServer.setVRDEProperty('VNCPassword',args['VRDEServer'].get('VNCPassword', ''))
                m.VRDEServer.authType = args['VRDEServer'].get('authType', None)
                m.VRDEServer.authTimeout = int(args['VRDEServer']['authTimeout'])

        except:
            pass
        
        # Storage Controllers if machine is in a valid state
        if state != 'Saved':
            
            attachedEx = attachedNew = {}
            
            for sc in m.storageControllers:
                mas = m.getMediumAttachmentsOfController(sc.name)
                for ma in  m.getMediumAttachmentsOfController(sc.name):
                    attachedEx[sc.name.ma.port.ma.device] = ma.medium.id if ma.medium else None
    
            # Incoming list
            for sc in args['storageControllers']:
    
                sc['name'] = sc['name'].strip()
                name = sc.get('name',sc['bus'])
    
                # Medium attachments
                for ma in sc['mediumAttachments']:
    
                    if ma['medium'] == 'None': ma['medium'] = None
    
                    attachedNew[name.ma['port'].ma['device']] = ma['medium']['id']
    
                    # Compare incoming list with existing
                    if ma['type'] != 'HardDisk' and attachedNew[name.ma['port'].ma['device']] != attachedEx[name.ma['port'].ma['device']]:
    
                        if is_array(ma['medium']) and ma['medium']['id'] and ma['type']:
    
                            # Host drive
                            if ma['medium']['hostDrive'].lower() == 'true' or ma['medium']['hostDrive'] == True:
                                # CD / DVD Drive
                                if ma['type'] == 'DVD':
                                    drives = self.vbox.host.DVDDrives
                                # floppy drives
                                else:
                                    drives = self.vbox.host.floppyDrives
                                
                                for md in drives:
                                    
                                    if md.id == ma['medium']['id']:
                                        med = md
                                        break
                            else:
                                med = self.vbox.openMedium(ma['medium']['location'],ma['type'])
                            
                        else:
                            med = None
                        
                        m.mountMedium(name,ma['port'],ma['device'],med)
                            
                    # Set Live CD/DVD
                    if ma['type'] == 'DVD':
                        if ma['medium']['hostDrive'].lower() != 'true' and ma['medium']['hostDrive'] != True:
                            m.temporaryEjectDevice(name,ma['port'],ma['device'],ma.get('temporaryEject',False))
    
                    # Set IgnoreFlush
                    elif ma['type'] == 'HardDisk':
    
                        # Remove IgnoreFlush key?
                        if self.settings.get('enableHDFlushConfig',False):
    
                            xtra = self._util_getIgnoreFlushKey(ma['port'], ma['device'], sc['controllerType'])
    
                            if xtra:
                                if int(ma['ignoreFlush']) == 0:
                                    m.setExtraData(xtra, '0')
                                else:
                                    m.setExtraData(xtra, '')
                                

        """ Networking """
        netprops = ['enabled','attachmentType','bridgedInterface','hostOnlyInterface','internalNetwork','NATNetwork','promiscModePolicy','genericDriver']

        for i in range(0, len(args['networkAdapters'])):

            """ @n INetworkAdapter """
            n = m.getNetworkAdapter(i)

            # Skip disabled adapters
            if not n.enabled:
                continue

            for p in range(0, len(netprops)):
                
                if netprops[p] == 'enabled' or netprops[p] == 'cableConnected':
                    continue
                
                if str(getattr(n.netprops[p])) != str(args['networkAdapters'][i][netprops[p]]):
                    setattr(n,netprops[p],args['networkAdapters'][i][netprops[p]])

            #/ Not if in "Saved" state
            if state != 'Saved':
                
                # Network properties
                eprops = n.getProperties()
                eprops = array_combine(eprops[1],eprops[0])
                #iprops = array_map(create_function('a','b=explode("=",a) return array(b[0]:b[1])'),preg_split('/[\r|\n]+/',args['networkAdapters'][i]['properties']))
                #inprops = array()
                #foreach(iprops as a) {
                #    foreach(a as k:v)
                #    inprops[k] = v
                #}
                
                # Remove any props that are in the existing properties array
                # but not in the incoming properties array
                #foreach(array_diff(array_keys(eprops),array_keys(inprops)) as dk) {
                #    n.setProperty(dk, '')
                #}
                                
                # Set remaining properties
                #foreach(inprops as k : v) {
                #    if !k) continue
                #    n.setProperty(k, v)
                #}
                    
                if int(n.cableConnected) != int(args['networkAdapters'][i]['cableConnected']):
                    n.cableConnected = int(args['networkAdapters'][i]['cableConnected'])
                

            if args['networkAdapters'][i]['attachmentType'] == 'NAT':

                # Remove existing redirects
                for r in n.NATEngine.getRedirects():
                    n.NATEngine.removeRedirect(r.split(',')[0])
                
                # Add redirects
                for r in args['networkAdapters'][i]['redirects']:
                    r = r.split(',')
                    n.NATEngine.addRedirect(r[0],r[1],r[2],r[3],r[4],r[5])
                

                # Advanced NAT settings
                if state != 'Saved':
                    aliasMode = n.NATEngine.aliasMode & 1
                    if int(args['networkAdapters'][i]['NATEngine']['aliasMode'] & 2): aliasMode = aliasMode | 2
                    if int(args['networkAdapters'][i]['NATEngine']['aliasMode'] & 4): aliasMode = aliasMode | 4
                    n.NATEngine.aliasMode = aliasMode
                    n.NATEngine.DNSProxy = int(args['networkAdapters'][i]['NATEngine']['DNSProxy'])
                    n.NATEngine.DNSPassDomain = int(args['networkAdapters'][i]['NATEngine']['DNSPassDomain'])
                    n.NATEngine.DNSUseHostResolver = int(args['networkAdapters'][i]['NATEngine']['DNSUseHostResolver'])
                    n.NATEngine.hostIP = args['networkAdapters'][i]['NATEngine']['hostIP']
                
        
        """ Shared Folders """
        sf_inc = {}
        for s in args['sharedFolders']:
            sf_inc[s['name']] = s


        # Get list of perm shared folders
        psf_tmp = m.sharedFolders
        psf = {}
        for sf in psf_tmp:
            psf[sf.name] = sf

        # Get a list of temp shared folders
        tsf_tmp = self.session.console.sharedFolders
        tsf = {}
        
        for sf in tsf_tmp:
            tsf[sf.name] = sf

        """
         *  Step through list and remove non-matching folders
         """
        for sf in sf_inc.values():

            # Already exists in perm list. Check Settings.
            if sf['type'] == 'machine' and psf.get(sf['name'], None):

                """ Remove if it doesn't match """
                if sf['hostPath'] != psf[sf['name']]['hostPath'] or sf['autoMount'] != psf[sf['name']].autoMount or sf['writable'] != psf[sf['name']].writable:

                    m.removeSharedFolder(sf['name'])
                    m.createSharedFolder(sf['name'],sf['hostPath'],sf['writable'],sf['autoMount'])

                del psf[sf['name']]

            # Already exists in perm list. Check Settings.
            elif sf['type'] != 'machine' and tsf.get(sf['name'], None):

                """ Remove if it doesn't match """
                if sf['hostPath'] != tsf[sf['name']].hostPath or sf['autoMount'] != tsf[sf['name']].autoMount or sf['writable'] != tsf[sf['name']].writable:

                    self.session.console.removeSharedFolder(sf['name'])
                    self.session.console.createSharedFolder(sf['name'],sf['hostPath'],sf['writable'],sf['autoMount'])

                del tsf[sf['name']]

            else:
                
                # Does not exist or was removed. Add it.
                if sf['type'] != 'machine': self.session.console.createSharedFolder(sf['name'],sf['hostPath'],sf['writable'],sf['autoMount'])
                else: self.session.machine.createSharedFolder(sf['name'],sf['hostPath'],sf['writable'],sf['autoMount'])

        """
         * Remove remaining
         """
        for sf in psf.values(): m.removeSharedFolder(sf['name'])
        for sf in tsf.values(): self.session.console.removeSharedFolder(sf['name'])
        
        """
         * USB Filters
         """

        usbEx = array()
        usbNew = array()

        usbc = self._machineGetUSBController(self.session.machine)

        if state != 'Saved' and usbc['enabled']:

            # filters
            if not is_array(args['USBController']['deviceFilters']):
                args['USBController']['deviceFilters'] = []
                
            if len(usbc['deviceFilters']) != len(args['USBController']['deviceFilters']) or serialize(usbc['deviceFilters']) != serialize(args['USBController']['deviceFilters']):

                # usb filter properties to change
                usbProps = ['vendorId','productId','revision','manufacturer','product','serialNumber','port','remote']

                # Remove and Add filters
                try:


                    max = max(len(usbc['deviceFilters']),len(args['USBController']['deviceFilters']))
                    offset = 0

                    # Remove existing
                    for i in range(0, max):

                        # Only if filter differs
                        if serialize(usbc['deviceFilters'][i]) != serialize(args['USBController']['deviceFilters'][i]):

                            # Remove existing?
                            if i < len(usbc['deviceFilters']):
                                m.USBController.removeDeviceFilter((i-offset))
                                offset = offset + 1

                            # Exists in new?
                            if len(args['USBController']['deviceFilters'][i]):

                                # Create filter
                                f = m.USBController.createDeviceFilter(args['USBController']['deviceFilters'][i]['name'])
                                f.active = args['USBController']['deviceFilters'][i]['active']

                                for p in usbProps:
                                    f.p = args['USBController']['deviceFilters'][i][p]

                                m.USBController.insertDeviceFilter(i,f)
                                offset = offset - 1

                except Exception as e:
                    self.errors.append(e)

        self.session.machine.saveSettings()
        self.session.unlockMachine()
        self.session = None

        return True

    """
     * Save virtual machine settings.
     * 
     * @param array args array of arguments. See def body for details.
     * @return boolean True on success
     """
    def remote_machineSave(self, args, response):

        # create session and lock machine
        """ @machine IMachine """
        machine = self.vbox.findMachine(args['id'])
        
        vmState = machine.state
        vmRunning = (vmState == 'Running' or vmState == 'Paused' or vmState == 'Saved')
        self.session = self.websessionManager.getSessionObject(self.vbox.handle)
        machine.lockMachine(self.session.handle, ('Shared' if vmRunning else 'Write'))

        # Switch to machineSaveRunning()?
        if vmRunning:
            return self._machineSaveRunning(args, vmState)

        # Shorthand
        """ @m IMachine """
        m = self.session.machine


        m.OSTypeId = args['OSTypeId']
        m.CPUCount = args['CPUCount']
        m.memorySize = args['memorySize']
        m.firmwareType = args['firmwareType']
        if args['chipsetType']: m.chipsetType = args['chipsetType']
        if m.snapshotFolder != args['snapshotFolder']: m.snapshotFolder = args['snapshotFolder']
        m.RTCUseUTC = (1 if args['RTCUseUTC'] else 0)
        m.setCpuProperty('PAE', (1 if args['CpuProperties']['PAE'] else 0))
        # IOAPIC
        m.BIOSSettings.IOAPICEnabled = (1 if args['BIOSSettings']['IOAPICEnabled'] else 0)
        m.CPUExecutionCap = int(args['CPUExecutionCap'])
        m.description = args['description']
        
        m.autostopType = args['autostopType']
        m.autostartEnabled = int(args['autostartEnabled'])
        m.autostartDelay = int(args['autostartDelay'])

        
        # Determine if host is capable of hw accel
        hwAccelAvail = int(self.vbox.host.getProcessorFeature('HWVirtEx'))

        m.setHWVirtExProperty('Enabled',(1 if int(args['HWVirtExProperties']['Enabled']) and hwAccelAvail else 0))
        m.setHWVirtExProperty('NestedPaging', (1 if int(args['HWVirtExProperties']['Enabled']) and hwAccelAvail and int(args['HWVirtExProperties']['NestedPaging']) else 0))
        
        """ @def VBOX_WITH_PAGE_SHARING
         * Enables the page sharing code.
        * @remarks This must match GMMR0Init currently we only support page fusion on
         *          all 64-bit hosts except Mac OS X """
        
        if int(self.vbox.host.getProcessorFeature('LongMode')) and self.vbox.host.operatingSystem.find("darwin") == -1:
            try:
                m.pageFusionEnabled = int(args['pageFusionEnabled'])
            except:
                pass

        m.HPETEnabled = int(args['HPETEnabled'])
        m.setExtraData("VBoxInternal/Devices/VMMDev/0/Config/GetHostTimeDisabled", args['disableHostTimeSync'])
        m.keyboardHIDType = args['keyboardHIDType']
        m.pointingHIDType = args['pointingHIDType']
        m.setHWVirtExProperty('LargePages', (1 if int(args['HWVirtExProperties']['LargePages']) else 0))
        m.setHWVirtExProperty('Exclusive', (1 if int(args['HWVirtExProperties']['Exclusive']) else 0))
        m.setHWVirtExProperty('VPID', (1 if int(args['HWVirtExProperties']['VPID']) else 0))

        """ Custom Icon """
        m.setExtraData('phpvb/icon', args['customIcon'])

        m.VRAMSize = args['VRAMSize']
        
        m.setExtraData('GUI/SaveMountedAtRuntime', (args['GUI'].get('SaveMountedAtRuntime','yes')))

        # VRDE settings
        try:
            if m.VRDEServer and self.vbox.systemProperties.defaultVRDEExtPack:
                m.VRDEServer.enabled = int(args['VRDEServer']['enabled'])
                m.VRDEServer.setVRDEProperty('TCP/Ports',args['VRDEServer']['ports'])
                m.VRDEServer.setVRDEProperty('TCP/Address',args['VRDEServer']['netAddress'])
                m.VRDEServer.setVRDEProperty('VNCPassword',args['VRDEServer'].get('VNCPassword',None))
                m.VRDEServer.authType = args['VRDEServer'].get('authType', None)
                m.VRDEServer.authTimeout = int(args['VRDEServer']['authTimeout'])
                m.VRDEServer.allowMultiConnection = int(args['VRDEServer']['allowMultiConnection'])

        except Exception as e:
            self.errors.append(e)
            
        # Audio controller settings
        m.audioAdapter.enabled = (1 if args['audioAdapter']['enabled'] else 0)
        m.audioAdapter.audioController = args['audioAdapter']['audioController']
        m.audioAdapter.audioDriver = args['audioAdapter']['audioDriver']

        # Boot order
        for i in range(0, self.vbox.systemProperties.maxBootPosition):
            if args['bootOrder'][i]:
                m.setBootOrder((i + 1),args['bootOrder'][i])
            else:
                m.setBootOrder((i + 1),None)

        # Storage Controllers
        scs = m.storageControllers
        attachedEx = attachedNew = {}
        for sc in m.storageControllers: # @sc IStorageController """

            cType = str(sc.controllerType)

            for ma in m.getMediumAttachmentsOfController(sc.name):

                attachedEx[sc.name.ma.port.ma.device] = (ma.medium.id if ma.medium else None)

                # Remove IgnoreFlush key?
                if self.settings.enableHDFlushConfig and str(ma.type) == 'HardDisk':
                    xtra = self._util_getIgnoreFlushKey(ma.port, ma.device, cType)
                    if xtra:
                        m.setExtraData(xtra,'')    

                if ma.controller:
                    m.detachDevice(ma.controller,ma.port,ma.device)

            scname = sc.name
            m.removeStorageController(scname)

        # Add New
        for sc in args['storageControllers']:

            sc['name'] = sc['name'].strip()
            name = sc.get('name',sc['bus'])


            c = m.addStorageController(name,sc['bus'])
            c.controllerType = sc['controllerType']
            c.useHostIOCache = (True if int(sc['useHostIOCache']) else False)
            
            # Set sata port count
            if sc['bus'] == 'SATA':
                max = max(1,int(sc.get('portCount',0)))
                for ma in sc['mediumAttachments']:
                    max = max(max,(int(ma['port'])+1))
                
                c.portCount = min(int(c.maxPortCount),max(len(sc['mediumAttachments']),max))


            # Medium attachments
            for ma in sc['mediumAttachments']:

                if ma['medium'] == 'None': ma['medium'] = None

                attachedNew[name.ma['port'].ma['device']] = ma['medium']['id']

                if ma['medium']:

                    # Host drive
                    if ma['medium']['hostDrive'].lower() == 'true' or ma['medium']['hostDrive'] == True:
                        # CD / DVD Drive
                        if ma['type'] == 'DVD':
                            drives = self.vbox.host.DVDDrives
                        # floppy drives
                        else:
                            drives = self.vbox.host.floppyDrives
                        
                        for md in drives:
                            if md.id == ma['medium']['id']:
                                med = md
                                break
                    else:
                        
                        """ @med IMedium """
                        med = self.vbox.openMedium(ma['medium']['location'],ma['type'])
                    
                else:
                    med = None
                
                m.attachDevice(name,ma['port'],ma['device'],ma['type'], med)

                # CD / DVD medium attachment type
                if ma['type'] == 'DVD':

                    if ma['medium']['hostDrive'].lower() == 'true' or ma['medium']['hostDrive'] == True:
                        m.passthroughDevice(name,ma['port'],ma['device'],(True if int(ma['passthrough']) else False))
                    else:
                        m.temporaryEjectDevice(name,ma['port'],ma['device'],(True if int(ma['temporaryEject']) else False))

                # HardDisk medium attachment type
                elif ma['type'] == 'HardDisk':

                    m.nonRotationalDevice(name,ma['port'],ma['device'],(True if int(ma['nonRotational']) else False))

                    # Remove IgnoreFlush key?
                    xtra = self._util_getIgnoreFlushKey(ma['port'], ma['device'], sc['controllerType'])

                    if xtra:
                        if int(ma['ignoreFlush']) == 0:
                            m.setExtraData(xtra, 0)
                        else:
                            m.setExtraData(xtra, '')


        """
         *
         * Network Adapters
         *
         """

        netprops = ['enabled','attachmentType','adapterType','MACAddress','bridgedInterface','hostOnlyInterface','internalNetwork','NATNetwork','cableConnected','promiscModePolicy','genericDriver']
        
    
        for i in range(0, len(args['networkAdapters'])):

            n = m.getNetworkAdapter(i)

            # Skip disabled adapters
            if int(n.enabled) + int(args['networkAdapters'][i]['enabled']) == 0: continue

            for p in range(0, len(netprops)):
                if not netprops[p] in ['enabled', 'cableConnected']:
                    setattr(n,netprops[p],args['networkAdapters'][i][netprops[p]])

            # Special case for boolean values
            n.enabled = int(args['networkAdapters'][i]['enabled'])
            n.cableConnected = int(args['networkAdapters'][i]['cableConnected'])
            
            # Network properties
            """
            eprops = n.getProperties()
            eprops = array_combine(eprops[1],eprops[0])
            iprops = array_map(create_function('a','b=explode("=",a) return array(b[0]:b[1])'),preg_split('/[\r|\n]+/',args['networkAdapters'][i]['properties']))
            inprops = array()
            foreach(iprops as a) {
                foreach(a as k:v)
                    inprops[k] = v
            }
            # Remove any props that are in the existing properties array
            # but not in the incoming properties array
            foreach(array_diff(array_keys(eprops),array_keys(inprops)) as dk)
                n.setProperty(dk, '')
            
            # Set remaining properties
            foreach(inprops as k : v)
                n.setProperty(k, v)
            
            """
            # Nat redirects and advanced settings
            if args['networkAdapters'][i]['attachmentType'] == 'NAT':

                # Remove existing redirects
                for r in n.NATEngine.getRedirects():
                    n.NATEngine.removeRedirect(r.split(',')[0])

                # Add redirects
                for r in args['networkAdapters'][i]['redirects']:
                    r = r.split(',')
                    n.NATEngine.addRedirect(r[0],r[1],r[2],r[3],r[4],r[5])
                

                # Advanced NAT settings
                aliasMode = n.NATEngine.aliasMode & 1
                if int(args['networkAdapters'][i]['NATEngine']['aliasMode'] & 2): aliasMode = aliasMode | 2
                if int(args['networkAdapters'][i]['NATEngine']['aliasMode'] & 4): aliasMode = aliasMode | 4
                n.NATEngine.aliasMode = aliasMode
                n.NATEngine.DNSProxy = int(args['networkAdapters'][i]['NATEngine']['DNSProxy'])
                n.NATEngine.DNSPassDomain = int(args['networkAdapters'][i]['NATEngine']['DNSPassDomain'])
                n.NATEngine.DNSUseHostResolver = int(args['networkAdapters'][i]['NATEngine']['DNSUseHostResolver'])
                n.NATEngine.hostIP = args['networkAdapters'][i]['NATEngine']['hostIP']


        # Serial Ports
        for i in range(0, len(args['serialPorts'])):

            """ @p ISerialPort """
            p = m.getSerialPort(i)

            if not (p.enabled or int(args['serialPorts'][i]['enabled'])): continue
            
            try:
                p.enabled = int(args['serialPorts'][i]['enabled'])
                p.IOBase = hexdec(args['serialPorts'][i]['IOBase'])
                p.IRQ = int(args['serialPorts'][i]['IRQ'])
                if args['serialPorts'][i].get('path',None):
                    p.path = args['serialPorts'][i]['path']
                    p.hostMode = args['serialPorts'][i]['hostMode']
                else:
                    p.hostMode = args['serialPorts'][i]['hostMode']
                    p.path = args['serialPorts'][i]['path']

                p.server = int(args['serialPorts'][i]['server'])
                
            except Exception as e:
                self.errors.append(e)

        # LPT Ports
        lptChanged = False

        for i in range(0, len(args['parallelPorts'])):

            """ @p IParallelPort """
            p = m.getParallelPort(i)

            if not (p.enabled or int(args['parallelPorts'][i]['enabled'])): continue
            lptChanged = True
            try:
                p.IOBase = hexdec(args['parallelPorts'][i]['IOBase'])
                p.IRQ = int(args['parallelPorts'][i]['IRQ'])
                p.path = args['parallelPorts'][i]['path']
                p.enabled = int(args['parallelPorts'][i]['enabled'])
                p.releaseRemote()
            except Exception as e:
                self.errors.append(e)


        sharedEx = {}
        sharedNew = {}
        for s in self._machineGetSharedFolders(m):
            sharedEx[s['name']] = {'name':s['name'],'hostPath':s['hostPath'],'autoMount':s['autoMount'],'writable':s['writable']}
        
        for s in args['sharedFolders']:
            sharedNew[s['name']] = {'name':s['name'],'hostPath':s['hostPath'],'autoMount':s['autoMount'],'writable':s['writable']}

        # Compare
        if len(sharedEx) != len(sharedNew) or (serialize(sharedEx) != serialize(sharedNew)):
            for s in sharedEx:
                m.removeSharedFolder(s['name'])
            for s in sharedNew:
                try:
                    m.createSharedFolder(s['name'],s['hostPath'],s['writable'],s['autoMount'])
                except Exception as e:
                    self.errors.append(e)
                        

        # USB Filters
        usbEx = {}
        usbNew = {}

        usbc = self._machineGetUSBController(self.session.machine)

        # controller properties
        if usbc['enabled'] != args['USBController']['enabled'] or usbc['enabledEHCI'] != args['USBController']['enabledEHCI']:
            m.USBController.enabled = args['USBController']['enabled']
            m.USBController.enabledEHCI = args['USBController']['enabledEHCI']

        # filters
        if args['USBController'].get('deviceFilters', None) is None: args['USBController']['deviceFilters'] = array()
        if len(usbc['deviceFilters']) != len(args['USBController']['deviceFilters']) or serialize(usbc['deviceFilters']) != serialize(args['USBController']['deviceFilters']):

            # usb filter properties to change
            usbProps = ['vendorId','productId','revision','manufacturer','product','serialNumber','port','remote']

            # Remove and Add filters
            try:


                max = max(len(usbc['deviceFilters']),len(args['USBController']['deviceFilters']))
                offset = 0

                # Remove existing
                for i in range(0, max):

                    # Only if filter differs
                    if serialize(usbc['deviceFilters'][i]) != serialize(args['USBController']['deviceFilters'][i]):

                        # Remove existing?
                        if i < len(usbc['deviceFilters']):
                            m.USBController.removeDeviceFilter((i-offset))
                            offset = offset + 1

                        # Exists in new?
                        if len(args['USBController']['deviceFilters'][i]):

                            # Create filter
                            f = m.USBController.createDeviceFilter(args['USBController']['deviceFilters'][i]['name'])
                            f.active = args['USBController']['deviceFilters'][i]['active']

                            for p in usbProps:
                                setattr(f,p,args['USBController']['deviceFilters'][i][p])

                            m.USBController.insertDeviceFilter(i,f.handle)
                            offset = offset - 1

            except Exception as e:
                self.errors.append(e)


        # Rename goes last
        if m.name != args['name']:
            m.name = args['name']
            
        self.session.machine.saveSettings()

        
        self.session.unlockMachine()
        self.session = None

        return True


    """
     * Add a virtual machine via its settings file.
     *
     * @param array args array of arguments. See def body for details.
     * @return boolean True on success
     """
    def remote_machineAdd(self, args):

        """ @m IMachine """
        m = self.vbox.openMachine(args['file'])
        self.vbox.registerMachine(m.handle)
        return True

    """
     * Get progress operation status. On completion, destory progress operation.
     *
     * @param array args array of arguments. See def body for details.
     * @return array response data
     """
    def remote_progressGet(self, args):

        # progress operation result
        response = {}
        success = 1
        error = 0

        return False
    
    """
     * Cancel a running progress operation
     *
     * @param array args array of arguments. See def body for details.
     * @param array response response data passed byref populated by the function
     * @return boolean True on success
     """
    def remote_progressCancel(self, args):

        return False

    """
     * Destory a progress operation.
     *
     * @param array pop progress operation details
     * @return boolean True on success
     """
    def _util_progressDestroy(self, pop):

        return False
    
    """
     * Returns a key : value mapping of an enumeration class contained
     * in vboxServiceWrappers.php (classes that extend VBox_Enum).
     *
     * @param array args array of arguments. See def body for details.
     * @return array response data
     * @see vboxServiceWrappers.php
     """
    def remote_vboxGetEnumerationMap(self, args):
        
        return False

    """
     * Save VirtualBox system properties
     *
     * @param array args array of arguments. See def body for details.
     * @return boolean True on success
     """
    def remote_vboxSystemPropertiesSave(self, args):

        self.vbox.systemProperties.defaultMachineFolder = args['SystemProperties']['defaultMachineFolder']
        self.vbox.systemProperties.VRDEAuthLibrary = args['SystemProperties']['VRDEAuthLibrary']
        self.vbox.systemProperties.autostartDatabasePath = args['SystemProperties']['autostartDatabasePath']

        return True

    """
     * Import a virtual appliance
     *
     * @param array args array of arguments. See def body for details.
     * @return array response data
     """
    def remote_applianceImport(self, args):

        """ @app IAppliance """
        app = self.vbox.createAppliance()

        """ @progress IProgress """
        progress = app.read(args['file'])

        # Does an exception exist?
        try:
            if progress.errorInfo:
                ##self.errors.append(new Exception(progress.errorInfo.text)
                return False
        except:
            pass

        progress.waitForCompletion(-1)

        app.interpret()

        a = 0
        for d in app.virtualSystemDescriptions: # @d IVirtualSystemDescription """
            # Replace with passed values
            #args['descriptions'][a][5] = array_pad(args['descriptions'][a][5], len(args['descriptions'][a][3]),True)
            for k in args['descriptions'][a][5].keys():
                args['descriptions'][a][5][k] = args['descriptions'][a][5][k]
            d.setFinalValues(args['descriptions'][a][5],args['descriptions'][a][3],args['descriptions'][a][4])
            a = a + 1

        """ @progress IProgress """
        progress = app.importMachines(['KeepNATMACs' if args['reinitNetwork'] else 'KeepAllMACs'])

        app.releaseRemote()

        # Does an exception exist?
        try:
            if progress.errorInfo:
                ##self.errors.append(new Exception(progress.errorInfo.text)
                return False
        except:
            pass
        

        # Save progress
        self._util_progressStore(progress)

        return {'progress' : progress.handle}


    """
     * Get a list of VMs that are available for export.
     *
     * @param array args array of arguments. See def body for details.
     * @return array list of exportable machiens
     """
    def remote_vboxGetExportableMachines(self, args):

        #Get a list of registered machines
        machines = self.vbox.machines
        
        response = {}

        for machine in machines: # @machine IMachine """

            try:
                response.append({
                    'name' : machine.name,
                    'state' : str(machine.state),
                    'OSTypeId' : machine.getOSTypeId(),
                    'id' : machine.id,
                    'description' : machine.description
                })

            except:
                pass
                # Ignore. Probably inaccessible machine.

        return response


    """
     * Read and interpret virtual appliance file
     *
     * @param array args array of arguments. See def body for details.
     * @return array appliance file content descriptions
     """
    def remote_applianceReadInterpret(self, args):

        """ @app IAppliance """
        app = self.vbox.createAppliance()

        """ @progress IProgress """
        progress = app.read(args['file'])

        # Does an exception exist?
        try:
            if progress.errorInfo:
                ##self.errors.append(new Exception(progress.errorInfo.text)
                return False
        except:
            pass
        
        progress.waitForCompletion(-1)

        app.interpret()

        response = {'warnings' : app.getWarnings(),
            'descriptions' : []}
        
        i = 0
        for d in app.virtualSystemDescriptions:
            desc = []
            response['descriptions'][i] = d.getDescription()
            for ddesc in response['descriptions'][i][0]:
                desc.append(ddesc)

            response['descriptions'][i][0] = desc
            i = i + 1

        app=None

        return response


    """
     * Export VMs to a virtual appliance file
     *
     * @param array args array of arguments. See def body for details.
     * @return array response data
     """
    def remote_applianceExport(self, args):

        """ @app IAppliance """
        app = self.vbox.createAppliance()

        # Overwrite existing file?
        if args['overwrite']:

            dsep = self.getDsep()

            path = args['file'].replace(dsep.dsep,dsep)
            dir = dirname(path)
            file = basename(path)

            if dir[-1] != dsep: dir = dir + dsep

            """ @vfs IVFSExplorer """
            vfs = app.createVFSExplorer('file://' + dir)

            """ @progress IProgress """
            progress = vfs.remove([file])
            progress.waitForCompletion(-1)
            progress.releaseRemote()

            vfs.releaseRemote()

        appProps = {
            'name' : 'Name',
            'description' : 'Description',
            'product' : 'Product',
            'vendor' : 'Vendor',
            'version' : 'Version',
            'product-url' : 'ProductUrl',
            'vendor-url' : 'VendorUrl',
            'license' : 'License'}


        for vm in args['vms']:

            """ @m IMachine """
            m = self.vbox.findMachine(vm['id'])
            desc = m.export(app.handle, args['file'])
            props = desc.getDescription()
            ptypes = []
            for p in props[0]: ptypes.append(str(p))
            
            typecount = 0
            for k, v in appProps.iteritems():
                
                # Check for existing property
                #if (i = array_search(v,ptypes)) != False:
                if False:
                    props[3][i] = vm[k]
                else:
                    desc.addDescription(v,vm[k],None)
                    props[3].append(vm[k])
                    props[4].append(None)
                    
                typecount = typecount + 1

            enabled = array_pad(array(),len(props[3]),True)
            for k in enabled.keys(): enabled[k] = enabled[k]
            desc.setFinalValues(enabled,props[3],props[4])


        """ @progress IProgress """
        progress = app.write(args.get('format','ovf-1.0'),(True if args['manifest'] else False),args['file'])
        

        # Does an exception exist?
        try:
            if progress.errorInfo:
                ##self.errors.append(new Exception(progress.errorInfo.text)
                return False

        except:
            pass

        # Save progress
        self._util_progressStore(progress)

        return {'progress' : progress}


    """
     * Get host networking info
     *
     * @param unused args
     * @param array response response data passed byref populated by the function
     * @return array networking info data
     """
    def remote_hostGetNetworking(self, args):

        response = {}
        networks = []
        nics = []
        genericDrivers = []
        
        """ Get host nics """
        for d in self.vbox.host.networkInterfaces:
            nics.append(d.name)

        
        """ Get internal Networks """
        networks = self.vbox.internalNetworks
        
        """ Generic Drivers """
        genericDrivers = self.vbox.genericNetworkDrivers
        
        return {
            'nics' : nics,
            'networks' : networks,
            'vdenetworks' : vdenetworks,
            'genericDrivers' : genericDrivers
        }
        

    """
     * Get host-only interface information
     *
     * @param unused args
     * @return array host only interface data
     """
    def remote_hostOnlyInterfacesGet(self, args):

        """
         * NICs
         """
        response = {'networkInterfaces' : []}
        for d in self.vbox.host.networkInterfaces:

            if d.interfaceType != 'HostOnly':
                continue

            # Get DHCP Info
            try:
                """ @dhcp IDHCPServer """
                dhcp = self.vbox.findDHCPServerByNetworkName(d.networkName)
                if dhcp:
                    dhcpserver = {
                        'enabled' : dhcp.enabled,
                        'IPAddress' : dhcp.IPAddress,
                        'networkMask' : dhcp.networkMask,
                        'networkName' : dhcp.networkName,
                        'lowerIP' : dhcp.lowerIP,
                        'upperIP' : dhcp.upperIP
                    }
                else:
                    dhcpserver = {}

            except:
                dhcpserver = {}

            response['networkInterfaces'].append({
                'id' : d.id,
                'IPV6Supported' : d.IPV6Supported,
                'name' : d.name,
                'IPAddress' : d.IPAddress,
                'networkMask' : d.networkMask,
                'IPV6Address' : d.IPV6Address,
                'IPV6NetworkMaskPrefixLength' : d.IPV6NetworkMaskPrefixLength,
                'DHCPEnabled' : d.DHCPEnabled,
                'networkName' : d.networkName,
                'dhcpServer' : dhcpserver
            })

        return response


    """
     * Save host-only interface information
     *
     * @param array args array of arguments. See def body for details.
     * @return boolean True on success
     """
    def remote_hostOnlyInterfacesSave(self, args):

        nics = args['networkInterfaces']

        for i in range(0, len(nics)):

            """ @nic IHostNetworkInterface """
            nic = self.vbox.host.findHostNetworkInterfaceById(nics[i]['id'])

            # Common settings
            if nic.IPAddress != nics[i]['IPAddress'] or nic.networkMask != nics[i]['networkMask']:
                nic.enableStaticIPConfig(nics[i]['IPAddress'],nics[i]['networkMask'])

            if nics[i]['IPV6Supported'] and (nic.IPV6Address != nics[i]['IPV6Address'] or nic.IPV6NetworkMaskPrefixLength != nics[i]['IPV6NetworkMaskPrefixLength']):
                nic.enableStaticIPConfigV6(nics[i]['IPV6Address'],int(nics[i]['IPV6NetworkMaskPrefixLength']))

            # Get DHCP Info
            try:
                dhcp = self.vbox.findDHCPServerByNetworkName(nic.networkName)
            except:
                dhcp = None

            # Create DHCP server?
            if nics[i]['dhcpServer']['enabled'] and not dhcp:
                dhcp = self.vbox.createDHCPServer(nic.networkName)
            
            if dhcp:
                dhcp.enabled = int(nics[i]['dhcpServer']['enabled'])
                dhcp.setConfiguration(nics[i]['dhcpServer']['IPAddress'],nics[i]['dhcpServer']['networkMask'],nics[i]['dhcpServer']['lowerIP'],nics[i]['dhcpServer']['upperIP'])

        return True

    """
     * Add Host-only interface
     * 
     * @param array args array of arguments. See def body for details.
     * @return array response data
     """
    def remote_hostOnlyInterfaceCreate(self, args):

        """ @progress IProgress """
        iface, progress = self.vbox.host.createHostOnlyNetworkInterface()
        

        # Does an exception exist?
        try:
            if progress.errorInfo:
                ##self.errors.append(new Exception(progress.errorInfo.text)
                return False
        except:
            pass

        # Save progress
        self._util_progressStore(progress)

        return {'progress' : progress}


    """
     * Remove a host-only interface
     *
     * @param array args array of arguments. See def body for details.
     * @return array response data
     """
    def remote_hostOnlyInterfaceRemove(args,response):

        """ @progress IProgress """
        progress = self.vbox.host.removeHostOnlyNetworkInterface(args['id'])

        if not progress: return False

        # Does an exception exist?
        try:
            if progress.errorInfo:
                ##self.errors.append(new Exception(progress.errorInfo.text)
                return False
        except:
            pass
        
        # Save progress
        self._util_progressStore(progress)

        return {'progress' : progress}


    """
     * Get a list of Guest OS Types supported by this VirtualBox installation
     *
     * @param unused args
     * @return array of os types
     """
    def remote_vboxGetGuestOSTypes(self, args,response):

        response = []

        ts = self.vbox.getGuestOSTypes()

        supp64 = (self.vbox.host.getProcessorFeature('LongMode') and self.vbox.host.getProcessorFeature('HWVirtEx'))

        for g in ts:

            # Avoid multiple calls
            bit64 = g.is64Bit
            response.append({
                'familyId' : g.familyId,
                'familyDescription' : g.familyDescription,
                'id' : g.id,
                'description' : g.description,
                'is64Bit' : bit64,
                'recommendedRAM' : g.recommendedRAM,
                'recommendedHDD' : (g.recommendedHDD/1024)/1024,
                'supported' : int(not bit64 or supp64)
            })

        return response

    """
     * Set virtual machine state. Running, power off, save state, pause, etc..
     *
     * @param array args array of arguments. See def body for details.
     * @return array response data or boolean True on success
     """
    def remote_machineSetState(self, args):

        vm = args['vm']
        state = args['state']

        states = {
            'powerDown' : {'result':'PoweredOff','progress':2},
            'reset' : {},
            'saveState' : {'result':'Saved','progress':2},
            'powerButton' : {'acpi':True},
            'sleepButton' : {'acpi':True},
            'pause' : {'result':'Paused','progress':False},
            'resume' : {'result':'Running','progress':False},
            'powerUp' : {'result':'Running'},
            'discardSavedState' : {'result':'poweredOff','lock':'shared','force':True}
        }

        # Check for valid state
        if not states.get(state, None):
            #throw new Exception('Invalid state: ' . state)
            return False

        # Machine state
        """ @machine IMachine """
        machine = self.vbox.findMachine(vm)
        mstate = machine.state

        # If state has an expected result, check
        # that we are not already in it
        if states[state].get('result', None):
            if mstate == states[state]['result']:
                return False

        # Special case for power up
        if state == 'powerUp' and mstate == 'Paused':
            state = 'resume'
            
        if state == 'powerUp':
            

            # Try opening session for VM
            try:
            
                # create session
                self.session = self.websessionManager.getSessionObject(self.vbox.handle)

                # set first run
                if machine.getExtraData('GUI/FirstRun') == 'yes':
                    machine.setExtraData('GUI/FirstRun', 'no')
                
                """ @progress IProgress """
                progress = machine.launchVMProcess(self.session.handle, 'headless', '')
            
            except Exception as e:
                # Error opening session
                self.errors.append(e)
                return False
            
            # Does an exception exist?
            try:
                if progress.errorInfo:
                    ##self.errors.append(new Exception(progress.errorInfo.text)
                    return False
                
            except:
                pass
            
            self._util_progressStore(progress)
            
            return {'progress' : progress}
            

        # Open session to machine
        self.session = self.websessionManager.getSessionObject(self.vbox.handle)

        # Lock machine
        machine.lockMachine(self.session.handle,('Write' if states[state].get('lock',None) == 'write' else 'Shared'))

        # If this operation returns a progress object save progress
        progress = None
        if states[state].get('progress', False):

            """ @progress IProgress """
            progress = self.session.console.state()

            if not progress:

                # should never get here
                try:
                    self.session.unlockMachine()
                    self.session = None
                except:
                    pass

                #throw new Exception('Unknown error settings machine to requested state.')
            

            # Does an exception exist?
            try:
                if progress.errorInfo:
                    #self.errors.append(new Exception(progress.errorInfo.text)
                    return False
                
            except: pass

            # Save progress
            self._util_progressStore(progress)

            return {'progress' : progress}

        # Operation does not return a progress object
        # Just call the function
        else:

            self.session.console.state((True if states[state]['force'] else None))


        # Check for ACPI button
        if states[state].get('acpi',False) and not self.session.console.getPowerButtonHandled():
            self.session.unlockMachine()
            self.session = None
            return False


        if not progress:
            self.session.unlockMachine()
            self.session = None

        return True

    
    """
     * Get VirtualBox host memory usage information
     *
     * @param unused args
     * @return array response data
     """
    def remote_hostGetMeminfo(self, args):
        return self.vbox.host.memoryAvailable

    """
     * Get VirtualBox host details
     *
     * @param unused args
     * @return array response data
     """
    def remote_hostGetDetails(self, args):


        """ @host IHost """
        host = self.vbox.host
        response = {
            'id' : 'host',
            'operatingSystem' : host.operatingSystem,
            'OSVersion' : host.OSVersion,
            'memorySize' : host.memorySize,
            'cpus' : [],
            'networkInterfaces' : [],
            'DVDDrives' : [],
            'floppyDrives' : []
        }

        """
         * Processors
         """
        for i in range(0, host.processorCount):
            response['cpus'].append(host.getProcessorDescription(i))

        """
         * Supported CPU features?
         """
        response['cpuFeatures'] = {}
        for k, v in {'HWVirtEx':'HWVirtEx','PAE':'PAE','NestedPaging':'Nested Paging','LongMode':'Long Mode (64-bit)'}.iteritems():
            response['cpuFeatures'][v] = int(host.getProcessorFeature(k))
        

        """
         * NICs
         """
        for d in host.networkInterfaces:
            response['networkInterfaces'].append({
                'name' : d.name,
                'IPAddress' : d.IPAddress,
                'networkMask' : d.networkMask,
                'IPV6Supported' : d.IPV6Supported,
                'IPV6Address' : d.IPV6Address,
                'IPV6NetworkMaskPrefixLength' : d.IPV6NetworkMaskPrefixLength,
                'status' : str(d.status),
                'mediumType' : str(d.mediumType),
                'interfaceType' : str(d.interfaceType),
                'hardwareAddress' : d.hardwareAddress,
                'networkName' : d.networkName
            })

        """
         * Medium types (DVD and Floppy)
         """
        for d in host.DVDDrives:

            response['DVDDrives'].append({
                'id' : d.id,
                'name' : d.name,
                'location' : d.location,
                'description' : d.description,
                'deviceType' : 'DVD',
                'hostDrive' : True
            })

        for d in host.floppyDrives:

            response['floppyDrives'].append({
                'id' : d.id,
                'name' : d.name,
                'location' : d.location,
                'description' : d.description,
                'deviceType' : 'Floppy',
                'hostDrive' : True
            })

        
        return response

    """
     * Get a list of USB devices attached to the VirtualBox host
     *
     * @param unused args
     * @return array of USB devices
     """
    def remote_hostGetUSBDevices(self, args, response):

        response = []

        for d in self.vbox.host.USBDevices:

            response.append({
                'id' : d.id,
                'vendorId' : sprintf('%04s',dechex(d.vendorId)),
                'productId' : sprintf('%04s',dechex(d.productId)),
                'revision' : sprintf('%04s',dechex(d.revision)),
                'manufacturer' : d.manufacturer,
                'product' : d.product,
                'serialNumber' : d.serialNumber,
                'address' : d.address,
                'port' : d.port,
                'version' : d.version,
                'portVersion' : d.portVersion,
                'remote' : d.remote,
                'state' : str(d.state),
                })

        return response


    """
     * Get virtual machine or virtualbox host details
     *
     * @param array args array of arguments. See def body for details.
     * @param ISnapshot snapshot snapshot instance to use if obtaining snapshot details.
     * @see hostGetDetails()
     * @see hostGetNetworking()
     * @return array machine details
     """
    def remote_machineGetDetails(self, args, snapshot=None):

        # Host instead of vm info
        if args['vm'] == 'host':

            response = self.remote_hostGetDetails(args)

            response['networking'] = self.remote_hostGetNetworking(args)

            return response

        #Get registered machine or snapshot machine
        if snapshot:

            """ @machine ISnapshot """
            machine = snapshot

        else:

            """ @machine IMachine """
            machine = self.vbox.findMachine(args['vm'])


            # For correct caching, always use id even if a name was passed
            args['vm'] = machine.id

            # Check for accessibility
            if not machine.accessible:

                return {
                    'name' : machine.name,
                    'state' : 'Inaccessible',
                    'OSTypeId' : 'Other',
                    'id' : machine.id,
                    'sessionState' : 'Inaccessible',
                    'accessible' : 0,
                    'accessError' : {
                        'resultCode' : self._util_resultCodeText(machine.accessError.resultCode),
                        'component' : machine.accessError.component,
                        'text' : machine.accessError.text}
                }

        # Basic data
        data = self._machineGetDetails(machine)

        # Network Adapters
        data['networkAdapters'] = self._machineGetNetworkAdapters(machine)

        # Storage Controllers
        data['storageControllers'] = self._machineGetStorageControllers(machine)

        # Serial Ports
        data['serialPorts'] = self._machineGetSerialPorts(machine)

        # LPT Ports
        data['parallelPorts'] = self._machineGetParallelPorts(machine)

        # Shared Folders
        data['sharedFolders'] = self._machineGetSharedFolders(machine)

        # USB Filters
        data['USBController'] = self._machineGetUSBController(machine)

        # Items when not obtaining snapshot machine info
        if not snapshot:

            data['currentSnapshot'] = {'id':machine.currentSnapshot.id,'name':machine.currentSnapshot.name} if machine.currentSnapshot.handle else None
            data['snapshotCount'] = machine.snapshotCount


        data['accessible'] = 1
        return data

    """
     * Get runtime data of machine.
     * 
     * @param array args array of arguments. See def body for details.
     * @return array of machine runtime data
     """
    def remote_machineGetRuntimeData(self, args, response):

        """ @machine IMachine """
        machine = self.vbox.findMachine(args['vm'])
        data = {
            'id' : args['vm'],
            'state' : machine.state
        }
        
        """
         * TODO:
         * 
         * 5.13.13 getGuestEnteredACPIMode
        boolean IConsole::getGuestEnteredACPIMode()
        Checks if the guest entered the ACPI mode G0 (working) or G1 (sleeping). If this method
        returns False, the guest will most likely not respond to external ACPI events.
        If this method fails, the following error codes may be reported:
         VBOX_E_INVALID_VM_STATE: Virtual machine not in Running state.
        """
        
        # Get current console port
        if data['state'] == 'Running' or data['state'] == 'Paused':
        
            self.session = self.websessionManager.getSessionObject(self.vbox.handle)
            machine.lockMachine(self.session.handle, 'Shared')
            console = self.session.console
        
            # Get guest additions version
            data['guestAdditionsVersion'] = console.guest.additionsVersion
            
            smachine = self.session.machine
            
            data['CPUExecutionCap'] = smachine.CPUExecutionCap
            data['VRDEServerInfo'] = {'port' : console.VRDEServerInfo.port}
            
            vrde = smachine.VRDEServer
            
            data['VRDEServer'] = (None if not vrde else {
                    'enabled' : int(vrde.enabled),
                    'ports' : vrde.getVRDEProperty('TCP/Ports'),
                    'netAddress' : vrde.getVRDEProperty('TCP/Address'),
                    'VNCPassword' : vrde.getVRDEProperty('VNCPassword'),
                    'authType' : vrde.authType,
                    'authTimeout' : vrde.authTimeout,
                    'VRDEExtPack' : vrde.VRDEExtPack
            })
        
            # Get removable media
            data['storageControllers'] = self._machineGetStorageControllers(smachine)
            
            # Get network adapters
            data['networkAdapters'] = self._machineGetNetworkAdapters(smachine)
        
            # Close session and unlock machine
            self.session.unlockMachine()
            self.session = None
        
        
        return data
        
    """
     * Remove a virtual machine
     *
     * @param array args array of arguments. See def body for details.
     * @return boolean True on success or array of response data
     """
    def remote_machineRemove(self, args, response):

        """ @machine IMachine """
        machine = self.vbox.findMachine(args['vm'])

        # Only unregister or delete?
        if not args['delete']:

            machine.unregister('DetachAllReturnNone')

        else:

            hds = []
            delete = machine.unregister('DetachAllReturnHardDisksOnly')
            for hd in delete:
                hds.append(self.vbox.openMedium(hd.location,'HardDisk'))

            """ @progress IProgress """
            progress = machine.delete(hds)

            # Does an exception exist?
            if progress:
                try:
                    if progress.errorInfo:
                        #self.errors.append(new Exception(progress.errorInfo.text)
                        return False
                    
                except: pass

                self._util_progressStore(progress)

                return {'progress' : progress}

        return True


    """
     * Create a new Virtual Machine
     *
     * @param array args array of arguments. See def body for details.
     * @return boolean True on success
     """
    def remote_machineCreate(self, args):

        response = {}
        

        """ Check if file exists """
        filename = self.vbox.composeMachineFilename(args['name'],'',self.vbox.systemProperties.defaultMachineFolder)
        
        if self.remote_fileExists({'file':filename}):
            return {'exists' : filename}
        
        
        """ @m IMachine """
        m = self.vbox.createMachine(None,args['name'],'',args['ostype'],None,None)

        m.setExtraData(self.phpVboxGroupKey, args.get('group_id',0))

        # Set memory
        m.memorySize = int(args['memory'])


        # Save and register
        m.saveSettings()
        self.vbox.registerMachine(m)
        vm = m.id

        try:

            self.session = self.websessionManager.getSessionObject(self.vbox.handle)

            # Lock VM
            """ @machine IMachine """
            machine = self.vbox.findMachine(vm)
            machine.lockMachine(self.session.handle,'Write')

            # OS defaults
            defaults = self.vbox.getGuestOSType(args['ostype'])

            # Always set
            self.session.machine.setExtraData('GUI/SaveMountedAtRuntime', 'yes')
            self.session.machine.setExtraData('GUI/FirstRun', 'yes')

            try:
                self.session.machine.USBController.enabled = True
                
                # This causes problems if the extpack isn't installed
                # self.session.machine.USBController.enabledEHCI = True
                
            except:
                pass

            try:
                if self.session.machine.VRDEServer and self.vbox.systemProperties.defaultVRDEExtPack:
                    self.session.machine.VRDEServer.enabled = 1
                    self.session.machine.VRDEServer.authTimeout = 5000
                    self.session.machine.VRDEServer.setVRDEProperty('TCP/Ports', '3390-5000')
                
            except:
                pass
            
            # Other defaults
            self.session.machine.BIOSSettings.IOAPICEnabled = defaults.recommendedIOAPIC
            self.session.machine.RTCUseUTC = defaults.recommendedRTCUseUTC
            self.session.machine.firmwareType = str(defaults.recommendedFirmware)
            self.session.machine.chipsetType = str(defaults.recommendedChipset)
            if int(defaults.recommendedVRAM) > 0: self.session.machine.VRAMSize = int(defaults.recommendedVRAM)
            self.session.machine.setCpuProperty('PAE',defaults.recommendedPAE)

            # USB input devices
            if defaults.recommendedUSBHid:
                self.session.machine.pointingHIDType = 'USBMouse'
                self.session.machine.keyboardHIDType = 'USBKeyboard'

            """ Only if acceleration configuration is available """
            if self.vbox.host.getProcessorFeature('HWVirtEx'):
                self.session.machine.setHWVirtExProperty('Enabled',defaults.recommendedVirtEx)

            """
             * Hard Disk and DVD/CD Drive
             """
            DVDbusType = str(defaults.recommendedDVDStorageBus)
            DVDconType = str(defaults.recommendedDVDStorageController)

            # Attach harddisk?
            if args.get('disk',None):

                HDbusType = str(defaults.recommendedHDStorageBus)
                HDconType = str(defaults.recommendedHDStorageController)

                sc = self.session.machine.addStorageController(str(HDbusType), str(HDbusType))
                sc.controllerType = HDconType
                sc.useHostIOCache = self.vbox.systemProperties.getDefaultIoCacheSettingForStorageController(HDconType)
                
                # Set port count?
                if HDbusType == 'SATA':
                    sc.portCount = (2 if (HDbusType == DVDbusType) else 1)
                
                m = self.vbox.openMedium(args['disk'],'HardDisk')

                self.session.machine.attachDevice(trans(HDbusType,'UIMachineSettingsStorage'),0,0,'HardDisk',m.handle)

            # Attach DVD/CDROM
            if DVDbusType:

                if not args.get('disk',None) or (HDbusType != DVDbusType):

                    sc = self.session.machine.addStorageController(str(DVDbusType),str(DVDbusType))
                    sc.controllerType = DVDconType
                    sc.useHostIOCache = self.vbox.systemProperties.getDefaultIoCacheSettingForStorageController(DVDconType)
                    
                    # Set port count?
                    if DVDbusType == 'SATA':
                        sc.portCount = (1 if args.get('disk',None) else 2)

                self.session.machine.attachDevice(trans(DVDbusType,'UIMachineSettingsStorage'),1,0,'DVD',None)


            self.session.machine.saveSettings()
            self.session.unlockMachine()
            self.session = None

        except Exception as e:
            self.errors.append(e)
            return False

        return True


    """
     * Return a list of network adapters attached to machine m
     *
     * @param IMachine m virtual machine instance
     * @param int slot optional slot of single network adapter to get
     * @return array of network adapter information
     """
    def _machineGetNetworkAdapters(self, m, slot=False):

        adapters = []

        slotRange = (range(0,8) if not slot == False else [slot])
        
        for i in slotRange:

            """ @n INetworkAdapter """
            n = m.getNetworkAdapter(i)

            # Avoid duplicate calls
            at = str(n.attachmentType)
            if at == 'NAT': nd = n.NATEngine
            else: nd = None

            props = n.getProperties()
            props = implode("\n",array_map(create_function('a,b','return "a=b"'),props[1],props[0]))
             
            adapters.append({
                'adapterType' : str(n.adapterType),
                'slot' : n.slot,
                'enabled' : int(n.enabled),
                'MACAddress' : n.MACAddress,
                'attachmentType' : at,
                'genericDriver' : n.genericDriver,
                'hostOnlyInterface' : n.hostOnlyInterface,
                'bridgedInterface' : n.bridgedInterface,
                'properties' : props,
                'internalNetwork' : n.internalNetwork,
                'NATNetwork' : n.NATNetwork,
                'promiscModePolicy' : str(n.promiscModePolicy),
                'cableConnected' : n.cableConnected,
                'NATEngine' : ({'aliasMode' : int(nd.aliasMode),'DNSPassDomain' : int(nd.DNSPassDomain), 'DNSProxy' : int(nd.DNSProxy), 'DNSUseHostResolver' : int(nd.DNSUseHostResolver), 'hostIP' : nd.hostIP} if at == 'NAT' else
                     {'aliasMode' : 0,'DNSPassDomain' : 0, 'DNSProxy' : 0, 'DNSUseHostResolver' : 0, 'hostIP' : ''}),
                'lineSpeed' : n.lineSpeed,
                'redirects' : (nd.getRedirects() if at == 'NAT' else [])
            })

        return adapters


    """
     * Return a list of virtual machines along with their states and other basic info
     *
     * @param array args array of arguments. See def body for details.
     * @return array list of machines
     """
    def remote_vboxGetMachines(self, args):

        vmlist = array()
        
        # Look for a request for a single vm
        if args['vm']:
            
            machines = array(self.vbox.findMachine(args['vm']))
        
        # Full list
        else:
            #Get a list of registered machines
            machines = self.vbox.machines
            

        for machine in machines:


            try:
                
                vmlist.append({
                    'name' :machine.name,
                    'state' : str(machine.state),
                    'group_id' : int(machine.getExtraData(self.phpVboxGroupKey)),
                    'OSTypeId' : machine.getOSTypeId(),
                    'lastStateChange' : str((machine.lastStateChange/1000)),
                    'id' : machine.id,
                    'currentStateModified' : machine.currentStateModified,
                    'sessionState' : str(machine.sessionState),
                    'currentSnapshotName' : (machine.currentSnapshot.name if machine.currentSnapshot else None),
                    'customIcon' : machine.getExtraData('phpvb/icon')
                })
                
                
            except Exception as e:

                if machine:

                    response['data']['vmlist'].append({
                        'name' : machine.id,
                        'state' : 'Inaccessible',
                        'OSTypeId' : 'Other',
                        'id' : machine.id,
                        'sessionState' : 'Inaccessible',
                        'lastStateChange' : 0,
                        'currentSnapshot' : ''
                    })

                else:
                    self.errors.append(e)

        return vmlist

    """
     * Get a list of media registered with VirtualBox
     *
     * @param unused args
     * @param array response response data passed byref populated by the function
     * @return array of media
     """
    def remote_vboxGetMedia(self, args):

        response = array()
        mds = array(self.vbox.hardDisks,self.vbox.DVDImages,self.vbox.floppyImages)
        for i in range(0, len(mds)):
            for m in mds[i]:
                """ @m IMedium """
                response.append(self._mediumGetDetails(m))
        return response

    """
     * Get USB controller information
     *
     * @param IMachine m virtual machine instance
     * @return array USB controller info
     """
    def _machineGetUSBController(self, m):

        """ @u IUSBController """
        u = m.USBController

        deviceFilters = []
        for df in u.deviceFilters:

            deviceFilters.append({
                'name' : df.name,
                'active' : int(df.active),
                'vendorId' : df.vendorId,
                'productId' : df.productId,
                'revision' : df.revision,
                'manufacturer' : df.manufacturer,
                'product' : df.product,
                'serialNumber' : df.serialNumber,
                'port' : df.port,
                'remote' : df.remote
            })

        return {
            'enabled' : int(u.enabled),
            'enabledEHCI' : u.enabledEHCI,
            'deviceFilters' : deviceFilters
        }

    """
     * Return top-level virtual machine or snapshot information
     *
     * @param IMachine m virtual machine instance
     * @return array vm or snapshot data
     """
    def _machineGetDetails(self, m):

        return {
            'name' : m.name,
            'description' : m.description,
            'groups' : groups,
            'id' : m.id,
            'autostartEnabled' : m.autostartEnabled,
            'settingsFilePath' : m.settingsFilePath,
            'OSTypeId' : m.OSTypeId,
            'OSTypeDesc' : self.vbox.getGuestOSType(m.OSTypeId).description,
            'CPUCount' : m.CPUCount,
            'HPETEnabled' : m.HPETEnabled,
            'memorySize' : m.memorySize,
            'VRAMSize' : m.VRAMSize,
            'pointingHIDType' : str(m.pointingHIDType),
            'keyboardHIDType' : str(m.keyboardHIDType),
            'accelerate3DEnabled' : m.accelerate3DEnabled,
            'accelerate2DVideoEnabled' : m.accelerate2DVideoEnabled,
            'BIOSSettings' : {
                'ACPIEnabled' : m.BIOSSettings.ACPIEnabled,
                'IOAPICEnabled' : m.BIOSSettings.IOAPICEnabled,
                'timeOffset' : m.BIOSSettings.timeOffset
                },
            'firmwareType' : str(m.firmwareType),
            'snapshotFolder' : m.snapshotFolder,
            'monitorCount' : m.monitorCount,
            'pageFusionEnabled' : int(m.pageFusionEnabled),
            'VRDEServer' : (None if not m.VRDEServer else {
                'enabled' : int(m.VRDEServer.enabled),
                'ports' : m.VRDEServer.getVRDEProperty('TCP/Ports'),
                'netAddress' : m.VRDEServer.getVRDEProperty('TCP/Address'),
                'VNCPassword' : m.VRDEServer.getVRDEProperty('VNCPassword'),
                'authType' : str(m.VRDEServer.authType),
                'authTimeout' : m.VRDEServer.authTimeout,
                'allowMultiConnection' : int(m.VRDEServer.allowMultiConnection),
                'VRDEExtPack' : str(m.VRDEServer.VRDEExtPack)
                }),
            'audioAdapter' : {
                'enabled' : int(m.audioAdapter.enabled),
                'audioController' : str(m.audioAdapter.audioController),
                'audioDriver' : str(m.audioAdapter.audioDriver),
                },
            'RTCUseUTC' : m.RTCUseUTC,
            'HWVirtExProperties' : {
                'Enabled' : m.getHWVirtExProperty('Enabled'),
                'NestedPaging' : m.getHWVirtExProperty('NestedPaging'),
                'LargePages' : m.getHWVirtExProperty('LargePages'),
                'Exclusive' : m.getHWVirtExProperty('Exclusive'),
                'VPID' : m.getHWVirtExProperty('VPID')
                },
            'CpuProperties' : {
                'PAE' : m.getCpuProperty('PAE')
                },
            'bootOrder' : self._machineGetBootOrder(m),
            'chipsetType' : str(m.chipsetType),
            'GUI' : {
                'SaveMountedAtRuntime' : m.getExtraData('GUI/SaveMountedAtRuntime'),
                'FirstRun' : m.getExtraData('GUI/FirstRun')
            },
            'customIcon' : m.getExtraData('phpvb/icon'),
            'disableHostTimeSync' : int(m.getExtraData("VBoxInternal/Devices/VMMDev/0/Config/GetHostTimeDisabled")),
            'CPUExecutionCap' : int(m.CPUExecutionCap)
        }


    """
     * Get virtual machine boot order
     *
     * @param IMachine m virtual machine instance
     * @return array boot order
     """
    def _machineGetBootOrder(self, m):
        
        retval = []
        for i in range(0,self.vbox.systemProperties.maxBootPosition):
            if (b = str(m.getBootOrder(i + 1))) == 'None': continue
            retval.append(b)
        return retval


    """
     * Get serial port configuration for a virtual machine or snapshot
     *
     * @param IMachine m virtual machine instance
     * @return array serial port info
     """
    def _machineGetSerialPorts(&m) {
        ports = array()
        for i in range(0, self.vbox.systemProperties.serialPortCount):
            try:
                """ @p ISerialPort """
                p = m.getSerialPort(i)
                ports.append({
                    'slot' : p.slot,
                    'enabled' : int(p.enabled),
                    'IOBase' : '0x'.strtoupper(sprintf('%3s',dechex(p.IOBase))),
                    'IRQ' : p.IRQ,
                    'hostMode' : str(p.hostMode,
                    'server' : int(p.server),
                    'path' : p.path
                })
            except: pass
                # Ignore
        return ports

    """
     * Get parallel port configuration for a virtual machine or snapshot
     *
     * @param IMachine m virtual machine instance
     * @return array parallel port info
     """
    def _machineGetParallelPorts(self, m):

        ports = array()
        for i in range(0, self.vbox.systemProperties.parallelPortCount):
            try:
                """ @p IParallelPort """
                p = m.getParallelPort(i)
                ports.append({
                    'slot' : p.slot,
                    'enabled' : int(p.enabled),
                    'IOBase' : '0x'.strtoupper(sprintf('%3s',dechex(p.IOBase))),
                    'IRQ' : p.IRQ,
                    'path' : p.path
                })
            # Ignore
            except: pass

        return ports

    """
     * Get shared folder configuration for a virtual machine or snapshot
     *
     * @param IMachine m virtual machine instance
     * @return array shared folder info
     """
    def _machineGetSharedFolders(&m) {
        sfs = &m.sharedFolders
        return = array()
        foreach(sfs as sf) { """ @sf ISharedFolder """
            return.append(array(
                'name' : sf.name,
                'hostPath' : sf.hostPath,
                'accessible' : sf.accessible,
                'writable' : sf.writable,
                'autoMount' : sf.autoMount,
                'lastAccessError' : sf.lastAccessError,
                'type' : 'machine'
            )
        }
        return return
    }


    """
     * Get a list of transient (temporary) shared folders
     *
     * @param array args array of arguments. See def body for details.
     * @return array of shared folders
     """
    def remote_consoleGetSharedFolders(args) {

        self.connect()

        """ @machine IMachine """
        machine = self.vbox.findMachine(args['vm'])

        # No need to continue if machine is not running
        if string)machine.state != 'Running') {
            machine.releaseRemote()
            return True
        }

        self.session = self.websessionManager.getSessionObject(self.vbox.handle)
        machine.lockMachine(self.session.handle,'Shared')

        sfs = self.session.console.sharedFolders

        response = array()
        
        foreach(sfs as sf) { """ @sf ISharedFolder """

            response.append(array(
                'name' : sf.name,
                'hostPath' : sf.hostPath,
                'accessible' : sf.accessible,
                'writable' : sf.writable,
                'autoMount' : sf.autoMount,
                'lastAccessError' : sf.lastAccessError,
                'type' : 'transient'
            )
        }

        self.session.unlockMachine()
        self.session = None
        machine.releaseRemote()

        return response
    }
    
    """
     * Get VirtualBox Host OS specific directory separator
     * 
     * @return string directory separator string
     """
    def getDsep() {

        if !self.dsep) {
            
            """ No need to go through vbox if local browser is True """
            if self.settings.browserLocal) {

                self.dsep = DIRECTORY_SEPARATOR
            
            } else {
            
                self.connect()
                
                if stripos(self.vbox.host.operatingSystem,'windows') !== False) {
                    self.dsep = '\\'
                } else {
                    self.dsep = '/'
                }
            }
            
        
        }
        
        return self.dsep
    }

    """
     * Get medium attachment information for all medium attachments in mas
     *
     * @param IMediumAttachment[] mas list of IMediumAttachment instances
     * @return array medium attachment info
     """
    def _machineGetMediumAttachments(&mas) {

        return = array()

        foreach(mas as ma) { """ @ma IMediumAttachment """
            return.append(array(
                'medium' : (ma.medium.handle ? array('id':ma.medium.id) : None),
                'controller' : ma.controller,
                'port' : ma.port,
                'device' : ma.device,
                'type' : str(ma.type,
                'passthrough' : int(ma.passthrough),
                'temporaryEject' : int(ma.temporaryEject),
                'nonRotational' : int(ma.nonRotational)
            )
        }

        # sort by port then device
        usort(return,create_function('a,b', 'if a["port"] == b["port"]) { if a["device"] < b["device"]) { return -1 } if a["device"] > b["device"]) { return 1 } return 0 } if a["port"] < b["port"]) { return -1 } return 1'))
        
        return return
    }

    """
     * Save snapshot details ( description or name)
     *
     * @param array args array of arguments. See def body for details.
     * @return boolean True on success
     """
    def remote_snapshotSave(args) {

        # Connect to vboxwebsrv
        self.connect()

        """ @vm IMachine """
        vm = self.vbox.findMachine(args['vm'])

        """ @snapshot ISnapshot """
        snapshot = vm.findSnapshot(args['snapshot'])
        snapshot.name = args['name']
        snapshot.description = args['description']

        # cleanup
        snapshot.releaseRemote()
        vm.releaseRemote()

        return True
    }

    """
     * Get snapshot details
     *
     * @param array args array of arguments. See def body for details.
     * @return array containing snapshot details
     """
    def remote_snapshotGetDetails(args) {

        # Connect to vboxwebsrv
        self.connect()

        """ @vm IMachine """
        vm = self.vbox.findMachine(args['vm'])

        """ @snapshot ISnapshot """
        snapshot = vm.findSnapshot(args['snapshot'])

        response = self._snapshotGetDetails(snapshot,False)
        response['machine'] = self.remote_machineGetDetails(array(),snapshot.machine)

        # cleanup
        snapshot.releaseRemote()
        vm.releaseRemote()

        return response

    }

    """
     * Restore a snapshot
     *
     * @param array args array of arguments. See def body for details.
     * @return array response data containing progress operation id
     """
    def remote_snapshotRestore(args, response) {

        # Connect to vboxwebsrv
        self.connect()

        progress = self.session = None

        try:

            # Open session to machine
            self.session = self.websessionManager.getSessionObject(self.vbox.handle)

            """ @machine IMachine """
            machine = self.vbox.findMachine(args['vm'])
            machine.lockMachine(self.session.handle,'Write')

            """ @snapshot ISnapshot """
            snapshot = self.session.machine.findSnapshot(args['snapshot'])

            """ @progress IProgress """
            progress = self.session.console.restoreSnapshot(snapshot.handle)

            snapshot.releaseRemote()
            machine.releaseRemote()

            # Does an exception exist?
            try:
                if progress.errorInfo:
                    #self.errors.append(new Exception(progress.errorInfo.text)
                    progress.releaseRemote()
                    return False
                }
            except: pass

            self._util_progressStore(progress)

        except Exception as e:

            self.errors.append(e

            if self.session.handle) {
                try{self.session.unlockMachine()}catch(Exception e){}
            }
            return False
        }

        return {'progress' : progress}

    }

    """
     * Delete a snapshot
     *
     * @param array args array of arguments. See def body for details.
     * @return array response data containing progress operation id
     """
    def remote_snapshotDelete(args, response) {

        # Connect to vboxwebsrv
        self.connect()

        progress = self.session = None

        try:

            # Open session to machine
            self.session = self.websessionManager.getSessionObject(self.vbox.handle)

            """ @machine IMachine """
            machine = self.vbox.findMachine(args['vm'])
            machine.lockMachine(self.session.handle, 'Shared')

            """ @progress IProgress """
            progress = self.session.console.deleteSnapshot(args['snapshot'])

            machine.releaseRemote()

            # Does an exception exist?
            try:
                if progress.errorInfo:
                    #self.errors.append(new Exception(progress.errorInfo.text)
                    progress.releaseRemote()
                    return False
                }
            except: pass

            self._util_progressStore(progress)


        except Exception as e:

            self.errors.append(e

            if self.session.handle) {
                try{self.session.unlockMachine()self.session=None}catch(Exception e){}
            }

            return False
        }

        return {'progress' : progress}

    }

    """
     * Take a snapshot
     *
     * @param array args array of arguments. See def body for details.
     * @return array response data containing progress operation id
     """
    def remote_snapshotTake(args) {

        # Connect to vboxwebsrv
        self.connect()

        """ @machine IMachine """
        machine = self.vbox.findMachine(args['vm'])

        progress = self.session = None

        try:

            # Open session to machine
            self.session = self.websessionManager.getSessionObject(self.vbox.handle)
            machine.lockMachine(self.session.handle, (str(machine.sessionState == 'Unlocked' ? 'Write' : 'Shared'))

            """ @progress IProgress """
            progress = self.session.console.takeSnapshot(args['name'],args['description'])

            # Does an exception exist?
            try:
                if progress.errorInfo:
                    #self.errors.append(new Exception(progress.errorInfo.text)
                    progress.releaseRemote()
                    try{self.session.unlockMachine() self.session=None}catch(Exception ed){}
                    return False
                }
            except: pass

            
            self._util_progressStore(progress)

        except Exception as e:

            self.errors.append(e

            if !progress.handle and self.session.handle) {
                try{self.session.unlockMachine()self.session=None}catch(Exception e){}
            }

            return False
        }

        return {'progress' : progress}

    }

    """
     * Get a list of snapshots for a machine
     *
     * @param array args array of arguments. See def body for details.
     * @return array list of snapshots
     """
    def remote_machineGetSnapshots(args) {

        # Connect to vboxwebsrv
        self.connect()

        """ @machine IMachine """
        machine = self.vbox.findMachine(args['vm'])

        response = array('vm' : args['vm'], 
            'snapshot' : array(),
            'currentSnapshotId' : None)
        
        """ No snapshots? Empty array """
        if machine.snapshotCount < 1) {
            return response
        } else {

            """ @s ISnapshot """
            s = machine.findSnapshot(None)
            response['snapshot'] = self._snapshotGetDetails(s,True)
            s.releaseRemote()
        }

        response['currentSnapshotId'] = (machine.currentSnapshot.handle ? machine.currentSnapshot.id : '')
        if machine.currentSnapshot.handle) machine.currentSnapshot.releaseRemote()
        machine.releaseRemote()

        return response
    }


    """
     * Return details about snapshot s
     *
     * @param ISnapshot s snapshot instance
     * @param boolean sninfo traverse child snapshots
     * @return array snapshot info
     """
    def _snapshotGetDetails(&s,sninfo=False) {

        children = array()

        if sninfo)
            foreach(s.children as c) { """ @c ISnapshot """
                children.append(self._snapshotGetDetails(c, True)
                c.releaseRemote()
            }

        # Avoid multiple soap calls
        timestamp = str(s.timeStamp

        return array(
            'id' : s.id,
            'name' : s.name,
            'description' : s.description,
            'timeStamp' : floor(timestamp/1000),
            'timeStampSplit' : self._util_splitTime(time() - floor(timestamp/1000)),
            'online' : s.online
        ) + (
            (sninfo ? array('children' : children) : array())
        )
    }

    """
     * Return details about storage controllers for machine m
     *
     * @param IMachine m virtual machine instance
     * @return array storage controllers' details
     """
    def _machineGetStorageControllers(&m) {

        sc = array()
        scs = m.storageControllers

        foreach(scs as c) { """ @c IStorageController """
            sc.append(array(
                'name' : c.name,
                'maxDevicesPerPortCount' : c.maxDevicesPerPortCount,
                'useHostIOCache' : int(c.useHostIOCache),
                'minPortCount' : c.minPortCount,
                'maxPortCount' : c.maxPortCount,
                'portCount' : c.portCount,
                'bus' : str(c.bus,
                'controllerType' : str(c.controllerType,
                'mediumAttachments' : self._machineGetMediumAttachments(m.getMediumAttachmentsOfController(c.name), m.id)
            )
            c.releaseRemote()
        }

        for(i = 0 i < len(sc) i++) {

            for(a = 0 a < len(sc[i]['mediumAttachments']) a++) {

                # Value of '' means it is not applicable
                sc[i]['mediumAttachments'][a]['ignoreFlush'] = ''

                # Only valid for HardDisks
                if sc[i]['mediumAttachments'][a]['type'] != 'HardDisk') continue

                # Get appropriate key
                xtra = self._util_getIgnoreFlushKey(sc[i]['mediumAttachments'][a]['port'], sc[i]['mediumAttachments'][a]['device'], sc[i]['controllerType'])

                # No such setting for this bus type
                if !xtra) continue

                sc[i]['mediumAttachments'][a]['ignoreFlush'] = m.getExtraData(xtra)

                if trim(sc[i]['mediumAttachments'][a]['ignoreFlush']) == '')
                    sc[i]['mediumAttachments'][a]['ignoreFlush'] = 1
                else
                    sc[i]['mediumAttachments'][a]['ignoreFlush'] = int(sc[i]['mediumAttachments'][a]['ignoreFlush'])

            }
        }

        return sc
    }

    """
     * Resize a medium. Currently unimplemented in GUI.
     * 
     * @param array args array of arguments. See def body for details.
     * @return array response data containing progress id
     """
    def remote_mediumResize(args) {

        # Connect to vboxwebsrv
        self.connect()
        
        m = self.vbox.openMedium(args['medium'],'HardDisk')

        """ @progress IProgress """
        progress = m.resize(args['bytes'])
        
        # Does an exception exist?
        try:
            if progress.errorInfo:
                #self.errors.append(new Exception(progress.errorInfo.text)
                progress.releaseRemote()
                return False
            }
        } catch (Exception None) {
        }
        
        self._util_progressStore(progress)
        
        return {'progress' : progress}
        
    }
    
    """
     * Clone a medium
     *
     * @param array args array of arguments. See def body for details.
     * @return array response data containing progress id
     """
    def remote_mediumCloneTo(args) {

        # Connect to vboxwebsrv
        self.connect()

        format = strtoupper(args['format'])
        """ @target IMedium """
        target = self.vbox.createHardDisk(format,args['location'])
        mid = target.id

        """ @src IMedium """
        src = self.vbox.openMedium(args['src'],'HardDisk')

        type = (args['type'] == 'fixed' ? 'Fixed' : 'Standard')
        mv = new MediumVariant()
        type = mv.ValueMap[type]
        if args['split']) type += mv.ValueMap['VmdkSplit2G']

        """ @progress IProgress """
        progress = src.cloneTo(target.handle,type,None)

        src.releaseRemote()
        target.releaseRemote()

        # Does an exception exist?
        try:
            if progress.errorInfo:
                #self.errors.append(new Exception(progress.errorInfo.text)
                progress.releaseRemote()
                return False
            }
        except: pass

        self._util_progressStore(progress)

        return array('progress' : progress.handle, 'id' : mid)

    }

    """
     * Set medium to a specific type
     *
     * @param array args array of arguments. See def body for details.
     * @return boolean True on success
     """
    def remote_mediumSetType(args) {

        # Connect to vboxwebsrv
        self.connect()

        """ @m IMedium """
        m = self.vbox.openMedium(args['medium'],'HardDisk')
        m.type = args['type']
        m.releaseRemote()

        return True
    }

    """
     * Add iSCSI medium
     *
     * @param array args array of arguments. See def body for details.
     * @return response data
     """
    def remote_mediumAddISCSI(args) {

        # Connect to vboxwebsrv
        self.connect()

        # {'server':server,'port':port,'intnet':intnet,'target':target,'lun':lun,'enclun':enclun,'targetUser':user,'targetPass':pass}

        # Fix LUN
        args['lun'] = int(args['lun'])
        if args['enclun']) args['lun'] = 'enc'.args['lun']

        # Compose name
        name = args['server'].'|'.args['target']
        if args['lun'] != 0 and args['lun'] != 'enc0')
            name .= '|'.args['lun']

        # Create disk
        """ @hd IMedium """
        hd = self.vbox.createHardDisk('iSCSI',name)

        if args['port']) args['server'] .= ':'.int(args['port'])

        arrProps = array()

        arrProps["TargetAddress"] = args['server']
        arrProps["TargetName"] = args['target']
        arrProps["LUN"] = args['lun']
        if args['targetUser']) arrProps["InitiatorUsername"] = args['targetUser']
        if args['targetPass']) arrProps["InitiatorSecret"] = args['targetPass']
        if args['intnet']) arrProps["HostIPStack"] = '0'

        hd.setProperties(array_keys(arrProps),array_values(arrProps))

        hdid = hd.id
        hd.releaseRemote()
        
        return array('id' : hdid)
    }

    """
     * Add existing medium by file location
     *
     * @param array args array of arguments. See def body for details.
     * @return resposne data containing new medium's id
     """
    def remote_mediumAdd(args) {

        # Connect to vboxwebsrv
        self.connect()

        """ @m IMedium """
        m = self.vbox.openMedium(args['path'],args['type'],'ReadWrite',False)

        mid = m.id
        m.releaseRemote()
        
        return array('id':mid)
    }

    """
     * Get VirtualBox generated machine configuration file name
     *
     * @param array args array of arguments. See def body for details.
     * @return string filename
     """
    def remote_vboxGetComposedMachineFilename(args) {

        # Connect to vboxwebsrv
        self.connect()

        return self.vbox.composeMachineFilename(args['name'],(self.settings.phpVboxGroups ? '' : args['group']),self.vbox.systemProperties.defaultMachineFolder)

    }

    """
     * Create base storage medium (virtual hard disk)
     *
     * @param array args array of arguments. See def body for details.
     * @return response data containing progress id
     """
    def remote_mediumCreateBaseStorage(args) {

        # Connect to vboxwebsrv
        self.connect()

        format = strtoupper(args['format'])
        type = (args['type'] == 'fixed' ? 'Fixed' : 'Standard')
        mv = new MediumVariant()
        type = mv.ValueMap[type]
        if args['split']) type += mv.ValueMap['VmdkSplit2G']

        """ @hd IMedium """
        hd = self.vbox.createHardDisk(format,args['file'])

        """ @progress IProgress """
        progress = hd.createBaseStorage(int(args['size'])*1024*1024,type)

        # Does an exception exist?
        try:
            if progress.errorInfo:
                #self.errors.append(new Exception(progress.errorInfo.text)
                progress.releaseRemote()
                return False
            }
        except: pass

        self._util_progressStore(progress)

        hd.releaseRemote()

        return {'progress' : progress}

    }

    """
     * Release medium from all attachments
     *
     * @param array args array of arguments. See def body for details.
     * @return boolean True
     """
    def remote_mediumRelease(args,response) {

        # Connect to vboxwebsrv
        self.connect()

        """ @m IMedium """
        m = self.vbox.openMedium(args['medium'],args['type'])
        mediumid = m.id

        # connected to...
        machines = m.machineIds
        released = array()
        foreach(machines as uuid) {

            # Find medium attachment
            try:
                """ @mach IMachine """
                mach = self.vbox.findMachine(uuid)
            except Exception as e:
                self.errors.append(e
                continue
            }
            attach = mach.mediumAttachments
            remove = array()
            foreach(attach as a) {
                if a.medium.handle and a.medium.id == mediumid) {
                    remove.append(array(
                        'controller' : a.controller,
                        'port' : a.port,
                        'device' : a.device)
                    break
                }
            }
            # save state
            state = str(mach.sessionState

            if !len(remove)) continue

            released.append(uuid

            # create session
            self.session = self.websessionManager.getSessionObject(self.vbox.handle)

            # Hard disk requires machine to be stopped
            if args['type'] == 'HardDisk' or state == 'Unlocked') {

                mach.lockMachine(self.session.handle, 'Write')

            } else {

                mach.lockMachine(self.session.handle, 'Shared')

            }

            foreach(remove as r) {
                if args['type'] == 'HardDisk') {
                    self.session.machine.detachDevice(r['controller'],r['port'],r['device'])
                } else {
                    self.session.machine.mountMedium(r['controller'],r['port'],r['device'],None,True)
                }
            }

            self.session.machine.saveSettings()
            self.session.machine.releaseRemote()
            self.session.unlockMachine()
            self.session = None
            mach.releaseRemote()

        }
        m.releaseRemote()

        return True
    }

    """
     * Remove a medium
     *
     * @param array args array of arguments. See def body for details.
     * @return response data possibly containing progress operation id
     """
    def remote_mediumRemove(args) {

        # Connect to vboxwebsrv
        self.connect()

        if !args['type']) args['type'] = 'HardDisk'

        """ @m IMedium """
        m = self.vbox.openMedium(args['medium'],args['type'])

        if args['delete'] and @self.settings.deleteOnRemove and str(m.deviceType == 'HardDisk') {

            """ @progress IProgress """
            progress = m.deleteStorage()

            m.releaseRemote()

            # Does an exception exist?
            try:
                if progress.errorInfo:
                    #self.errors.append(new Exception(progress.errorInfo.text)
                    return False
                }
            except: pass

            self._util_progressStore(progress)
            return {'progress' : progress}

        } else {
            m.close()
            m.releaseRemote()
        }

        return True
    }

    """
     * Get a list of recent media
     *
     * @param array args array of arguments. See def body for details.
     * @return array of recent media
     """
    def remote_vboxRecentMediaGet(args) {

        # Connect to vboxwebsrv
        self.connect()

        mlist = array()
        foreach(array(
            array('type':'HardDisk','key':'GUI/RecentListHD'),
            array('type':'DVD','key':'GUI/RecentListCD'),
            array('type':'Floppy','key':'GUI/RecentListFD')) as r) {
            list = self.vbox.getExtraData(r['key'])
            mlist[r['type']] = array_filter(explode('', trim(list,'')))
        }
        return mlist
    }

    """
     * Get a list of recent media paths
     *
     * @param array args array of arguments. See def body for details.
     * @return array of recent media paths
     """
    def remote_vboxRecentMediaPathsGet(args) {

        # Connect to vboxwebsrv
        self.connect()

        mlist = array()
        foreach(array(
            array('type':'HardDisk','key':'GUI/RecentFolderHD'),
            array('type':'DVD','key':'GUI/RecentFolderCD'),
            array('type':'Floppy','key':'GUI/RecentFolderFD')) as r) {
            mlist[r['type']] = self.vbox.getExtraData(r['key'])
        }
        return mlist
    }


    """
     * Update recent medium path list
     *
     * @param array args array of arguments. See def body for details.
     * @return boolean True on success
     """
    def remote_vboxRecentMediaPathSave(args) {

        # Connect to vboxwebsrv
        self.connect()

        types = array(
            'HardDisk':'GUI/RecentFolderHD',
            'DVD':'GUI/RecentFolderCD',
            'Floppy':'GUI/RecentFolderFD'
        )

        self.vbox.setExtraData(types[args['type']], args['folder'])

        return True
    }

    """
     * Update recent media list
     *
     * @param array args array of arguments. See def body for details.
     * @return boolean True on success
     """
    def remote_vboxRecentMediaSave(args) {

        # Connect to vboxwebsrv
        self.connect()

        types = array(
            'HardDisk':'GUI/RecentListHD',
            'DVD':'GUI/RecentListCD',
            'Floppy':'GUI/RecentListFD'
        )

        self.vbox.setExtraData(types[args['type']], implode('',array_unique(args['list'])).'')

        return True

    }

    """
     * Mount a medium on the VM
     *
     * @param array args array of arguments. See def body for details.
     * @return boolean True on success
     """
    def remote_mediumMount(args,response) {

        # Connect to vboxwebsrv
        self.connect()

        # Find medium attachment
        """ @machine IMachine """
        machine = self.vbox.findMachine(args['vm'])
        state = str(machine.sessionState
        save = (strtolower(machine.getExtraData('GUI/SaveMountedAtRuntime')) == 'yes')

        # create session
        self.session = self.websessionManager.getSessionObject(self.vbox.handle)

        if state == 'Unlocked') {
            machine.lockMachine(self.session.handle,'Write')
            save = True # force save on closed session as it is not a "run-time" change
        } else {

            machine.lockMachine(self.session.handle, 'Shared')
        }

        # Empty medium / eject
        if args['medium'] == 0) {
            med = None
        } else {
            # Host drive
            if strtolower(args['medium']['hostDrive']) == 'True' or args['medium']['hostDrive'] == True) {
                # CD / DVD Drive
                if args['medium']['deviceType'] == 'DVD') {
                    drives = self.vbox.host.DVDDrives
                # floppy drives
                } else {
                    drives = self.vbox.host.floppyDrives
                }
                foreach(drives as m) { """ @m IMedium """
                    if m.id == args['medium']['id']) {
                        """ @med IMedium """
                        med = &m
                        break
                    }
                    m.releaseRemote()
                }
            # Normal medium
            } else {
                """ @med IMedium """
                med = self.vbox.openMedium(args['medium']['location'],args['medium']['deviceType'])
            }
        }

        self.session.machine.mountMedium(args['controller'],args['port'],args['device'],(is_object(med) ? med.handle : None),True)

        if is_object(med)) med.releaseRemote()

        if save) self.session.machine.saveSettings()

        self.session.unlockMachine()
        machine.releaseRemote()
        self.session = None

        return True
    }

    """
     * Get medium details
     *
     * @param IMedium m medium instance
     * @return array medium details
     """
    def _mediumGetDetails(&m) {

        children = array()
        attachedTo = array()
        machines = m.machineIds
        hasSnapshots = 0

        foreach(m.children as c) { """ @c IMedium """
            children.append(self._mediumGetDetails(c)
            c.releaseRemote()
        }

        foreach(machines as mid) {
            sids = m.getSnapshotIds(mid)
            try:
                """ @mid IMachine """
                mid = self.vbox.findMachine(mid)
            except Exception as e:
                attachedTo.append(array('machine' : mid .' ('.e.getMessage().')', 'snapshots' : array())
                continue
            }

            c = len(sids)
            hasSnapshots = max(hasSnapshots,c)
            for(i = 0 i < c i++) {
                if sids[i] == mid.id) {
                    unset(sids[i])
                } else {
                    try:
                        """ @sn ISnapshot """
                        sn = mid.findSnapshot(sids[i])
                        sids[i] = sn.name
                        sn.releaseRemote()
                    } catch(Exception e) { }
                }
            }
            hasSnapshots = (len(sids) ? 1 : 0)
            attachedTo.append(array('machine':mid.name,'snapshots':sids)
            mid.releaseRemote()
        }

        # For fixed value
        mv = new MediumVariant()
        variant = m.variant

        return array(
                'id' : m.id,
                'description' : m.description,
                'state' : str(m.refreshState(),
                'location' : m.location,
                'name' : m.name,
                'deviceType' : str(m.deviceType,
                'hostDrive' : m.hostDrive,
                'size' : str(m.size, """ str( to support large disks. Bypass integer limit """
                'format' : m.format,
                'type' : str(m.type,
                'parent' : ((str(m.deviceType == 'HardDisk' and m.parent.handle) ? m.parent.id : None),
                'children' : children,
                'base' : ((str(m.deviceType == 'HardDisk' and m.base.handle) ? m.base.id : None),
                'readOnly' : m.readOnly,
                'logicalSize' : (m.logicalSize/1024)/1024,
                'autoReset' : m.autoReset,
                'hasSnapshots' : hasSnapshots,
                'lastAccessError' : m.lastAccessError,
                'variant' : variant,
                'fixed' : int((int(variant) & mv.ValueMap['Fixed']) > 0),
                'split' : int((int(variant) & mv.ValueMap['VmdkSplit2G']) > 0),
                'machineIds' : array(),
                'attachedTo' : attachedTo
            )

    }

    """
     * Store a progress operation so that its status can be polled via progressGet()
     *
     * @param IProgress progress progress operation instance
     * @return string progress operation handle / id
     """
    def _util_progressStore(&progress) {

        """ Store vbox handle """
        self.persistentRequest['vboxHandle'] = self.vbox.handle
        
        """ Store server if multiple servers are configured """
        if @is_array(self.settings.servers) and len(self.settings.servers) > 1)
            self.persistentRequest['vboxServer'] = self.settings.name
        
        return progress.handle
    }

    """
     * Get VirtualBox system properties
     * @param array args array of arguments. See def body for details.
     * @return array of system properties
     """
    def remote_vboxSystemPropertiesGet(args,response) {

        # Connect to vboxwebsrv
        self.connect()

        mediumFormats = array()
        
        # Shorthand
        sp = self.vbox.systemProperties

        # capabilities
        mfCap = new MediumFormatCapabilities(None,'')
        foreach(sp.mediumFormats as mf) { """ @mf IMediumFormat """
            exts = mf.describeFileExtensions()
            dtypes = array()
            foreach(exts[1] as t) dtypes.append(str(t
            caps = array()
            foreach(mfCap.NameMap as k:v) {
                if k & mf.capabilities)     caps.append(v
            }
            mediumFormats.append(array('id':mf.id,'name':mf.name,'extensions':array_map('strtolower',exts[0]),'deviceTypes':dtypes,'capabilities':caps)
        }

        return array(
            'minGuestRAM' : str(sp.minGuestRAM,
            'maxGuestRAM' : str(sp.maxGuestRAM,
            'minGuestVRAM' : str(sp.minGuestVRAM,
            'maxGuestVRAM' : str(sp.maxGuestVRAM,
            'minGuestCPUCount' : str(sp.minGuestCPUCount,
            'maxGuestCPUCount' : str(sp.maxGuestCPUCount,
            'autostartDatabasePath' : (@self.settings.vboxAutostartConfig ? sp.autostartDatabasePath : ''),
            'infoVDSize' : str(sp.infoVDSize,
            'networkAdapterCount' : 8, # static value for now
            'maxBootPosition' : str(sp.maxBootPosition,
            'defaultMachineFolder' : str(sp.defaultMachineFolder,
            'defaultHardDiskFormat' : str(sp.defaultHardDiskFormat,
            'homeFolder' : self.vbox.homeFolder,
            'VRDEAuthLibrary' : str(sp.VRDEAuthLibrary,
            'defaultAudioDriver' : str(sp.defaultAudioDriver,
            'defaultVRDEExtPack' : sp.defaultVRDEExtPack,
            'serialPortCount' : sp.serialPortCount,
            'parallelPortCount' : sp.parallelPortCount,
            'mediumFormats' : mediumFormats
        )
    }

    """
     * Get a list of VM log file names
     *
     * @param array args array of arguments. See def body for details.
     * @return array of log file names
     """
    def remote_machineGetLogFilesList(args) {

        # Connect to vboxwebsrv
        self.connect()

        """ @m IMachine """
        m = self.vbox.findMachine(args['vm'])

        logs = array()

        try: i = 0 while(l = m.queryLogFilename(i++)) logs.append(l
        except: pass

        lf = m.logFolder
        m.releaseRemote()
        
        return array('path' : lf, 'logs' : logs)

    }

    """
     * Get VM log file contents
     *
     * @param array args array of arguments. See def body for details.
     * @return string log file contents
     """
    def remote_machineGetLogFile(args) {

        # Connect to vboxwebsrv
        self.connect()

        """ @m IMachine """
        m = self.vbox.findMachine(args['vm'])
        log = ''
        try:
            # Read in 8k chunks
            while(l = m.readLog(int(args['log']),strlen(log),8192)) {
                if !len(l) or !strlen(l[0])) break
                log .= base64_decode(l[0])
            }
        except: pass
        m.releaseRemote()

        # Attempt to UTF-8 encode string or json_encode may choke
        # and return an empty string
        if function_exists('utf8_encode'))
            return utf8_encode(log)
        
        return log
    }

    """
     * Get a list of USB devices attached to a given VM
     *
     * @param array args array of arguments. See def body for details.
     * @return array list of devices
     """
    def remote_consoleGetUSBDevices(args) {

        # Connect to vboxwebsrv
        self.connect()

        """ @machine IMachine """
        machine = self.vbox.findMachine(args['vm'])
        self.session = self.websessionManager.getSessionObject(self.vbox.handle)
        machine.lockMachine(self.session.handle, 'Shared')

        response = array()
        foreach(self.session.console.USBDevices as u) { """ @u IUSBDevice """
            response[u.id] = array('id':u.id,'remote':u.remote)
            u.releaseRemote()
        }
        
        self.session.unlockMachine()
        self.session = None
        machine.releaseRemote()

        return response

    }

    """
     * Return a string representing the VirtualBox ExtraData key
     * for this port + device + bus type IgnoreFlush setting
     * 
     * @param integer port medium attachment port number
     * @param integer device medium attachment device number
     * @param string cType controller type
     * @return string extra data setting string
     """
    def _util_getIgnoreFlushKey(port,device,cType) {

        cTypes = array(
            'piix3' : 'piix3ide',
            'piix4' : 'piix3ide',
            'ich6' : 'piix3ide',
            'intelahci' : 'ahci',
            'lsilogic' : 'lsilogicscsi',
            'buslogic' : 'buslogic',
            'lsilogicsas' : 'lsilogicsas'
        )

        if !isset(cTypes[strtolower(cType)])) {
            self.errors.append(new Exception('Invalid controller type: ' . cType)
            return ''
        }

        lun = ((int(device)*2) + int(port))

        return str_replace('[b]',lun,str_replace('[a]',cTypes[strtolower(cType)],"VBoxInternal/Devices/[a]/0/LUN#[b]/Config/IgnoreFlush"))

    }

    """
     * Get a newly generated MAC address from VirtualBox
     *
     * @param array args array of arguments. See def body for details
     * @return string mac address
     """
    def remote_vboxGenerateMacAddress(args) {

        # Connect to vboxwebsrv
        self.connect()

        return self.vbox.host.generateMACAddress()
        
    }

    """
     * Set group definition
     * 
     * @param array args array of arguments. See def body for details
     * @return boolean True on success
     """
    def remote_vboxGroupDefinitionsSet(args) {
    
        self.connect()
        
        # Save a list of valid paths
        validGroupPaths = array()
        
        groupKey = (self.settings.phpVboxGroups ? self.phpVboxGroupKey : 'GUI/GroupDefinitions')
        
        # Write out each group definition
        foreach(args['groupDefinitions'] as groupDef) {
            
            self.vbox.setExtraData(groupKey.groupDef['path'], groupDef['order'])
            validGroupPaths.append(groupDef['path']
            
        }
        
        # Remove any unused group definitions
        keys = self.vbox.getExtraDataKeys()
        foreach(keys as k) {
            if strpos(k,groupKey) !== 0) continue
            if array_search(substr(k,strlen(groupKey)), validGroupPaths) == False)
                self.vbox.setExtraData(k,'')
        }
        
        return True
    }
    
    """
     * Return group definitions
     * 
     * @param array args array of arguments. See def body for details
     * @return array group definitions
     """
    def remote_vboxGroupDefinitionsGet(args) {

        self.connect()
        
        response = array()
        
        keys = self.vbox.getExtraDataKeys()
        
        groupKey = (self.settings.phpVboxGroups ? self.phpVboxGroupKey : 'GUI/GroupDefinitions')
        foreach(keys as grouppath) {
            
            if strpos(grouppath,groupKey) !== 0) continue
            
            subgroups = array()
            machines = array()
            
            response.append(array(
                'name' : substr(grouppath,strrpos(grouppath,'/')+1),
                'path' : substr(grouppath,strlen(groupKey)),
                'order' : self.vbox.getExtraData(grouppath)
            )
        }

        return response
        
    }
    
    """
     * Format a time span in seconds into days / hours / minutes / seconds
     * @param integer t number of seconds
     * @return array containing number of days / hours / minutes / seconds
     """
    def _util_splitTime(t) {

        spans = array(
            'days' : 86400,
            'hours' : 3600,
            'minutes' : 60,
            'seconds' : 1)

        time = array()

        foreach(spans as k : v) {
            if !(floor(t / v) > 0)) continue
            time[k] = floor(t / v)
            t -= floor(time[k] * v)
        }

        return time
    }
    

    """
     * Return VBOX result code text for result code
     * 
     * @param integer result code number
     * @return string result code text
     """
    def _util_resultCodeText(c) {
        
        rcodes = new ReflectionClass('VirtualBox_COM_result_codes')
        rcodes = array_flip(rcodes.getConstants())
        rcodes['0x80004005'] = 'NS_ERROR_FAILURE'
        
        return @rcodes['0x'.strtoupper(dechex(c))] . ' (0x'.strtoupper(dechex(c)).')'
    }
}


class vboxEventListener(threading.Thread):
    
    eventSource = None
    eventListQueue = None
    
    registered = False
    listener = None
    listenerId = None
    
    running = True
    
    def __init__(self, listenerId, eventSource, eventListQueue):
        
        threading.Thread.__init__(self)

        self.listenerId = listenerId
        self.eventSource = eventSource
        self.eventListQueue = eventListQueue
        
        
        self.listener = eventSource.createListener()
        self.eventSource.registerListener(self.listener, [vboxMgr.constants.VBoxEventType_Any], False)
        self.registered = True
    
    def join(self, timeout=None):
        print "vboxEventListener shutting down (%s)" %(threading.current_thread(),)
        self.running = False
        super(vboxEventListener, self).join(timeout)
    
    def getEventData(self, event):
        
        data = {'eventType':enumToString(vboxMgr.constants, 'VBoxEventType', event.type),'sourceId':self.listenerId} 
        
        # Convert to parent class
        eventDataObject = vboxMgr.queryInterface(event, 'I' + data['eventType'][2:] + 'Event')        
        
        # Dedup ID is at least listener key ('vbox' or machine id) and event type
        data['dedupId'] = self.listenerId + '-' + data['eventType']
        
        
        if data['eventType'] == 'OnMachineStateChanged':
                        
            data['machineId'] = eventDataObject.machineId
            data['state'] = enumToString(vboxMgr.constants, "MachineState", eventDataObject.state)
            data['dedupId'] = data['dedupId'] + '-' + data['machineId']
            
        elif data['eventType'] == 'OnMachineDataChanged':
            
            data['machineId'] = eventDataObject.machineId
            data['dedupId'] = data['dedupId'] + '-' + data['machineId']

        elif data['eventType'] == 'OnExtraDataCanChange' or data['eventType'] == 'OnExtraDataChanged':
            
            data['machineId'] = eventDataObject.machineId
            data['key'] = eventDataObject.key
            data['value'] = eventDataObject.value
            data['dedupId'] = data['dedupId'] +  '-' + data['machineId'] + '-' + data['key']
                
        elif data['eventType'] == 'OnMediumRegistered':
            data['machineId'] = data['sourceId']
            data['mediumId'] = eventDataObject.mediumId
            data['registered'] = eventDataObject.registered
            data['dedupId'] = data['dedupId'] +  '-' + data['mediumId']
                
        elif data['eventType'] == 'OnMachineRegistered':
            data['machineId'] = eventDataObject.machineId
            data['registered'] = eventDataObject.registered
            data['dedupId'] = data['dedupId'] +  '-' + data['machineId']
                
        elif data['eventType'] == 'OnSessionStateChanged':
            data['machineId'] = eventDataObject.machineId
            data['state'] = enumToString(vboxMgr.constants, "SessionState", eventDataObject.state)
            data['dedupId'] = data['dedupId'] +  '-' + data['machineId']
                
        elif data['eventType'] == 'OnSnapshotTaken' or data['eventType'] == 'OnSnapshotDeleted' or data['eventType'] == 'OnSnapshotChanged':
            
            data['machineId'] = eventDataObject.machineId
            
            # This fails sometimes for seemingly no reason at all
            try:
                data['snapshotId'] = eventDataObject.snapshotId
            except:
                data['snapshotId'] = ''
                
            data['dedupId'] = data['dedupId'] +  '-' + data['machineId'] + '-' + data['snapshotId']
                
        elif data['eventType'] == 'OnGuestPropertyChanged':

            data['machineId'] = eventDataObject.machineId
            data['name'] = eventDataObject.name
            data['value'] = eventDataObject.value
            data['flags'] = eventDataObject.flags
            data['dedupId'] = data['dedupId'] +  '-' + data['machineId'] + '-' + data['name']

               
        elif data['eventType'] == 'OnAdditionsStateChanged':
            data['machineId'] = eventDataObject.machineId
            data['dedupId'] = data['dedupId'] +  '-' + data['machineId']
            
        elif data['eventType'] == 'OnCPUChanged':
            data['machineId'] = data['sourceId']
            data['cpu'] = eventDataObject.cpu
            data['add'] = eventDataObject.add
            data['dedupId'] = data['dedupId'] +  '-' + str(data['cpu'])
                
        # Same end-result as network adapter changed
        elif data['eventType'] == 'OnNATRedirect':
            data['machineId'] = data['sourceId']
            data['eventType'] = 'OnNetworkAdapterChanged'
            data['networkAdapterSlot'] = eventDataObject.slot
            data['dedupId'] = self.listenerId + '-OnNetworkAdapterChanged-' + str(data['networkAdapterSlot'])
                
        elif data['eventType'] == 'OnNetworkAdapterChanged':
            data['machineId'] = data['sourceId']
            data['networkAdapterSlot'] = eventDataObject.networkAdapter.slot
            data['dedupId'] = data['dedupId'] +  '-' + str(data['networkAdapterSlot'])
                
        elif data['eventType'] == 'OnStorageControllerChanged':
            data['machineId'] = eventDataObject.machineId
            data['dedupId'] = data['dedupId'] +  '-' + data['machineId']
                
        elif data['eventType'] == 'OnMediumChanged':
            data['machineId'] = data['sourceId']
            data['controller'] = eventDataObject.mediumAttachment.controller
            data['port'] = eventDataObject.mediumAttachment.port
            data['device'] = eventDataObject.mediumAttachment.device
            try:
                data['medium'] = eventDataObject.mediumAttachment.medium.id
            except:
                data['medium'] = ''
            data['dedupId'] = data['dedupId'] +  '-' + str(data['controller']) + '-' + str(data['port']) + '-' + str(data['device'])
            
        # Generic machine changes that should query IMachine
        elif data['eventType'] in ['OnVRDEServerChanged','OnUSBControllerChanged','OnVRDEServerInfoChanged']:
            data['machineId'] = data['sourceId']
         
        elif data['eventType'] == 'OnSharedFolderChanged':
            data['machineId'] = data['sourceId']
            data['scope'] = enumToString(vboxMgr.constants, "Scope", eventDataObject.scope)

        elif data['eventType'] == 'OnCPUExecutionCapChanged':
            data['machineId'] = data['sourceId']
            data['executionCap'] = eventDataObject.executionCap
        

        # Notification when a USB device is attached to or detached from the virtual USB controller
        elif data['eventType'] == 'OnUSBDeviceStateChanged':
            data['machineId'] = data['sourceId']
            data['deviceId'] = eventDataObject.device.id
            data['attached'] = eventDataObject.attached
            data['dedupId'] = data['dedupId'] +  '-' + data['deviceId']
            
        # Machine execution error
        elif data['eventType'] == 'OnRuntimeError':
            data['machineId'] = eventDataObject.machineId
            data['message'] = eventDataObject.message
            
        # Notification when a storage device is attached or removed
        elif data['eventType'] == 'OnStorageDeviceChanged':
            data['machineId'] = eventDataObject.machineId
            data['storageDevice'] = eventDataObject.storageDevice
            data['removed'] = eventDataObject.removed
            data['dedupId'] = data['dedupId'] + str(eventDataObject.storageDevice)
                        
        
        return data

    
    def run(self):

        print "vboxEventListener Run (%s)" %(threading.current_thread(),)
        vboxMgr.initPerThread()
        
        try:

            while self.running:
                event = self.eventSource.getEvent(self.listener, 500)
                if event is not None:
                    try:
                        self.eventListQueue.put(self.getEventData(event))
                    except:
                        print "Error processing event"
                        traceback.print_exc()
                        
                    self.eventSource.eventProcessed(self.listener, event)
                
        except:
            print "Event source went away"
            traceback.print_exc()
            
    
        print "vboxEventListener unregistering (%s)" %(threading.current_thread(),)
        if self.listener and self.registered:
            try:
                self.eventSource.unregisterListener(self.listener)
            except:
                print "Listener already unregistered"
          
        if vboxMgr:      
            vboxMgr.deinitPerThread()     
            

class vboxEventListenerPool(threading.Thread):
    
    running = True
    eventListQueue = None
    
    listeners = {}
    listenerLock = threading.Lock()
    
    def __init__(self, eventListQueue):
        self.eventListQueue = eventListQueue
        threading.Thread.__init__(self)
    
    def isVboxAlive(self):
        return True if self.listeners.get('vbox',None) is not None else False
    
    def reInit(self):
        vboxMgr.initPerThread()
        
    def add(self, id, eventSource):
        
        self.listenerLock.acquire(True)
        
        if not self.running:
            self.listenerLock.release()
            return

        try:
            # Check for existing listener
            if not (self.listeners.get(id, None) and self.listeners[id].isAlive()):
                l = vboxEventListener(id, eventSource, self.eventListQueue)
                l.start()
                self.listeners[id] = l
            else:
                print "Not adding existing listener with id %s" %(id,)
        except:
            traceback.print_exc()
        
        self.listenerLock.release()
        
    def join(self, timeout=None):
        
        print "vboxEventListenerPool shutting down (%s)" %(threading.current_thread(),)
        
        self.listenerLock.acquire(True)
        try:
            for id, l in self.listeners.iteritems():
                l.join(timeout)
        except:
            traceback.print_exc()
            
        self.running = False
        self.listenerLock.release()
        
        super(vboxEventListenerPool, self).join(timeout)
        
    def run(self):
        
        print "vboxEventListenerPool Run (%s)" %(threading.current_thread(),)
        
        vboxMgr.initPerThread()
        
        while self.running:
            
            # Clean up threads
            self.listenerLock.acquire(True)
            try:
                if not self.running:
                    self.listenerLock.release()
                    continue

                listeners = self.listeners.values()
                for l in listeners:
                    if not l.isAlive():
                        print "Thread stopped ..."
                        l.join()
                        del self.listeners[l.listenerId]
            except:
                traceback.print_exc()
            
            #print "Listener count is " + str(len(self.listeners))
            self.listenerLock.release()
            time.sleep(1)

        if vboxMgr:
            vboxMgr.deinitPerThread()


vboxMgr = None
vbox = None

incomingQueue = Queue.Queue()
outgoingQueue = Queue.Queue()
listenerPool = vboxEventListenerPool(incomingQueue)

def vboxinit():
    
    global vboxMgr, vbox, listenerPool, incomingQueue
    
    """
    try:
        del VirtualBoxManager
    except:
        pass
    """
    
    try:
        
        # Initial connection
        if vboxMgr is None:
            vboxMgr = VirtualBoxManager(None, None)
            vbox = vboxMgr.vbox
        """    
        # Attempt to get version
        try:
            vbox.version
            
        except:
            print "No connection to vbox. Attempting to reconnect."
            try:
                print "here..."
                #vboxMgr = VirtualBoxManager(None, None)
                vboxMgr.platform.deinit()
                vboxMgr.platform = None
                vboxMgr.platform = PlatformXPCOM(None)
                print "here...2"
                vbox = vboxMgr.getVirtualBox()
                print "here...3"
                vbox.version
                print "here...4"
            except:
                print "Unable to connect to vbox. Is the service running?"
                traceback.print_exc()
                return False
        """
        print "Running VirtualBox version %s" %(vbox.version)
        
        # Start a thread that obtains all VMs and listens for events
        vmlist = []
        subscribe = []
        
        # Enumerate all defined machines
        for mach in vbox.getMachines():
             
            try:
                
                vm = { 
                   'id':mach.id,
                   'name':mach.name,
                   'state':enumToString(vboxMgr.constants, "MachineState", mach.state),
                   'sessionState':enumToString(vboxMgr.constants, "SessionState", mach.sessionState),
                   'OSTypeId':mach.OSTypeId
                }
                
                if vm['state'] == 'Running':
                    subscribe.append(vm['id'])
                    
                vmlist.append(vm)
                
            except:
                traceback.print_exc()
        
        
        # Start listener pool
        if not listenerPool.isAlive():
            listenerPool.start()
        else:
            listenerPool.reInit()
        
        listenerPool.add('vbox', vbox.eventSource)
        
        # Add running machines
        for s in subscribe:
            try:
                machine = vbox.findMachine(s)
                session = vboxMgr.mgr.getSessionObject(vbox)
                machine.lockMachine(session, vboxMgr.constants.LockType_Shared)
                listenerPool.add(s, session.console.eventSource)
                session.unlockMachine()
            except:
                traceback.print_exc()
            
        return True
    
    except:
        traceback.print_exc()
        return False


def enrichEvents(eventList):
    
    lastMachineId = None
    machine = None
    session = None
    
    # Try to keep machines in order to limit locking / unlocking
    keys = eventList.keys()
    keys.sort()
    for ek in keys:
        
        event = eventList[ek]
        
        # Close existing session
        if session and lastMachineId and event.get('machineId','') != lastMachineId:
            
            session.unlockMachine()
            session = None
            
        elif event.get('machineId',None) and not session:
            
            machine = vbox.findMachine(event['machineId'])
            session = vboxMgr.mgr.getSessionObject(vbox)
            machine.lockMachine(session, vboxMgr.constants.LockType_Shared)
            
        # Network adapter changed            
        if event['eventType'] == 'OnNetworkAdapterChanged':

            try:
                eventList[ek]['enrichmentData'] = _machineGetNetworkAdapters(session.machine, event['networkAdapterSlot'])
            
            except:
                #eventList[ek]['enrichmentData'] = array(e.getMessage())
                traceback.print_exc()
           
                
        
        
        # OnVRDEServerChanged
        elif event['eventType'] == 'OnVRDEServerChanged':
            
            try:
                
                vrde = session.machine.VRDEServer
                
                try:
                    eventList[ek]['enrichmentData'] = {
                        'enabled' : int(vrde.enabled),
                        'ports' : vrde.getVRDEProperty('TCP/Ports'),
                        'netAddress' : vrde.getVRDEProperty('TCP/Address'),
                        'VNCPassword' : vrde.getVRDEProperty('VNCPassword'),
                        'authType' : enumToString(vboxMgr.constants, 'AuthType', vrde.authType),
                        'authTimeout' : vrde.authTimeout
                        } if vrde else None
                        
                except:
                    # Just unlock the machine
                    #eventList[ek]['enrichmentData'] = array(e.getMessage())
                    traceback.print_exc()
                    
            except:
                #eventList[ek]['enrichmentData'] = array(e.getMessage())
                traceback.print_exc()
            
            
        # VRDE server info changed. Just need port and enabled/disabled
        elif event['eventType'] == 'OnVRDEServerInfoChanged':
            
            try:
                    
                try:
                    eventList[ek]['enrichmentData'] = {
                        'port' : session.console.VRDEServerInfo.port,
                        'enabled' : int(session.machine.VRDEServer.enabled)
                    }
                except:
                    # Just unlock the machine
                    eventList[ek]['enrichmentData'] = {}
                                
            except:
                eventList[ek]['enrichmentData'] = array(e.getMessage())
            
        
        # Machine registered or base data changed
        elif event['eventType'] in ['OnMachineRegistered','OnMachineDataChanged']:
            
            if event.get('registered', None) != False:
            
                # Get same data that is in VM list data
                eventList[ek]['enrichmentData'] = _machineGetBaseInfo(machine)
            
    
        # Update lastStateChange on OnMachineStateChange events
        elif event['eventType'] == 'OnMachineStateChanged':
            try:
                eventList[ek]['enrichmentData'] = {
                    'lastStateChange' : str(machine.lastStateChange/1000),
                    'currentStateModified' : machine.currentStateModified
                }
                
            except:
                eventList[ek]['enrichmentData'] = {'lastStateChange' : 0}
            
            
        # enrich with snapshot name and new snapshot count
        elif event['eventType'].startswith('OnSnapshot'):
                    
            try:
                eventList[ek]['enrichmentData'] = {
                    'currentSnapshotName' : machine.currentSnapshot.name if machine.currentSnapshot else '',
                    'snapshotCount' : machine.snapshotCount,
                    'currentStateModified' : machine.currentStateModified
                }
    
            except:
                pass
       
    # Don't leave open sessions to machines         
    if session is not None:
        session.unlockMachine()
        
    return eventList


import zerorpc

class VBOXEventServer(threading.Thread):
    
    eventServer = None
    
    class StreamingRPC(object):
        @zerorpc.stream
        def streaming_range(self, fr, to, step):
            return xrange(fr, to, step)
            
    def run(self):
        self.eventServer = zerorpc.Server(StreamingRPC())
        self.eventServer.bind("tcp://0.0.0.0:4242")
        self.eventServer.run()
        
    def join(self, timeout=None):
        self.eventServer.join(timeout)
        threading.Thread.join(timeout)

def main(argv = sys.argv):
    
    # For proper UTF-8 encoding / decoding
    #reload(sys)
    #sys.setdefaultencoding('utf8')

    running = True
    
    def stop_sigint(signal, frame):
        global running
        running = False
    signal.signal(signal.SIGINT, stop_sigint)
    
    rpcServer = VBOXEventServer()
    rpcServer.run()
    
    while running:
        
        # Check for alive vbox
        if not listenerPool.isVboxAlive():
            vboxinit()
            
        eventList = {}
    
        while not incomingQueue.empty():
            
            # Check for dead listener pool
            if not listenerPool.isAlive():
                running = False
                continue
            
            event = incomingQueue.get(False)
            if event:
                
                print "got event"
                
                eventList[event['dedupId']] = event
                
                # Subscribe to any machines that are running
                if event['eventType'] == 'OnMachineStateChanged' and event['state'] == 'Running':
                    try:
                        machine = vbox.findMachine(event['machineId'])
                        session = vboxMgr.mgr.getSessionObject(vbox)
                        machine.lockMachine(session, vboxMgr.constants.LockType_Shared)
                        listenerPool.add(event['machineId'], session.console.eventSource)
                        session.unlockMachine()
                    except:
                        traceback.print_exc()
    
                incomingQueue.task_done()
        
        # Enrich events and put them into outgoing queue
        if len(eventList):
            eventList = enrichEvents(eventList)
            pprint.pprint(eventList)
        
            
        time.sleep(1)
        
    rpcServer.join()
    listenerPool.join()
    
    del vboxMgr

if __name__ == '__main__':
    main(sys.argv)

    
