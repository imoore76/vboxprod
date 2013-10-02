
import sys, os, time, traceback, threading, Queue, base64
import signal
import ConfigParser
import math
import inspect

import socket
import SocketServer
import json

import pprint

import logging, logging.config
logging.config.fileConfig("logging.conf")
logger = logging.getLogger('connector')
eventlogger = logging.getLogger('connector.events')


from vboxapi import VirtualBoxManager, PlatformXPCOM

sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))+'/lib')

"""
    Globals
"""

vboxMgr = VirtualBoxManager(None, None)
vbox = vboxMgr.vbox

vboxSubscribeEventList = [ vboxMgr.constants.VBoxEventType_OnMachineStateChanged,
    vboxMgr.constants.VBoxEventType_OnMachineDataChanged,
    vboxMgr.constants.VBoxEventType_OnExtraDataChanged,
    vboxMgr.constants.VBoxEventType_OnMediumRegistered,
    vboxMgr.constants.VBoxEventType_OnMachineRegistered,
    vboxMgr.constants.VBoxEventType_OnSessionStateChanged,
    vboxMgr.constants.VBoxEventType_OnSnapshotTaken,
    vboxMgr.constants.VBoxEventType_OnSnapshotDeleted,
    vboxMgr.constants.VBoxEventType_OnSnapshotChanged,
    vboxMgr.constants.VBoxEventType_OnAdditionsStateChanged,
    vboxMgr.constants.VBoxEventType_OnNetworkAdapterChanged,
    vboxMgr.constants.VBoxEventType_OnSerialPortChanged,
    vboxMgr.constants.VBoxEventType_OnParallelPortChanged,
    vboxMgr.constants.VBoxEventType_OnStorageControllerChanged,
    vboxMgr.constants.VBoxEventType_OnMediumChanged,
    vboxMgr.constants.VBoxEventType_OnVRDEServerChanged,
    vboxMgr.constants.VBoxEventType_OnUSBControllerChanged,
    vboxMgr.constants.VBoxEventType_OnUSBDeviceStateChanged,
    vboxMgr.constants.VBoxEventType_OnSharedFolderChanged,
    vboxMgr.constants.VBoxEventType_OnRuntimeError,
    vboxMgr.constants.VBoxEventType_OnCPUChanged,
    vboxMgr.constants.VBoxEventType_OnVRDEServerInfoChanged,
    vboxMgr.constants.VBoxEventType_OnEventSourceChanged,
    vboxMgr.constants.VBoxEventType_OnCPUExecutionCapChanged,
    vboxMgr.constants.VBoxEventType_OnNATRedirect,
    vboxMgr.constants.VBoxEventType_OnHostPCIDevicePlug,
    vboxMgr.constants.VBoxEventType_OnVBoxSVCAvailabilityChanged,
    vboxMgr.constants.VBoxEventType_OnBandwidthGroupChanged,
    vboxMgr.constants.VBoxEventType_OnStorageDeviceChanged
 ]

""" Helpers """

# Delete pseudo machine states
del vboxMgr.constants._Values['MachineState']['FirstOnline']
del vboxMgr.constants._Values['MachineState']['FirstTransient']
del vboxMgr.constants._Values['MachineState']['LastOnline']
del vboxMgr.constants._Values['MachineState']['LastTransient']

def vboxEnumToString(enum, elem):
    vals = vboxMgr.constants.all_values(enum)
    return dict(zip(vals.values(), vals.keys())).get(int(elem), "<unknown>")

def vboxStringToEnum(enum, elem):
    return getattr(vboxMgr.constants, enum + '_' + elem)

def vboxEnumList(enum):
    return vboxMgr.constants.all_values(enum)

# Safe vboxMgr array
def vboxGetArray(obj, elem):
    vals = vboxMgr.getArray(obj, elem)
    if vals is None: vals = []
    return vals


"""
Return base machine info
"""
def _machineGetBaseInfo(machine):
    
    if machine.accessible:
        
        return { 
            'id' : machine.id,
            'name' :machine.name,
            'state' : vboxEnumToString("MachineState", machine.state),
            'group_id' : machine.getExtraData(vboxConnector.groupKey),
            'OSTypeId' : machine.OSTypeId,
            'OSTypeDesc' : vboxMgr.vbox.getGuestOSType(machine.OSTypeId).description,
            'lastStateChange' : long(machine.lastStateChange)/1000,
            'sessionState' : vboxEnumToString("SessionState", machine.sessionState),
            'icon' : machine.getExtraData(vboxConnector.iconKey),
            'accessible' : True
        }
        
    else:
        """
        When the machine is inaccessible, only the following properties can be used on it:
            parent
            id
            settingsFilePath
            accessible
            accessError
        """
        # Try to get name anyways
        try:
            name = machine.name
        except:
            name = machine.id
            
        return {
            'id' : machine.id,
            'name' : name,
            'state' : 'Inaccessible',
            'group_id' : 0,
            'OSTypeId' : '',
            'OSTypeDesc' : '',
            'lastStateChange' : 0,
            'sessionState' : 'Unknown',
            'icon' : '',
            'accessible' : False,
            'accessError': {
                'resultCode' : machine.accessError.resultCode,
                'interfaceID' : machine.accessError.interfaceID,
                'component' : machine.accessError.component,
                'text' : vboxConnector._util_resultCodeText(machine.accessError.text) 
            }#machine.accessError
        }

"""
    Format vbox event
"""
def formatEvent(data, eventDataObject):
    
    if data['eventType'] == 'OnMachineStateChanged':
                    
        data['machineId'] = eventDataObject.machineId
        data['state'] = vboxEnumToString("MachineState", eventDataObject.state)
        data['dedupId'] = data['dedupId'] + '-' + data['machineId']
        
    elif data['eventType'] == 'OnMachineDataChanged':
        
        data['machineId'] = eventDataObject.machineId
        data['dedupId'] = data['dedupId'] + '-' + data['machineId']

    elif data['eventType'] == 'OnExtraDataChanged':
        
        data['machineId'] = eventDataObject.machineId
        data['key'] = eventDataObject.key
        data['value'] = eventDataObject.value
        data['dedupId'] = data['dedupId'] +  '-' + data['machineId'] + '-' + data['key']
        
        # Create synthetic group changed event if it was the group key
        if data['key'] == vboxConnector.groupKey:
            data['eventType'] = 'OnMachineGroupChanged'
            data['group'] = data['value']
        # Create synthetic icon changed event if it was the icon key
        elif data['key'] == vboxConnector.iconKey:
            data['eventType'] = 'OnMachineIconChanged'
            data['icon'] = data['value']
         
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
        data['state'] = vboxEnumToString("SessionState", eventDataObject.state)
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
        data['scope'] = vboxEnumToString("Scope", eventDataObject.scope)

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

"""
    Enrich vbox events with relevant data
"""
def enrichEvents(eventList):
    
    lastMachineId = None
    machine = None
    session = None
    
    # Try to keep machines in order to limit locking / unlocking
    keys = eventList.keys()
    keys.sort()
    
    # Wrap to always unlock any sessions that may be open
    try:
        for ek in keys:
            
            event = eventList[ek]
            
            # Network adapter changed            
            if event['eventType'] == 'OnNetworkAdapterChanged':
    
                # Unlock previous session?
                if session and lastMachineId != event['machineId']:
                    
                    session.unlockMachine()
                    session = None
                    
                # Get machine?
                if not machine or (machine and machine.id != event['machineId']):
                    machine = vbox.findMachine(event['machineId'])

                if not session:
                    session = vboxMgr.mgr.getSessionObject(vbox)
                    machine.lockMachine(session, vboxMgr.constants.LockType_Shared)

                    
                try:
                    eventList[ek]['enrichmentData'] = vboxConnector._machineGetNetworkAdapters(session.machine, event['networkAdapterSlot'])
                
                except Exception as e:
                    logger.exception(str(e))
               
                    
            
            
            # OnVRDEServerChanged
            elif event['eventType'] == 'OnVRDEServerChanged':
                
                # Unlock previous session?
                if session and lastMachineId != event['machineId']:
                    
                    session.unlockMachine()
                    session = None
                    
                # Get machine?
                if not machine or (machine and machine.id != event['machineId']):
                    machine = vbox.findMachine(event['machineId'])

                if not session:
                    session = vboxMgr.mgr.getSessionObject(vbox)
                    machine.lockMachine(session, vboxMgr.constants.LockType_Shared)

                
                try:
                    
                    vrde = session.machine.VRDEServer
                    
                    try:
                        eventList[ek]['enrichmentData'] = {
                            'enabled' : int(vrde.enabled),
                            'ports' : vrde.getVRDEProperty('TCP/Ports'),
                            'netAddress' : vrde.getVRDEProperty('TCP/Address'),
                            'VNCPassword' : vrde.getVRDEProperty('VNCPassword'),
                            'authType' : vboxEnumToString('AuthType', vrde.authType),
                            'authTimeout' : vrde.authTimeout
                            } if vrde else None
                            
                    except Exception as e:
                        logger.exception(str(e))
                        
                except Exception as e:
                    
                    logger.exception(str(e))
                
                
            # VRDE server info changed. Just need port and enabled/disabled
            elif event['eventType'] == 'OnVRDEServerInfoChanged':
                
                
                # Unlock previous session?
                if session and lastMachineId != event['machineId']:
                    
                    session.unlockMachine()
                    session = None
                    
                # Get machine?
                if not machine or (machine and machine.id != event['machineId']):
                    machine = vbox.findMachine(event['machineId'])

                if not session:
                    session = vboxMgr.mgr.getSessionObject(vbox)
                    machine.lockMachine(session, vboxMgr.constants.LockType_Shared)

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
                    eventList[ek]['enrichmentData'] = [e.getMessage()]
                
            
            # Machine registered or base data changed
            elif event['eventType'] in ['OnMachineRegistered','OnMachineDataChanged']:
                
                if event.get('registered', None) != False:
                
                    # Get same data that is in VM list data
                    if not machine or (machine and machine.id != event['machineId']):
                        machine = vbox.findMachine(event['machineId'])
                        
                    eventList[ek]['enrichmentData'] = _machineGetBaseInfo(machine)
                
        
            # Update lastStateChange on OnMachineStateChange events
            elif event['eventType'] == 'OnMachineStateChanged':
                
                if not machine or (machine and machine.id != event['machineId']):
                    machine = vbox.findMachine(event['machineId'])

                try:
                    eventList[ek]['enrichmentData'] = {
                        'lastStateChange' : str(machine.lastStateChange/1000),
                        'currentStateModified' : machine.currentStateModified
                    }
                    
                except:
                    eventList[ek]['enrichmentData'] = {'lastStateChange' : 0}
                
                
            # enrich with snapshot name and new snapshot count
            elif event['eventType'].startswith('OnSnapshot'):
                
                if not machine or (machine and machine.id != event['machineId']):
                    machine = vbox.findMachine(event['machineId'])

                try:
                    eventList[ek]['enrichmentData'] = {
                        'currentSnapshotName' : machine.currentSnapshot.name if machine.currentSnapshot else '',
                        'snapshotCount' : machine.snapshotCount,
                        'currentStateModified' : machine.currentStateModified
                    }
        
                except:
                    pass
                
            lastMachineId = event.get('machineId',None)
            
            # Remove "On"
            eventList[ek]['eventType'] = eventList[ek]['eventType'][2:]
     
    # Don't leave open sessions to machines         
    finally:      
        if session is not None:
            session.unlockMachine()
        
    return eventList



"""
    Access to virtualbox from RPC calls
"""
class vboxConnector(object):

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
        Group key in vm extra data
    """
    groupKey = 'vcube/group_id'
    
    """
        Custom icon key in vm extra data
    """
    iconKey = 'vcube/icon'
    
    """
        Init vbox per thread
    """
    def __init__(self):
        global vboxMgr
        localData = threading.local()
        if getattr(localData,'vboxInit',False) != True:
            vboxMgr.initPerThread()
            localData.vboxInit = True
        self.vbox = vboxMgr.vbox
        
    def unregisterClient(self, client):
        global vboxMgr
        localData = threading.local()
        if not getattr(localData,'vboxInit',False):
            try:
                vboxMgr.deinitPerThread()
            except Exception as e:
                logger.exception(e)
            finally:
                localData.vboxInit = False
        
    """
        Cleanup after request
    """
    def finishRequest(self):
        self.errors = self.messages = []
        
    """
     * Get VirtualBox version
     * @return dict version information
     """
    def getVersion(self):

        if not self.version:

            self.version = self.vbox.version.split('.')
            self.version = {
                'ose':self.version[2].find('ose') > -1,
                'string':'.'.join(self.version),
                'major':int(self.version[0]),
                'minor':int(self.version[1]),
                'sub':int(self.version[2]),
                'revision':self.vbox.revision
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
        return self.vbox.findMachine(args['vm']).enumerateGuestProperties(args.get('pattern',''))

    """
       Set machine group
    """
    def remote_machineSetGroup(self, args):
        args['key'] = self.groupKey
        args['value'] = str(args['group'])
        return self.remote_machineSetExtraData(args)
    
    """
        Set machine icon
    """
    def remote_machineSetIcon(self, args):
        args['key'] = self.iconKey
        args['value'] = str(args['icon'])
        return self.remote_machineSetExtraData(args)
    
    """
     * Set extra data of a vm
     *
     * @param array args array of arguments. See def body for details.
     * @return array of extra data
     """
    def remote_machineSetExtraData(self, args):
    
        """ @m IMachine """
        self.vbox.findMachine(args['vm']).setExtraData(args['key'],args['value'])
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

        file = args['file'].replace(dsep + dsep, dsep)

        return os.path.exists(file)
    
        
    """
     * Install guest additions
     *
     * @param array args array of arguments. See def body for details.
     * @return array result data
     """
    def remote_consoleGuestAdditionsInstall(self, args):

        
        session = None
        
        try:
            results = {'errored' : 0}
    
            """ @gem IMedium|None """
            gem = None
            for m in vboxGetArray(self.vbox,'DVDImages'):
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
                        gem = self.vbox.openMedium(iso,vboxMgr.constants.DeviceType_DVD, None, None)
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
            session = vboxMgr.mgr.getSessionObject(self.vbox)
            machine.lockMachine(session, vboxMgr.constants.LockType_Shared)
    
            # Try update from guest if it is supported
            if not args.get('mount_only', None):
                
                try:
    
                    """ @progress IProgress """
                    progress = session.console.guest.updateGuestAdditions(gem.location,[vboxMgr.constants.AdditionsUpdateFlag_WaitForUpdateStartOnly])
    
                    # No error info. Save progress.
                    global progressOpPool
                    progressid = progressOpPool.store(progress, session)
                    results['progress'] = progressid
                    return results
    
                except Exception as e:
                    
                    self.errors.append((str(e), traceback.format_exc()))
                    
                    if results.get('progress', None):
                        del results['progress']
    
                    # Try to mount medium
                    results['errored'] = 1
    
            # updateGuestAdditions is not supported. Just try to mount image.
            results['result'] = 'nocdrom'
            mounted = False
            
            for sc in vboxGetArray(machine,'storageControllers'):
    
                for ma in machine.getMediumAttachmentsOfController(sc.name):
    
                    if ma.type == vboxMgr.constants.DeviceType_DVD:
                        session.machine.mountMedium(sc.name, ma.port, ma.device, gem, True)
                        results['result'] = 'mounted'
                        mounted = True
                        break
    
                if mounted: break
            
    
        finally:   
            session.unlockMachine()

        return results

    """
     * Attach USB device identified by args['id'] to a running VM
     *
     * @param array args array of arguments. See def body for details.
     * @return boolean True on success
     """
    def remote_consoleUSBDeviceAttach(self, args):

        session = None
        
        # create session and lock machine
        try:
            """ @machine IMachine """
            machine = self.vbox.findMachine(args['vm'])
            session = vboxMgr.mgr.getSessionObject(self.vbox)
            machine.lockMachine(session, vboxMgr.constants.LockType_Shared)
    
            session.console.attachUSBDevice(args['id'])

        finally:
            
            if session:
                session.unlockMachine()
                session = None
        
        return True

    """
     * Get screenshot of running or saved vm, or snapshot
    """
    def remote_machineGetScreenShot(self, args):

        """
                // Let the browser cache images for 3 seconds
        $ctime = 0;
        if(strpos($_SERVER['HTTP_IF_NONE_MATCH'],'_')) {
            $ctime = preg_replace("/.*_/",str_replace('"','',$_SERVER['HTTP_IF_NONE_MATCH']));
        } else if(strpos($_ENV['HTTP_IF_NONE_MATCH'],'_')) {
            $ctime = preg_replace("/.*_/",str_replace('"','',$_ENV['HTTP_IF_NONE_MATCH']));
        } else if(strpos($_SERVER['HTTP_IF_MODIFIED_SINCE'],'GMT')) {
            $ctime = strtotime($_SERVER['HTTP_IF_MODIFIED_SINCE']);
        } else if(strpos($_ENV['HTTP_IF_MODIFIED_SINCE'],'GMT')) {
            $ctime = strtotime($_ENV['HTTP_IF_MODIFIED_SINCE']);
        }
        
        if($ctime >= (time()-3)) {
            if (strpos(strtolower(php_sapi_name()),'cgi') !== false) {
                Header("Status: 304 Not Modified");
            } else {
                Header("HTTP/1.0 304 Not Modified");
            }
              exit;
        }
        

        header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
        """
        machine = self.vbox.findMachine(args.get('vm'))
        
        if args.get('snapshot', None):
            
            machine = machine.findSnapshot(args.get('snapshot')).machine
            
        else:
    
            # Get machine state
            if not machine.state in [vboxMgr.constants.MachineState_Running, vboxMgr.constants.MachineState_Saved]:
                return False

        #  Date last modified
        dlm = math.floor(long(machine.lastStateChange)/1000)
        
        # Take active screenshot if machine is running
        if not args.get('snapshot', None) and machine.state == vboxMgr.constants.MachineState_Running:

            try:
                session = None
                session = vboxMgr.mgr.getSessionObject(self.vbox)
                machine.lockMachine(session, vboxMgr.constants.LockType_Shared)
                    
                screenWidth, screenHeight, bpp = session.console.display.getScreenResolution(0)
        
                # Force screenshot width while maintaining aspect ratio
                if args.get('width', None):
        
                    factor  = float(args['width']) / float(screenWidth)
        
                    screenWidth = args['width']
                    if factor > 0:
                        screenHeight = factor * screenHeight
                    else:
                        screenHeight = (screenWidth * 3.0/4.0)
        
                try:
                    
                    imageraw = session.console.display.takeScreenShotPNGToArray(0,screenWidth, screenHeight)
                    
                except:
                    
                    # For some reason this is required or you get "Could not take a screenshot (VERR_TRY_AGAIN)" in some cases.
                    # I think it's a bug in the Linux guest additions, but cannot prove it.
                    session.console.display.invalidateAndUpdate()
                    imageraw = session.console.display.takeScreenShotPNGToArray(0,screenWidth, screenHeight)
            finally:
                if session:
                    session.unlockMachine()

        # Snapshot or non-running vm
        else:
            if args.get('full', None):
                imageraw = machine.readSavedScreenshotPNGToArray(0)[0]
            else:
                imageraw = machine.readSavedThumbnailPNGToArray(0)[0]
                
        return base64.b64encode(imageraw)
            
            
            


    """
     * Detach USB device identified by args['id'] from a running VM
     * 
     * @param array args array of arguments. See def body for details.
     * @return boolean True on success
     """
    def remote_consoleUSBDeviceDetach(self, args):

        session = None
        
        # create session and lock machine
        try:
            """ @machine IMachine """
            machine = self.vbox.findMachine(args['vm'])
            session = vboxMgr.mgr.getSessionObject(self.vbox)
            machine.lockMachine(session, vboxMgr.constants.LockType_Shared)
    
            session.console.detachUSBDevice(args['id'])
            
        finally:
            if session:
                session.unlockMachine()
                session = None

        return True


    """
     * Clone a virtual machine
     * 
     * @param array args array of arguments. See def body for details.
     * @return array response data
     """
    def remote_machineClone(self, args):

        """ @src IMachine """
        src = self.vbox.findMachine(args['src'])

        if args.get('snapshot', None) and args['snapshot'].get('id', None):
            """ @nsrc ISnapshot """
            nsrc = src.findSnapshot(args['snapshot']['id'])
            src = None
            src = nsrc.machine

        """ @m IMachine """
        m = self.vbox.createMachine(None,args['name'],None,None,None)
        sfpath = m.settingsFilePath

        """ @cm CloneMode """
        #cm = new CloneMode(None,args['vmState'])
        #state = cm.ValueMap[args['vmState']]

        opts = []
        if not args.get('reinitNetwork', None): opts.append(vboxStringToEnum('CloneOptions','KeepAllMACs'))
        if args.get('link', None): opts.append(vboxStringToEnum('CloneOptions','Link'))

        """ @progress IProgress """
        progress = src.cloneTo(m,vboxStringToEnum("CloneMode",args.get('vmState','AllStates')),opts)

        global progressOpPool
        progressid = progressOpPool.store(progress)

        return {
                'progress' : progressid,
                'settingsFilePath' : sfpath}


    """
     * Turn VRDE on / off on a running VM
     *
     * @param array args array of arguments. See def body for details.
     * @return boolean True on success
     """
    def remote_consoleVRDEServerSave(self, args):

        session = None
        
        # create session and lock machine
        try:
            
            """ @m IMachine """
            m = self.vbox.findMachine(args['vm'])
            session = vboxMgr.mgr.getSessionObject(self.vbox)
            m.lockMachine(session, vboxMgr.constants.LockType_Shared)
            
            if int(args.get('enabled', 0)) == -1:
                args['enabled'] = not(session.machine.VRDEServer.enabled)
            
            session.machine.VRDEServer.enabled = bool(args['enabled'])

        finally:
            if session:
                session.unlockMachine()
                session = None

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
            m.autostartEnabled = args['autostartEnabled']
            m.autostartDelay = int(args['autostartDelay'])
        
        
        # Custom Icon
        m.setExtraData(vboxConnector.iconKey, args['icon'])
        
        m.setExtraData('GUI/SaveMountedAtRuntime', args['GUI'].get('SaveMountedAtRuntime','yes'))

        # VRDE settings
        try:
            if m.VRDEServer and self.vbox.systemProperties.defaultVRDEExtPack:
                
                m.VRDEServer.enabled = args['VRDEServer']['enabled']
                m.VRDEServer.setVRDEProperty('TCP/Ports',args['VRDEServer']['ports'])
                m.VRDEServer.setVRDEProperty('VNCPassword',args['VRDEServer'].get('VNCPassword', ''))
                m.VRDEServer.authType = args['VRDEServer'].get('authType', None)
                m.VRDEServer.authTimeout = int(args['VRDEServer']['authTimeout'])

        except:
            pass
        
        # Storage Controllers if machine is in a valid state
        if state != 'Saved':
            
            attachedEx = attachedNew = {}
            
            for sc in vboxGetArray(m,'storageControllers'):
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
                                med = self.vbox.openMedium(ma['medium']['location'], vboxStringToEnum("DeviceType", ma['type']), None, None)
                            
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
        psf_tmp = vboxGetArray(m,'sharedFolders')
        psf = {}
        for sf in psf_tmp:
            psf[sf.name] = sf

        # Get a list of temp shared folders
        tsf_tmp = vboxGetArray(self.session.console,'sharedFolders')
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

        usbEx = []
        usbNew = []

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
                    self.errors.append((e,traceback.format_exc()))

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
    def remote_machineSave(self, args):

        # create session and lock machine
        """ @machine IMachine """
        machine = self.vbox.findMachine(args['id'])
        
        vmState = machine.state
        vmRunning = machine.state in [vboxMgr.constants.MachineState_Running, vboxMgr.constants.MachineState_Paused, vboxMgr.constants.MachineState_Saved]
        self.session = vboxMgr.mgr.getSessionObject(self.vbox)
        machine.lockMachine(self.session, (vboxMgr.constants.LockType_Shared if vmRunning else vboxMgr.constants.LockType_Write))

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
        if args['chipsetType']: m.chipsetType = vboxStringToEnum('ChipsetType', args['chipsetType'])
        if m.snapshotFolder != args['snapshotFolder']: m.snapshotFolder = args['snapshotFolder']
        m.RTCUseUTC = (True if args['RTCUseUTC'] else False)
        m.setCPUProperty(vboxMgr.constants.CPUPropertyType_PAE, (True if args['CpuProperties']['PAE'] else False))
        # IOAPIC
        m.BIOSSettings.IOAPICEnabled = (True if args['BIOSSettings']['IOAPICEnabled'] else False)
        m.CPUExecutionCap = int(args['CPUExecutionCap'])
        m.description = args['description']
        
        m.autostopType = args['autostopType']
        m.autostartEnabled = int(args['autostartEnabled'])
        m.autostartDelay = int(args['autostartDelay'])

        
        # Determine if host is capable of hw accel
        hwAccelAvail = bool(self.vbox.host.getProcessorFeature(vboxMgr.constants.ProcessorFeature_HWVirtEx))

        m.setHWVirtExProperty(vboxMgr.constants.HWVirtExPropertyType_Enabled,(True if int(args['HWVirtExProperties']['Enabled']) and hwAccelAvail else False))
        m.setHWVirtExProperty(vboxMgr.constants.HWVirtExPropertyType_NestedPaging, (True if int(args['HWVirtExProperties']['Enabled']) and hwAccelAvail and int(args['HWVirtExProperties']['NestedPaging']) else False))
        
        """ @def VBOX_WITH_PAGE_SHARING
         * Enables the page sharing code.
        * @remarks This must match GMMR0Init currently we only support page fusion on
         *          all 64-bit hosts except Mac OS X """
        
        if int(self.vbox.host.getProcessorFeature(vboxMgr.constants.ProcessorFeature_LongMode)) and self.vbox.host.operatingSystem.lower().find("darwin") == -1:
            try:
                m.pageFusionEnabled = (True if int(args['pageFusionEnabled']) else False)
            except:
                pass

        m.HPETEnabled = int(args['HPETEnabled'])
        m.setExtraData("VBoxInternal/Devices/VMMDev/0/Config/GetHostTimeDisabled", args['disableHostTimeSync'])
        m.keyboardHIDType = vboxStringToEnum("KeyboardHIDType",args['keyboardHIDType'])
        m.pointingHIDType = vboxStringToEnum("PointingHIDType",args['pointingHIDType'])
        m.setHWVirtExProperty(vboxMgr.constants.HWVirtExPropertyType_LargePages, (True if int(args['HWVirtExProperties']['LargePages']) else False))
        m.setHWVirtExProperty(vboxMgr.constants.HWVirtExPropertyType_Exclusive, (True if int(args['HWVirtExProperties']['Exclusive']) else False))
        m.setHWVirtExProperty(vboxMgr.constants.HWVirtExPropertyType_VPID, (True if int(args['HWVirtExProperties']['VPID']) else False))

        """ Custom Icon """
        m.setExtraData(vboxConnector.iconKey, args['icon'])

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
            self.errors.append((e,traceback.format_exc()))
            
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
        attachedEx = attachedNew = {}
        for sc in vboxGetArray(m,'storageControllers'): # @sc IStorageController """

            cType = sc.controllerType

            for ma in m.getMediumAttachmentsOfController(sc.name):

                attachedEx[sc.name.ma.port.ma.device] = (ma.medium.id if ma.medium else None)

                # Remove IgnoreFlush key?
                if self.settings.enableHDFlushConfig and ma.type == vboxMgr.constants.DeviceType_HardDisk:
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
                        med = self.vbox.openMedium(ma['medium']['location'], vboxStringToEnum("DeviceType", ma['type']), None, None)
                    
                else:
                    med = None
                
                m.attachDevice(name,ma['port'],ma['device'],vboxStringToEnum("DeviceType", ma['type']), med)

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
                p.IOBase = int(args['serialPorts'][i]['IOBase'], 0)
                p.IRQ = int(args['serialPorts'][i]['IRQ'])
                if args['serialPorts'][i].get('path',None):
                    p.path = args['serialPorts'][i]['path']
                    p.hostMode = args['serialPorts'][i]['hostMode']
                else:
                    p.hostMode = args['serialPorts'][i]['hostMode']
                    p.path = args['serialPorts'][i]['path']

                p.server = int(args['serialPorts'][i]['server'])
                
            except Exception as e:
                self.errors.append((e,traceback.format_exc()))

        # LPT Ports
        lptChanged = False

        for i in range(0, len(args['parallelPorts'])):

            """ @p IParallelPort """
            p = m.getParallelPort(i)

            if not (p.enabled or int(args['parallelPorts'][i]['enabled'])): continue
            lptChanged = True
            try:
                p.IOBase = int(args['parallelPorts'][i]['IOBase'], 0)
                p.IRQ = int(args['parallelPorts'][i]['IRQ'])
                p.path = args['parallelPorts'][i]['path']
                p.enabled = int(args['parallelPorts'][i]['enabled'])
                
            except Exception as e:
                self.errors.append((e,traceback.format_exc()))


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
                    self.errors.append((e,traceback.format_exc()))
                        

        # USB Filters
        usbEx = {}
        usbNew = {}

        usbc = self._machineGetUSBController(self.session.machine)

        # controller properties
        if usbc['enabled'] != args['USBController']['enabled'] or usbc['enabledEHCI'] != args['USBController']['enabledEHCI']:
            m.USBController.enabled = args['USBController']['enabled']
            m.USBController.enabledEHCI = args['USBController']['enabledEHCI']

        # filters
        if args['USBController'].get('deviceFilters', None) is None: args['USBController']['deviceFilters'] = []
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

                            m.USBController.insertDeviceFilter(i,f)
                            offset = offset - 1

            except Exception as e:
                self.errors.append((e,traceback.format_exc()))


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
        self.vbox.registerMachine(m)
        return True

    """
     * Get progress operation status. On completion, destory progress operation.
     *
     * @param array args array of arguments. See def body for details.
     * @return array response data
     """
    def remote_progressGet(self, args):

        # progress operation result
        global progressOpPool
        
        return progressOpPool.getStatus(args['progress'])
    
    """
     * Cancel a running progress operation
     *
     * @param array args array of arguments. See def body for details.
     * @param array response response data passed byref populated by the function
     * @return boolean True on success
     """
    def remote_progressCancel(self, args):

        return progressOpPool.cancel(args['progress'])

    """
     * Returns a key : value mapping of an enumeration class contained
     * in vboxServiceWrappers.php (classes that extend VBox_Enum).
     *
     * @param array args array of arguments. See def body for details.
     * @return array response data
     * @see vboxServiceWrappers.php
     """
    def remote_vboxGetEnumerationMap(self, args):
        
        map = vboxEnumList(args['class'])
        if args.get('ValueMap', None):
            return dict(zip(map.values(), map.keys()))
        else:
            return map
        

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


        progress.waitForCompletion(-1)

        # Does an exception exist?
        if progress.completed and progress.resultCode:            
            raise Exception("%s (%s): %s" %(progress.errorInfo.component, progress.errorInfo.resultCode, progress.errorInfo.text))

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

        # Save progress
        global progressOpPool
        progressid = progressOpPool.store(progress)

        return {'progress' : progressid}


    """
     * Get a list of VMs that are available for export.
     *
     * @param array args array of arguments. See def body for details.
     * @return array list of exportable machiens
     """
    def remote_vboxGetExportableMachines(self, args):

        #Get a list of registered machines        
        mlist = []

        for machine in vboxGetArray(self.vbox, 'machines'): # @machine IMachine """

            try:
                mlist.append({
                    'name' : machine.name,
                    'state' : vboxEnumToString("MachineState", machine.state),
                    'OSTypeId' : machine.OSTypeId,
                    'id' : machine.id,
                    'description' : machine.description
                })

            except:
                pass
                # Ignore. Probably inaccessible machine.

        return mlist


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

        progress.waitForCompletion(-1)

        # Does an exception exist?
        if progress.completed and progress.resultCode:            
            raise Exception("%s (%s): %s" %(progress.errorInfo.component, progress.errorInfo.resultCode, progress.errorInfo.text))
        
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
            dir = os.path.dirname(path)
            file = os.path.basename(path)

            if dir[-1] != dsep: dir = dir + dsep

            """ @vfs IVFSExplorer """
            vfs = app.createVFSExplorer('file://' + dir)

            """ @progress IProgress """
            progress = vfs.remove([file])
            progress.waitForCompletion(-1)

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
            desc = m.export(app, args['file'])
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

            enabled = array_pad([],len(props[3]),True)
            for k in enabled.keys(): enabled[k] = enabled[k]
            desc.setFinalValues(enabled,props[3],props[4])


        """ @progress IProgress """
        progress = app.write(args.get('format','ovf-1.0'),(True if args['manifest'] else False),args['file'])
        
        # Save progress
        global progressOpPool
        progressid = progressOpPool.store(progress)

        return {'progress' : progressid}


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
        for d in vboxGetArray(self.vbox.host, 'networkInterfaces'):
            nics.append(d.name)

        
        """ Get internal Networks """
        networks = vboxGetArray(self.vbox,'internalNetworks')
        
        """ Generic Drivers """
        genericDrivers = vboxGetArray(self.vbox,'genericNetworkDrivers')
        
        return {
            'nics' : nics,
            'networks' : networks,
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
        for d in self.vbox.host.findHostNetworkInterfacesOfType(vboxMgr.constants.HostNetworkInterfaceType_HostOnly):

            # Get DHCP Info
            try:
                """ @dhcp IDHCPServer """
                dhcp = self.vbox.findDHCPServerByNetworkName(d.networkName)
                if dhcp:
                    dhcpserver = {
                        'enabled' : bool(dhcp.enabled),
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
                'IPV6Supported' : bool(d.IPV6Supported),
                'name' : d.name,
                'IPAddress' : d.IPAddress,
                'networkMask' : d.networkMask,
                'IPV6Address' : d.IPV6Address,
                'IPV6NetworkMaskPrefixLength' : d.IPV6NetworkMaskPrefixLength,
                'DHCPEnabled' : bool(d.DHCPEnabled),
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
        
        # Save progress
        global progressOpPool
        progressid = progressOpPool.store(progress)

        return {'progress' : progressid}


    """
     * Remove a host-only interface
     *
     * @param array args array of arguments. See def body for details.
     * @return array response data
     """
    def remote_hostOnlyInterfaceRemove(args):

        """ @progress IProgress """
        progress = self.vbox.host.removeHostOnlyNetworkInterface(args['id'])

        # Save progress
        global progressOpPool
        progressid = progressOpPool.store(progress)

        return {'progress' : progressid}


    """
     * Get a list of Guest OS Types supported by this VirtualBox installation
     *
     * @param unused args
     * @return array of os types
     """
    def remote_vboxGetGuestOSTypes(self, args):

        ostypes = []

        supp64 = (self.vbox.host.getProcessorFeature(vboxMgr.constants.ProcessorFeature_LongMode) and self.vbox.host.getProcessorFeature(vboxMgr.constants.ProcessorFeature_HWVirtEx))

        for g in vboxGetArray(self.vbox, 'guestOSTypes'):

            # Avoid multiple calls
            bit64 = g.is64Bit
            ostypes.append({
                'familyId' : g.familyId,
                'familyDescription' : g.familyDescription,
                'id' : g.id,
                'description' : g.description,
                'is64Bit' : bit64,
                'recommendedRAM' : g.recommendedRAM,
                'recommendedHDD' : (long(g.recommendedHDD)/1024)/1024,
                'supported' : bool((not bit64) or supp64)
            })

        return ostypes

    """
     * Set virtual machine state. Running, power off, save state, pause, etc..
     *
     * @param array args array of arguments. See def body for details.
     * @return array response data or boolean True on success
     """
    def remote_machineSetState(self, args):

        global progressOpPool
        
        vm = args['vm']
        state = args['state']

        states = {
            'powerDown' : {'result':vboxMgr.constants.MachineState_PoweredOff,'progress':2},
            'reset' : {},
            'saveState' : {'result':vboxMgr.constants.MachineState_Saved,'progress':2},
            'powerButton' : {'acpi':True},
            'sleepButton' : {'acpi':True},
            'pause' : {'result':vboxMgr.constants.MachineState_Paused,'progress':False},
            'resume' : {'result':vboxMgr.constants.MachineState_Running,'progress':False},
            'powerUp' : {'result':vboxMgr.constants.MachineState_Running},
            'discardSavedState' : {'result':vboxMgr.constants.MachineState_PoweredOff,'lock':vboxMgr.constants.LockType_Shared,'force':True}
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
        if state == 'powerUp' and mstate == vboxMgr.constants.MachineState_Paused:
            state = 'resume'
            
        if state == 'powerUp':
            
            
            # Try opening session for VM
            try:
            
                # create session
                session = vboxMgr.mgr.getSessionObject(self.vbox)

                # set first run
                if machine.getExtraData('GUI/FirstRun') == 'yes':
                    machine.setExtraData('GUI/FirstRun', 'no')
                
                """ @progress IProgress """
                progress = machine.launchVMProcess(session, 'headless', '')
            
            except Exception as e:
                # Error opening session
                self.errors.append((str(e),traceback.format_exc()))
                return False
            
            # Does an exception exist?
            try:
                if progress.errorInfo:
                    ##self.errors.append(new Exception(progress.errorInfo.text)
                    return False
                
            except:
                pass
            
            progressid = progressOpPool.store(progress, session)

            
            return {'progress' : progressid}
            

        # Open session to machine
        session = vboxMgr.mgr.getSessionObject(self.vbox)

        # Lock machine
        machine.lockMachine(session, states[state].get('lock',vboxMgr.constants.LockType_Shared))

        # If this operation returns a progress object save progress
        progress = None
        if states[state].get('progress', False):

            """ @progress IProgress """
            progress = self.session.console.state()

            if not progress:

                # should never get here
                try:
                    session.unlockMachine()
                    session = None
                except:
                    pass

                raise Exception('Unknown error settings machine to requested state.')
            

            # Does an exception exist?
            try:
                if progress.errorInfo:
                    #self.errors.append(new Exception(progress.errorInfo.text)
                    return False
                
            except: pass

            progressid = progressOpPool.store(progress, session)

            return {'progress' : progressid}

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
        for v,k in vboxEnumList("ProcessorFeature").iteritems():
            response['cpuFeatures'][v] = bool(host.getProcessorFeature(k))
        

        """
         * NICs
         """
        for d in vboxGetArray(host, 'networkInterfaces'):
            response['networkInterfaces'].append({
                'name' : d.name,
                'IPAddress' : d.IPAddress,
                'networkMask' : d.networkMask,
                'IPV6Supported' : d.IPV6Supported,
                'IPV6Address' : d.IPV6Address,
                'IPV6NetworkMaskPrefixLength' : d.IPV6NetworkMaskPrefixLength,
                'status' : vboxEnumToString("HostNetworkInterfaceStatus", d.status),
                'mediumType' : vboxEnumToString("HostNetworkInterfaceMediumType", d.mediumType),
                'interfaceType' : vboxEnumToString("HostNetworkInterfaceType", d.interfaceType),
                'hardwareAddress' : d.hardwareAddress,
                'networkName' : d.networkName
            })

        """
         * Medium types (DVD and Floppy)
         """
        for d in vboxGetArray(host, 'DVDDrives'):

            response['DVDDrives'].append({
                'id' : d.id,
                'name' : d.name,
                'location' : d.location,
                'description' : d.description,
                'deviceType' : 'DVD',
                'hostDrive' : True
            })

        for d in vboxGetArray(host, 'floppyDrives'):

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
    def remote_hostGetUSBDevices(self, args):

        response = []

        for d in vboxGetArray(self.vbox.host, 'USBDevices'):

            response.append({
                'id' : d.id,
                'vendorId' : '%04s' %(hex(d.vendorId),),
                'productId' : '%04s' %(hex(d.productId),),
                'revision' : '%04s' %(hex(d.revision),),
                'manufacturer' : d.manufacturer,
                'product' : d.product,
                'serialNumber' : d.serialNumber,
                'address' : d.address,
                'port' : d.port,
                'version' : d.version,
                'portVersion' : d.portVersion,
                'remote' : d.remote,
                'state' : vboxEnumToString("USBDeviceState", d.state),
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
        if args.get('vm','') == 'host':

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
            
            # just return blank data if machine is not accessible
            if not machine.accessible: return {}
            
            # For correct caching, always use id even if a name was passed
            args['vm'] = machine.id

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

            data['currentSnapshot'] = {'id':machine.currentSnapshot.id,'name':machine.currentSnapshot.name} if machine.currentSnapshot else None
            data['snapshotCount'] = machine.snapshotCount


        data['accessible'] = 1
        return data

    """
     * Get runtime data of machine.
     * 
     * @param array args array of arguments. See def body for details.
     * @return array of machine runtime data
     """
    def remote_machineGetRuntimeData(self, args):

        """ @machine IMachine """
        machine = self.vbox.findMachine(args['vm'])
        data = {
            'id' : args['vm'],
            'state' : vboxEnumToString("MachineState", machine.state)
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
        
            session = None
            
            try:
                session = vboxMgr.mgr.getSessionObject(self.vbox)
                machine.lockMachine(session, vboxMgr.constants.LockType_Shared)
            
                # Get guest additions version
                data['guestAdditionsVersion'] = session.console.guest.additionsVersion
                
                smachine = session.machine
                
                data['CPUExecutionCap'] = smachine.CPUExecutionCap
                data['VRDEServerInfo'] = {'port' : session.console.VRDEServerInfo.port}
                
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

            finally:
                # Close session and unlock machine
                if session:        
                    session.unlockMachine()
                    session = None
        
        
        return data
        
    """
     * Remove a virtual machine
     *
     * @param array args array of arguments. See def body for details.
     * @return boolean True on success or array of response data
     """
    def remote_machineRemove(self, args):

        """ @machine IMachine """
        machine = self.vbox.findMachine(args['vm'])

        # Only unregister or delete?
        if not args.get('delete', False):

            machine.unregister(vboxMgr.constants.CleanupMode_DetachAllReturnNone)

        else:

            hds = []
            delete = machine.unregister(vboxMgr.constants.CleanupMode_DetachAllReturnHardDisksOnly )
            for hd in delete:
                hds.append(self.vbox.openMedium(hd.location,vboxMgr.constants.DeviceType_HardDisk, None, None))

            """ @progress IProgress """
            progress = machine.delete(hds)

            global progressOpPool
            progressid = progressOpPool.store(progress)

            return {'progress' : progressid}

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
        filename = self.vbox.composeMachineFilename(args['name'],None,None,None)
        
        if self.remote_fileExists({'file':filename}):
            return {'exists' : filename}
        
        
        """ @m IMachine """
        m = self.vbox.createMachine(None,args['name'],'',args['ostype'],None,None)

        m.setExtraData(self.vcubeoxGroupKey, args.get('group_id',0))

        # Set memory
        m.memorySize = int(args['memory'])


        # Save and register
        m.saveSettings()
        self.vbox.registerMachine(m)
        vm = m.id

        session = None
        
        try:

            session = vboxMgr.mgr.getSessionObject(self.vbox)

            # Lock VM
            """ @machine IMachine """
            machine = self.vbox.findMachine(vm)
            machine.lockMachine(session, vboxMgr.constants.LockType_Write)

            # OS defaults
            defaults = self.vbox.getGuestOSType(args['ostype'])

            # Always set
            session.machine.setExtraData('GUI/SaveMountedAtRuntime', 'yes')
            session.machine.setExtraData('GUI/FirstRun', 'yes')

            try:
                session.machine.USBController.enabled = True
                
                # This causes problems if the extpack isn't installed
                # self.session.machine.USBController.enabledEHCI = True
                
            except:
                pass

            try:
                if session.machine.VRDEServer and self.vbox.systemProperties.defaultVRDEExtPack:
                    session.machine.VRDEServer.enabled = 1
                    session.machine.VRDEServer.authTimeout = 5000
                    session.machine.VRDEServer.setVRDEProperty('TCP/Ports', '3390-5000')
                
            except:
                pass
            
            # Other defaults
            session.machine.BIOSSettings.IOAPICEnabled = defaults.recommendedIOAPIC
            session.machine.RTCUseUTC = defaults.recommendedRTCUseUTC
            session.machine.firmwareType = defaults.recommendedFirmware
            session.machine.chipsetType = defaults.recommendedChipset
            if int(defaults.recommendedVRAM) > 0: session.machine.VRAMSize = int(defaults.recommendedVRAM)
            session.machine.setCPUProperty(vboxMgr.constants.CPUPropertyType_PAE,defaults.recommendedPAE)

            # USB input devices
            if defaults.recommendedUSBHid:
                session.machine.pointingHIDType = vboxStringToEnum("PointingHIDType",'USBMouse')
                session.machine.keyboardHIDType = vboxStringToEnum("KeyboardHIDType", 'USBKeyboard')

            """ Only if acceleration configuration is available """
            if self.vbox.host.getProcessorFeature(vboxMgr.constants.ProcessorFeature_HWVirtEx):
                session.machine.setHWVirtExProperty('Enabled',defaults.recommendedVirtEx)

            """
             * Hard Disk and DVD/CD Drive
             """
            DVDbusType = defaults.recommendedDVDStorageBus
            DVDconType = defaults.recommendedDVDStorageController

            # Attach harddisk?
            if args.get('disk',None):

                HDbusType = defaults.recommendedHDStorageBus
                HDconType = defaults.recommendedHDStorageController

                sc = session.machine.addStorageController(vboxEnumToString("StorageBus", HDbusType), HDbusType)
                sc.controllerType = HDconType
                sc.useHostIOCache = self.vbox.systemProperties.getDefaultIoCacheSettingForStorageController(HDconType)
                
                # Set port count?
                if HDbusType == 'SATA':
                    sc.portCount = (2 if (HDbusType == DVDbusType) else 1)
                
                m = self.vbox.openMedium(args['disk'],vboxMgr.constants.DeviceType_HardDisk, None, None)

                session.machine.attachDevice(vboxEnumToString("StorageBus", HDbusType),0,0,vboxMgr.constants.DeviceType_HardDisk,m)

            # Attach DVD/CDROM
            if DVDbusType:

                if not args.get('disk',None) or (HDbusType != DVDbusType):

                    sc = session.machine.addStorageController(vboxEnumToString("StorageBus", DVDbusType), DVDbusType)
                    sc.controllerType = DVDconType
                    sc.useHostIOCache = self.vbox.systemProperties.getDefaultIoCacheSettingForStorageController(DVDconType)
                    
                    # Set port count?
                    if DVDbusType == 'SATA':
                        sc.portCount = (1 if args.get('disk',None) else 2)

                session.machine.attachDevice(trans(DVDbusType,'UIMachineSettingsStorage'),1,0,'DVD',None)


        finally:
            if session:
                try:
                    session.machine.saveSettings()
                finally:
                    session.unlockMachine()
                    session = None

        return True


    """
     * Return a list of network adapters attached to machine m
     *
     * @param IMachine m virtual machine instance
     * @param int slot optional slot of single network adapter to get
     * @return array of network adapter information
     """
    @staticmethod
    def _machineGetNetworkAdapters(m, slot=False):

        adapters = []
        
        if slot is not None:
            adapterRange = [slot]
        else:
            adapterRange = range(0,7)
            
        for i in adapterRange:
    
            n = m.getNetworkAdapter(i)
    
            aType = vboxEnumToString('NetworkAttachmentType', n.attachmentType)
            
            if aType == 'NAT':
                nd = n.NATEngine
            else:
                 nd = None
    
            props = n.getProperties('')
            props = dict(zip(props[0],props[1]))
             
            adapters.append({
                'adapterType' : vboxEnumToString('NetworkAdapterType', n.adapterType),
                'slot' : n.slot,
                'enabled' : n.enabled,
                'MACAddress' : n.MACAddress,
                'attachmentType' : aType,
                'genericDriver' : n.genericDriver,
                'hostOnlyInterface' : n.hostOnlyInterface,
                'bridgedInterface' : n.bridgedInterface,
                'properties' : props,
                'internalNetwork' : n.internalNetwork,
                'NATNetwork' : n.NATNetwork,
                'promiscModePolicy' : vboxEnumToString('NetworkAdapterPromiscModePolicy', n.promiscModePolicy),     
                'cableConnected' : n.cableConnected,
                'NATEngine' : {
                   'aliasMode' : nd.aliasMode,
                   'DNSPassDomain' : nd.DNSPassDomain,
                   'DNSProxy' : nd.DNSProxy,
                   'DNSUseHostResolver' : nd.DNSUseHostResolver,
                   'hostIP' : nd.hostIP} if aType == 'NAT' else {},
                'lineSpeed' : n.lineSpeed,
                'redirects' : nd.getRedirects() if aType == 'Nat' else []
            })
            
        return adapters


    """
     * Return a list of virtual machines along with their states and other basic info
     *
     * @param array args array of arguments. See def body for details.
     * @return array list of machines
     """
    def remote_vboxGetMachines(self, args):

        vmlist = []
        
        # Look for a request for a single vm
        if args.get('vm',None):
            
            machines = [self.vbox.findMachine(args['vm'])]
            
        # Full list
        else:
            #Get a list of registered machines
            machines = vboxGetArray(self.vbox, 'machines')
            

        for machine in machines:


            try:
                
                vmlist.append(_machineGetBaseInfo(machine))
                
                
            except Exception as e:

                if machine:
                    """
                    vmlist.append({
                        'name' : machine.name,
                        'state' : 'Inaccessible',
                        'OSTypeId' : 'Other',
                        'id' : machine.id,
                        'sessionState' : 'Inaccessible',
                        'lastStateChange' : 0,
                        'currentSnapshot' : '',
                        'error': str(e) + ': ' + traceback.format_exc()
                    })
                    """
                else:
                    self.errors.append((e,traceback.format_exc()))

        return vmlist

    """
     * Get a list of media registered with VirtualBox
     *
     * @param unused args
     * @param array response response data passed byref populated by the function
     * @return array of media
     """
    def remote_vboxGetMedia(self, args):

        media = []
        mds = vboxGetArray(self.vbox,'hardDisks')+vboxGetArray(self.vbox,'DVDImages')+vboxGetArray(self.vbox,'floppyImages')
        for m in mds:
            """ @m IMedium """
            media.append(self._mediumGetDetails(m))
        return media

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
        for df in vboxGetArray(u,'deviceFilters'):

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
            'id' : m.id,
            'autostartEnabled' : m.autostartEnabled,
            'settingsFilePath' : m.settingsFilePath,
            'OSTypeId' : m.OSTypeId,
            'OSTypeDesc' : self.vbox.getGuestOSType(m.OSTypeId).description,
            'CPUCount' : m.CPUCount,
            'HPETEnabled' : m.HPETEnabled,
            'memorySize' : m.memorySize,
            'VRAMSize' : m.VRAMSize,
            'pointingHIDType' : vboxEnumToString("PointingHIDType", m.pointingHIDType),
            'keyboardHIDType' : vboxEnumToString("KeyboardHIDType", m.keyboardHIDType),
            'accelerate3DEnabled' : m.accelerate3DEnabled,
            'accelerate2DVideoEnabled' : m.accelerate2DVideoEnabled,
            'BIOSSettings' : {
                'ACPIEnabled' : m.BIOSSettings.ACPIEnabled,
                'IOAPICEnabled' : m.BIOSSettings.IOAPICEnabled,
                'timeOffset' : m.BIOSSettings.timeOffset
                },
            'firmwareType' : vboxEnumToString("FirmwareType", m.firmwareType),
            'snapshotFolder' : m.snapshotFolder,
            'monitorCount' : m.monitorCount,
            'pageFusionEnabled' : int(m.pageFusionEnabled),
            'VRDEServer' : (None if not m.VRDEServer else {
                'enabled' : int(m.VRDEServer.enabled),
                'ports' : m.VRDEServer.getVRDEProperty('TCP/Ports'),
                'netAddress' : m.VRDEServer.getVRDEProperty('TCP/Address'),
                'VNCPassword' : m.VRDEServer.getVRDEProperty('VNCPassword'),
                'authType' : vboxEnumToString("FirmwareType", m.VRDEServer.authType),
                'authTimeout' : m.VRDEServer.authTimeout,
                'allowMultiConnection' : m.VRDEServer.allowMultiConnection,
                'VRDEExtPack' : m.VRDEServer.VRDEExtPack
                }),
            'audioAdapter' : {
                'enabled' : m.audioAdapter.enabled,
                'audioController' : vboxEnumToString("AudioControllerType", m.audioAdapter.audioController),
                'audioDriver' : vboxEnumToString("AudioDriverType", m.audioAdapter.audioDriver),
                },
            'RTCUseUTC' : m.RTCUseUTC,
            'HWVirtExProperties' : {
                'Enabled' : m.getHWVirtExProperty(vboxMgr.constants.HWVirtExPropertyType_Enabled),
                'NestedPaging' : m.getHWVirtExProperty(vboxMgr.constants.HWVirtExPropertyType_NestedPaging),
                'LargePages' : m.getHWVirtExProperty(vboxMgr.constants.HWVirtExPropertyType_LargePages),
                'Exclusive' : m.getHWVirtExProperty(vboxMgr.constants.HWVirtExPropertyType_Exclusive),
                'VPID' : m.getHWVirtExProperty(vboxMgr.constants.HWVirtExPropertyType_VPID)
                },
            'CpuProperties' : {
                'PAE' : m.getCPUProperty(vboxMgr.constants.CPUPropertyType_PAE)
                },
            'bootOrder' : self._machineGetBootOrder(m),
            'chipsetType' : vboxEnumToString('ChipsetType', m.chipsetType),
            'GUI' : {
                'SaveMountedAtRuntime' : m.getExtraData('GUI/SaveMountedAtRuntime'),
                'FirstRun' : m.getExtraData('GUI/FirstRun')
            },
            'icon' : m.getExtraData(vboxConnector.iconKey),
            'disableHostTimeSync' : m.getExtraData("VBoxInternal/Devices/VMMDev/0/Config/GetHostTimeDisabled"),
            'CPUExecutionCap' : m.CPUExecutionCap
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
            b = vboxEnumToString("DeviceType", m.getBootOrder(i + 1))
            if b == 'Null': continue
            retval.append(b)
        return retval


    """
     * Get serial port configuration for a virtual machine or snapshot
     *
     * @param IMachine m virtual machine instance
     * @return array serial port info
     """
    def _machineGetSerialPorts(self, m):
        
        ports = []
        for i in range(0, self.vbox.systemProperties.serialPortCount):
            try:
                """ @p ISerialPort """
                p = m.getSerialPort(i)
                ports.append({
                    'slot' : p.slot,
                    'enabled' : p.enabled,
                    'IOBase' : str('0X%x'%(p.IOBase,)).upper(),
                    'IRQ' : p.IRQ,
                    'hostMode' : vboxEnumToString("PortMode", p.hostMode),
                    'server' : p.server,
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

        ports = []
        for i in range(0, self.vbox.systemProperties.parallelPortCount):
            try:
                """ @p IParallelPort """
                p = m.getParallelPort(i)
                ports.append({
                    'slot' : p.slot,
                    'enabled' : int(p.enabled),
                    'IOBase' : str('0X%x'%(p.IOBase,)).upper(),
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
    def _machineGetSharedFolders(self, m):
        
        folderlist = []
        for sf in vboxGetArray(m,'sharedFolders'):
            folderlist.append({
                'name' : sf.name,
                'hostPath' : sf.hostPath,
                'accessible' : sf.accessible,
                'writable' : sf.writable,
                'autoMount' : sf.autoMount,
                'lastAccessError' : sf.lastAccessError,
                'type' : 'machine'
            })
        
        return folderlist

    """
     * Get a list of transient (temporary) shared folders
     *
     * @param array args array of arguments. See def body for details.
     * @return array of shared folders
     """
    def remote_consoleGetSharedFolders(self, args):

        """ @machine IMachine """
        machine = self.vbox.findMachine(args['vm'])

        # No need to continue if machine is not running
        if machine.state != vboxMgr.constants.MachineState_Running:
            return []

        session = None

        try:        
            session = vboxMgr.mgr.getSessionObject(self.vbox)
            machine.lockMachine(session,vboxMgr.constants.LockType_Shared)
    
            sflist = []
            
            for sf in vboxGetArray(session.console,'sharedFolders'):
    
                sflist.append({
                    'name' : sf.name,
                    'hostPath' : sf.hostPath,
                    'accessible' : sf.accessible,
                    'writable' : sf.writable,
                    'autoMount' : sf.autoMount,
                    'lastAccessError' : sf.lastAccessError,
                    'type' : 'transient'
                })
        
        finally:
            if session:
                session.unlockMachine()
                session = None

        return sflist
    
    """
     * Get VirtualBox Host OS specific directory separator
     * 
     * @return string directory separator string
     """
    def getDsep(self):

        if not self.dsep:
            
            if self.vbox.host.operatingSystem.lower().find('windows') > -1:
                self.dsep = '\\'
            else:
                self.dsep = '/'
            
        
        return self.dsep

    """
     * Get medium attachment information for all medium attachments in mas
     *
     * @param IMediumAttachment[] mas list of IMediumAttachment instances
     * @return array medium attachment info
     """
    def _machineGetMediumAttachments(self, mas):

        attachments = []

        for ma in mas:
            attachments.append({
                'medium' : self._mediumGetDetails(ma.medium, True),
                'controller' : ma.controller,
                'port' : ma.port,
                'device' : ma.device,
                'type' : vboxEnumToString("DeviceType", ma.type),
                'passthrough' : int(ma.passthrough),
                'temporaryEject' : int(ma.temporaryEject),
                'nonRotational' : int(ma.nonRotational)
            })

        # sort by port then device
        #usort(return,create_function('a,b', 'if a["port"] == b["port"]) { if a["device"] < b["device"]) { return -1 } if a["device"] > b["device"]) { return 1 } return 0 } if a["port"] < b["port"]) { return -1 } return 1'))
        
        return attachments

    """
     * Save snapshot details ( description or name)
     *
     * @param array args array of arguments. See def body for details.
     * @return boolean True on success
     """
    def remote_snapshotSave(self, args):

        vm = self.vbox.findMachine(args['vm'])

        """ @snapshot ISnapshot """
        snapshot = vm.findSnapshot(args['snapshot'])
        snapshot.name = args['name']
        snapshot.description = args['description']

        return True

    """
     * Get snapshot details
     *
     * @param array args array of arguments. See def body for details.
     * @return array containing snapshot details
     """
    def remote_snapshotGetDetails(self, args):

        """ @vm IMachine """
        vm = self.vbox.findMachine(args['vm'])

        """ @snapshot ISnapshot """
        snapshot = vm.findSnapshot(args['snapshot'])

        response = self._snapshotGetDetails(snapshot,False)
        response['machine'] = self.remote_machineGetDetails({},snapshot.machine)

        return response


    """
     * Restore a snapshot
     *
     * @param array args array of arguments. See def body for details.
     * @return array response data containing progress operation id
     """
    def remote_snapshotRestore(self, args):

        progressid = progress = session = None

        try:

            # Open session to machine
            session = vboxMgr.mgr.getSessionObject(self.vbox)

            """ @machine IMachine """
            machine = self.vbox.findMachine(args['vm'])
            machine.lockMachine(session, vboxMgr.constants.LockType_Write)

            """ @snapshot ISnapshot """
            snapshot = session.machine.findSnapshot(args['snapshot'])

            """ @progress IProgress """
            progress = session.console.restoreSnapshot(snapshot)

            global progressOpPool
            progressid = progressOpPool.store(progress, session)


        except Exception as e:

            if session:
                try:
                    session.unlockMachine()
                    session = None
                except:
                    pass
            
            raise e
        
        return {'progress' : progressid}

    """
     * Delete a snapshot
     *
     * @param array args array of arguments. See def body for details.
     * @return array response data containing progress operation id
     """
    def remote_snapshotDelete(self, args):

        progressid, progress = session = None

        try:

            # Open session to machine
            session = vboxMgr.mgr.getSessionObject(self.vbox)

            """ @machine IMachine """
            machine = self.vbox.findMachine(args['vm'])
            machine.lockMachine(session, vboxMgr.constants.LockType_Shared)

            """ @progress IProgress """
            progress = session.console.deleteSnapshot(args['snapshot'])

            global progressOpPool
            progressid = progressOpPool.store(progress, session)


        except Exception as e:

            if session:
                try:
                    session.unlockMachine()
                    session = None
                except:
                    pass

            raise e

        return {'progress' : progressid}

    """
     * Take a snapshot
     *
     * @param array args array of arguments. See def body for details.
     * @return array response data containing progress operation id
     """
    def remote_snapshotTake(self, args):

        global progressOpPool
        
        """ @machine IMachine """
        machine = self.vbox.findMachine(args['vm'])

        progressid = progress = session = None
        

        try:

            # Open session to machine
            session = vboxMgr.mgr.getSessionObject(self.vbox)
            machine.lockMachine(session, (vboxMgr.constants.LockType_Write if machine.sessionState == vboxMgr.constants.SessionState_Unlocked else vboxMgr.constants.LockType_Shared))

            """ @progress IProgress """
            progress = session.console.takeSnapshot(args['name'],args.get('description',''))

            progressid = progressOpPool.store(progress, session)

        except Exception as e:
            
            if session:
                session.unlockMachine()
                session = None
                
            raise e
                
        return {'progress' : progressid}

    """
     * Get a list of snapshots for a machine
     *
     * @param array args array of arguments. See def body for details.
     * @return array list of snapshots
     """
    def remote_machineGetSnapshots(self, args):

        """ @machine IMachine """
        machine = self.vbox.findMachine(args['vm'])

        response = {'vm' : args['vm'], 
            'snapshot' : {},
            'currentSnapshotId' : None}
        
        """ No snapshots? Empty array """
        if machine.snapshotCount < 1:
            return response
        
    

        """ @s ISnapshot """
        s = machine.findSnapshot(None)
        response['snapshot'] = self._snapshotGetDetails(s,True)

        response['currentSnapshotId'] = (machine.currentSnapshot.id if machine.currentSnapshot else '')

        return response


    """
     * Return details about snapshot s
     *
     * @param ISnapshot s snapshot instance
     * @param boolean sninfo traverse child snapshots
     * @return array snapshot info
     """
    def _snapshotGetDetails(self, s,sninfo=False):

        children = []

        if sninfo:
            for c in vboxGetArray(s,'children'):
                children.append(self._snapshotGetDetails(c, True))

        timestamp = int(math.floor(s.timeStamp/1000))

        return {
            'id' : s.id,
            'name' : s.name,
            'description' : s.description,
            'timeStamp' : timestamp,
            'timeStampSplit' : self._util_splitTime(int(time.time()) - timestamp),
            'online' : s.online,
            'children' : children
        }


    """
     * Return details about storage controllers for machine m
     *
     * @param IMachine m virtual machine instance
     * @return array storage controllers' details
     """
    def _machineGetStorageControllers(self, m):

        sc = []

        for c in vboxGetArray(m,'storageControllers'):
            
            sc.append({
                'name' : c.name,
                'maxDevicesPerPortCount' : c.maxDevicesPerPortCount,
                'useHostIOCache' : c.useHostIOCache,
                'minPortCount' : c.minPortCount,
                'maxPortCount' : c.maxPortCount,
                'portCount' : c.portCount,
                'bus' : vboxEnumToString("StorageBus", c.bus),
                'controllerType' : vboxEnumToString("StorageControllerType", c.controllerType),
                'mediumAttachments' : self._machineGetMediumAttachments(m.getMediumAttachmentsOfController(c.name))
            })


        for i in range(0, len(sc)):

            for a in range(0, len(sc[i]['mediumAttachments'])):

                # Value of '' means it is not applicable
                sc[i]['mediumAttachments'][a]['ignoreFlush'] = ''

                # Only valid for HardDisks
                if sc[i]['mediumAttachments'][a]['type'] != 'HardDisk': continue

                # Get appropriate key
                xtra = self._util_getIgnoreFlushKey(sc[i]['mediumAttachments'][a]['port'], sc[i]['mediumAttachments'][a]['device'], sc[i]['controllerType'])

                # No such setting for this bus type
                if not xtra: continue

                sc[i]['mediumAttachments'][a]['ignoreFlush'] = m.getExtraData(xtra)

                if sc[i]['mediumAttachments'][a]['ignoreFlush'].strip() == '':
                    sc[i]['mediumAttachments'][a]['ignoreFlush'] = 1
                else:
                    sc[i]['mediumAttachments'][a]['ignoreFlush'] = int(sc[i]['mediumAttachments'][a]['ignoreFlush'])

        return sc


    """
     * Resize a medium. Currently unimplemented in GUI.
     * 
     * @param array args array of arguments. See def body for details.
     * @return array response data containing progress id
     """
    def remote_mediumResize(self, args):


        m = self.vbox.openMedium(args['medium'], vboxMgr.constants.DeviceType_HardDisk, None, None)

        """ @progress IProgress """
        progress = m.resize(args['bytes'])
        
        global progressOpPool
        progressid = progressOpPool.store(progress)

        
        return {'progress' : progressid}
        
    """
     * Clone a medium
     *
     * @param array args array of arguments. See def body for details.
     * @return array response data containing progress id
     """
    def remote_mediumCloneTo(self, args):

        format = args['format'].upper()
        
        """ @target IMedium """
        target = self.vbox.createHardDisk(format,args['location'])
        mid = target.id

        """ @src IMedium """
        src = self.vbox.openMedium(args['src'], vboxMgr.constants.DeviceType_HardDisk, None, None)

        type = 'fixed' if args['type'] == 'fixed' else 'Standard'
        #mv = new MediumVariant()
        #type = mv.ValueMap[type]
        if args['split']:
            type = type + mv.ValueMap['VmdkSplit2G']

        """ @progress IProgress """
        progress = src.cloneTo(target,type,None)

        global progressOpPool
        progressid = progressOpPool.store(progress)

        return {'progress' : progressid, 'id' : mid}


    """
     * Set medium to a specific type
     *
     * @param array args array of arguments. See def body for details.
     * @return boolean True on success
     """
    def remote_mediumSetType(self, args):

        # Connect to vboxwebsrv
        self.connect()

        """ @m IMedium """
        m = self.vbox.openMedium(args['medium'], vboxMgr.constants.DeviceType_HardDisk, None, None)
        m.type = args['type']

        return True

    """
     * Add iSCSI medium
     *
     * @param array args array of arguments. See def body for details.
     * @return response data
     """
    def remote_mediumAddISCSI(self, args):

        # {'server':server,'port':port,'intnet':intnet,'target':target,'lun':lun,'enclun':enclun,'targetUser':user,'targetPass':pass}

        # Fix LUN
        args['lun'] = int(args['lun'])
        if args['enclun']: 
            args['lun'] = 'enc' + args['lun']

        # Compose name
        name = args['server']+'|'+args['target']
        
        if args['lun'] != 0 and args['lun'] != 'enc0':
            name = name + '|' + args['lun']

        # Create disk
        """ @hd IMedium """
        hd = self.vbox.createHardDisk('iSCSI',name)

        if args['port']:
            args['server'] = args['server'] + ':' + int(args['port'])

        arrProps = {}

        arrProps["TargetAddress"] = args['server']
        arrProps["TargetName"] = args['target']
        arrProps["LUN"] = args['lun']
        if args.get('targetUser',None): arrProps["InitiatorUsername"] = args['targetUser']
        if args.get('targetPass',None): arrProps["InitiatorSecret"] = args['targetPass']
        if args.get('intnet',None): arrProps["HostIPStack"] = '0'

        hd.setProperties(arrProps.keys(),arrProps.values())

        hdid = hd.id
        
        return {'id' : hdid}


    """
     * Add existing medium by file location
     *
     * @param array args array of arguments. See def body for details.
     * @return resposne data containing new medium's id
     """
    def remote_mediumAdd(self, args):

        """ @m IMedium """
        m = self.vbox.openMedium(args['path'],args['type'],vboxMgr.constants.AccessMode_ReadWrite,None, None)

        mid = m.id
        
        return {'id':mid}


    """
     * Get VirtualBox generated machine configuration file name
     *
     * @param array args array of arguments. See def body for details.
     * @return string filename
     """
    def remote_vboxGetComposedMachineFilename(self, args):

        return self.vbox.composeMachineFilename(args['name'],None,None,None)

    """
     * Create base storage medium (virtual hard disk)
     *
     * @param array args array of arguments. See def body for details.
     * @return response data containing progress id
     """
    def remote_mediumCreateBaseStorage(self, args):

        format = args['format'].upper()
        type = ('fixed' if args['type'] == 'fixed' else 'Standard')
        mv = MediumVariant()
        type = mv.ValueMap[type]
        if args['split']:
            type = type + mv.ValueMap['VmdkSplit2G']

        """ @hd IMedium """
        hd = self.vbox.createHardDisk(format,args['file'])

        """ @progress IProgress """
        progress = hd.createBaseStorage(int(args['size'])*1024*1024,type)

        global progressOpPool
        progressid = progressOpPool.store(progress)

        return {'progress' : progressid}

    """
     * Release medium from all attachments
     *
     * @param array args array of arguments. See def body for details.
     * @return boolean True
     """
    def remote_mediumRelease(self, args):

        """ @m IMedium """
        m = self.vbox.openMedium(args['medium'],vboxStringToEnum("DeviceType", args['type']), None, None)
        mediumid = m.id

        # connected to...
        machines = m.machineIds
        released = []
        for uuid in machines:

            # Find medium attachment
            try:
                """ @mach IMachine """
                mach = self.vbox.findMachine(uuid)
            except Exception as e:
                self.errors.append((e,traceback.format_exc()))
                continue
            
            remove = []
            for a in mach.mediumAttachments:

                if a.medium and a.medium.id == mediumid:
                    remove.append({
                        'controller' : a.controller,
                        'port' : a.port,
                        'device' : a.device
                    })

            # save state
            state = mach.sessionState

            if not len(remove): continue

            released.append(uuid)

            # create session
            self.session = vboxMgr.mgr.getSessionObject(self.vbox)

            # Hard disk requires machine to be stopped
            if args['type'] == 'HardDisk' or state == vboxMgr.constants.SessionState_Unlocked:
                mach.lockMachine(self.session, vboxMgr.constants.LockType_Write)
            else:
                mach.lockMachine(self.session, vboxMgr.constants.LockType_Shared)


            for r in remove:
                
                if args['type'] == 'HardDisk':
                    self.session.machine.detachDevice(r['controller'],r['port'],r['device'])
                else:
                    self.session.machine.mountMedium(r['controller'],r['port'],r['device'],None,True)

            self.session.machine.saveSettings()
            self.session.unlockMachine()
            self.session = None

        return True


    """
     * Remove a medium
     *
     * @param array args array of arguments. See def body for details.
     * @return response data possibly containing progress operation id
     """
    def remote_mediumRemove(self, args):

        """ @m IMedium """
        m = self.vbox.openMedium(args['medium'],vboxStringToEnum('DeviceType', args.get('type', 'HardDisk')), None, None)

        if args.get('delete',None) and m.deviceType == vboxMgr.constants.DeviceType_HardDisk:

            """ @progress IProgress """
            progress = m.deleteStorage()

            global progressOpPool
            progressid = progressOpPool.store(progress)

            return {'progress' : progressid}

        else:
            m.close()

        return True


    """
     * Get a list of recent media
     *
     * @param array args array of arguments. See def body for details.
     * @return array of recent media
     """
    def remote_vboxRecentMediaGet(self, args):

        mlist = {}
        for r in [
            {'type':'HardDisk','key':'GUI/RecentListHD'},
            {'type':'DVD','key':'GUI/RecentListCD'},
            {'type':'Floppy','key':'GUI/RecentListFD'}]:
            
            list = self.vbox.getExtraData(r['key'])
            mlist[r['type']] = list.split(',')
        
        return mlist

    """
     * Get a list of recent media paths
     *
     * @param array args array of arguments. See def body for details.
     * @return array of recent media paths
     """
    def remote_vboxRecentMediaPathsGet(self, args):

        mlist = {}
        for r in [
            {'type':'HardDisk','key':'GUI/RecentFolderHD'},
            {'type':'DVD','key':'GUI/RecentFolderCD'},
            {'type':'Floppy','key':'GUI/RecentFolderFD'}]:
            mlist[r['type']] = self.vbox.getExtraData(r['key'])
        
        return mlist


    """
     * Update recent medium path list
     *
     * @param array args array of arguments. See def body for details.
     * @return boolean True on success
     """
    def remote_vboxRecentMediaPathSave(self, args):

        types = {
            'HardDisk':'GUI/RecentFolderHD',
            'DVD':'GUI/RecentFolderCD',
            'Floppy':'GUI/RecentFolderFD'
        }

        self.vbox.setExtraData(types[args['type']], args['folder'])

        return True

    """
     * Update recent media list
     *
     * @param array args array of arguments. See def body for details.
     * @return boolean True on success
     """
    def remote_vboxRecentMediaSave(self, args):

        types = {
            'HardDisk':'GUI/RecentListHD',
            'DVD':'GUI/RecentListCD',
            'Floppy':'GUI/RecentListFD'
        }

        self.vbox.setExtraData(types[args['type']], ','.join(args['list']))

        return True

    """
     * Mount a medium on the VM
     *
     * @param array args array of arguments. See def body for details.
     * @return boolean True on success
     """
    def remote_mediumMount(self, args):

        # Find medium attachment
        """ @machine IMachine """
        machine = self.vbox.findMachine(args['vm'])
        
        save = (machine.getExtraData('GUI/SaveMountedAtRuntime').lower() == 'yes')

        # create session
        self.session = vboxMgr.mgr.getSessionObject(self.vbox)

        if machine.sessionState == vboxMgr.constants.SessionState_Unlocked:
            machine.lockMachine(self.session, vboxMgr.constants.LockType_Write)
            save = True # force save on closed session as it is not a "run-time" change
        else:
            machine.lockMachine(self.session, vboxMgr.constants.LockType_Shared)
        

        # Empty medium / eject
        if args['medium'] == 0:
            med = None
        else:
            
            # Host drive
            if args['medium']['hostDrive'].lower() == 'True' or args['medium']['hostDrive'] == True:
                # CD / DVD Drive
                if args['medium']['deviceType'] == 'DVD':
                    drives = self.vbox.host.DVDDrives
                # floppy drives
                else:
                    drives = self.vbox.host.floppyDrives
                
                for m in drives:
                    if m.id == args['medium']['id']:
                        """ @med IMedium """
                        med = m
                        break

            # Normal medium
            else:
                """ @med IMedium """
                med = self.vbox.openMedium(args['medium']['location'], vboxStringToEnum("DeviceType", args['medium']['deviceType']), None, None)
            
        

        self.session.machine.mountMedium(args['controller'],args['port'],args['device'], med,True)

        if save:
            self.session.machine.saveSettings()

        self.session.unlockMachine()
        self.session = None

        return True

    """
     * Get medium details
     *
     * @param IMedium m medium instance
     * @return array medium details
     """
    def _mediumGetDetails(self, m, baseInfo=False):

        # No medium
        if m is None: return None
        
        # For fixed value
        mv = vboxEnumList("MediumVariant")
        variant = m.variant

        # Base medium
        if baseInfo and m.deviceType == vboxMgr.constants.DeviceType_HardDisk and (m.base and m.base.id != m.id):
            baseMedium = self._mediumGetDetails(m.base, True)            
        else:
            baseMedium = ({'id':m.base.id} if (m.deviceType == vboxMgr.constants.DeviceType_HardDisk and m.base) else None)
            
        if baseInfo:
            
            return {
                'id' : m.id,
                'description' : m.description,
                'name' : m.name,
                'deviceType' : vboxEnumToString("DeviceType", m.deviceType),
                'hostDrive' : bool(m.hostDrive),
                'size' : long(m.size),
                'format' : m.format,
                'type' : vboxEnumToString("MediumType",m.type),
                'base' : baseMedium,
                'readOnly' : bool(m.readOnly),
                'logicalSize' : (long(m.logicalSize)/1024)/1024
            }


        children = []
        attachedTo = []

        if getChildren:
            for c in vboxGetArray(m,'children'):
                children.append(self._mediumGetDetails(c))

        for mid in vboxGetArray(m,'machineIds'):
            sids = list(m.getSnapshotIds(mid))
            try:
                """ @mid IMachine """
                mid = self.vbox.findMachine(mid)
            except Exception as e:
                continue

            c = len(sids)
            for i in range(0,c):
                if sids[i] == mid.id:
                    del sids[i]
                else:
                    try:
                        """ @sn ISnapshot """
                        sn = mid.findSnapshot(sids[i])
                        sids[i] = sn.name
                        
                    except:
                        pass

            attachedTo.append({'machine':mid.name,'snapshots':sids})

        return {
                'id' : m.id,
                'description' : m.description,
                'state' : vboxEnumToString("MediumState", m.refreshState()),
                'location' : m.location,
                'name' : m.name,
                'deviceType' : vboxEnumToString("DeviceType", m.deviceType),
                'hostDrive' : bool(m.hostDrive),
                'size' : long(m.size),
                'format' : m.format,
                'type' : vboxEnumToString("MediumType",m.type),
                'parent' : (m.parent.id if (m.deviceType == vboxMgr.constants.DeviceType_HardDisk and m.parent) else None),
                'children' : children,
                'base' : baseMedium,
                'readOnly' : bool(m.readOnly),
                'logicalSize' : (long(m.logicalSize)/1024)/1024,
                'autoReset' : bool(m.autoReset),
                'lastAccessError' : m.lastAccessError,
                'variant' : long(variant),
                'fixed' : bool((long(variant) & mv['Fixed']) > 0),
                'split' : bool((long(variant) & mv['VmdkSplit2G']) > 0),
                'machineIds' : [],
                'attachedTo' : attachedTo
            }


    """
     * Get VirtualBox system properties
     * @param array args array of arguments. See def body for details.
     * @return array of system properties
     """
    def remote_vboxSystemPropertiesGet(self, args):

        mediumFormats = []
        
        # capabilities
        mfCap = vboxEnumList('MediumFormatCapabilities')
        for mf in vboxGetArray(self.vbox.systemProperties,'mediumFormats'): # @mf IMediumFormat """
            exts = mf.describeFileExtensions()
            dtypes = []
            for t in exts[1]:
                dtypes.append(vboxEnumToString("DeviceType",t))
            caps = []
            for v,k in mfCap.iteritems():
                if (k & mf.capabilities):
                    caps.append(v)
            
            mediumFormats.append({'id':mf.id,'name':mf.name,'extensions':exts[0],'deviceTypes':dtypes,'capabilities':caps})

        return {
            'version' : self.getVersion(),
            'settingsFilePath' : self.vbox.settingsFilePath,
            'minGuestRAM' : self.vbox.systemProperties.minGuestRAM,
            'maxGuestRAM' : self.vbox.systemProperties.maxGuestRAM,
            'minGuestVRAM' : self.vbox.systemProperties.minGuestVRAM,
            'maxGuestVRAM' : self.vbox.systemProperties.maxGuestVRAM,
            'minGuestCPUCount' : self.vbox.systemProperties.minGuestCPUCount,
            'maxGuestCPUCount' : self.vbox.systemProperties.maxGuestCPUCount,
            'autostartDatabasePath' : self.vbox.systemProperties.autostartDatabasePath,
            'infoVDSize' : self.vbox.systemProperties.infoVDSize,
            'networkAdapterCount' : 8, # static value for now
            'maxBootPosition' : self.vbox.systemProperties.maxBootPosition,
            'defaultMachineFolder' : self.vbox.systemProperties.defaultMachineFolder,
            'defaultHardDiskFormat' : self.vbox.systemProperties.defaultHardDiskFormat,
            'homeFolder' : self.vbox.homeFolder,
            'VRDEAuthLibrary' : self.vbox.systemProperties.VRDEAuthLibrary,
            'defaultAudioDriver' : vboxEnumToString("AudioDriverType", self.vbox.systemProperties.defaultAudioDriver),
            'defaultVRDEExtPack' : self.vbox.systemProperties.defaultVRDEExtPack,
            'serialPortCount' : self.vbox.systemProperties.serialPortCount,
            'parallelPortCount' : self.vbox.systemProperties.parallelPortCount,
            'mediumFormats' : mediumFormats
        }

    """
     * Get a list of VM log file names
     *
     * @param array args array of arguments. See def body for details.
     * @return array of log file names
     """
    def remote_machineGetLogFilesList(self, args):

        """ @m IMachine """
        m = self.vbox.findMachine(args['vm'])

        logs = []

        try:
            i = 0
            l = m.queryLogFilename(i)
            while l:
                logs.append(l)
                i = i + 1
                l = m.queryLogFilename(i)
        except: pass

        return {'path' : m.logFolder, 'logs' : logs}

    """
     * Get VM log file contents
     *
     * @param array args array of arguments. See def body for details.
     * @return string log file contents
     """
    def remote_machineGetLogFile(self, args):

        """ @m IMachine """
        m = self.vbox.findMachine(args['vm'])
        log = ''
        try:
            # Read in 8k chunks
            while True:
                l = m.readLog(int(args['log']),len(log),8192)
                if not l or not len(l): break
                log = log + l
            
        except Exception as ex:
            self.errors.append((ex,traceback.format_exc()))

        # Attempt to UTF-8 encode string or json_encode may choke
        # and return an empty string
        #if function_exists('utf8_encode'):
        #    return utf8_encode(log)
        
        return unicode(log, "utf-8")

    """
     * Get a list of USB devices attached to a given VM
     *
     * @param array args array of arguments. See def body for details.
     * @return array list of devices
     """
    def remote_consoleGetUSBDevices(self, args):

        """ @machine IMachine """
        machine = self.vbox.findMachine(args['vm'])
        self.session = vboxMgr.mgr.getSessionObject(self.vbox)
        machine.lockMachine(self.session, vboxMgr.constants.LockType_Shared)

        response = {}
        for u in vboxGetArray(self.session.console,'USBDevices'):
            response[u.id] = {'id':u.id,'remote':u.remote}
        
        self.session.unlockMachine()
        self.session = None

        return response

    """
     * Return a string representing the VirtualBox ExtraData key
     * for this port + device + bus type IgnoreFlush setting
     * 
     * @param integer port medium attachment port number
     * @param integer device medium attachment device number
     * @param string cType controller type
     * @return string extra data setting string
     """
    def _util_getIgnoreFlushKey(self, port,device,cType):

        cTypes = {
            'piix3' : 'piix3ide',
            'piix4' : 'piix3ide',
            'ich6' : 'piix3ide',
            'intelahci' : 'ahci',
            'lsilogic' : 'lsilogicscsi',
            'buslogic' : 'buslogic',
            'lsilogicsas' : 'lsilogicsas'
        }
        
        if type(cType) is int:
            cType = vboxEnumToString("StorageControllerType", cType)
        

        if not cTypes.get(cType.lower(),None):
            self.errors.append((Exception('Invalid controller type: ' + cType), traceback.format_exc()))
            return ''

        lun = ((int(device)*2) + int(port))

        return "VBoxInternal/Devices/%s/0/LUN#%s/Config/IgnoreFlush" %(cTypes[cType.lower()], lun)

    """
     * Get a newly generated MAC address from VirtualBox
     *
     * @param array args array of arguments. See def body for details
     * @return string mac address
     """
    def remote_vboxGenerateMacAddress(self, args):
        return self.vbox.host.generateMACAddress()
        
    
    """
     * Format a time span in seconds into days / hours / minutes / seconds
     * @param integer t number of seconds
     * @return array containing number of days / hours / minutes / seconds
     """
    def _util_splitTime(self, t):

        spans = [
            {'name':'days','value':86400},
            {'name':'hours','value': 3600},
            {'name':'minutes','value': 60},
            {'name':'seconds','value': 1}
        ]

        time = {}

        for span in spans:
            k = span['name']
            v = span['value']
            if not (int(math.floor(t / v)) > 0): continue
            time[k] = int(math.floor(t / v))
            t = t - int(math.floor(time[k] * v))

        return time
    

    """
     * Return VBOX result code text for result code
     * 
     * @param integer result code number
     * @return string result code text
     """
    @staticmethod
    def _util_resultCodeText(c):
        
        #rcodes = ReflectionClass('VirtualBox_COM_result_codes')
        #rcodes = array_flip(rcodes.getConstants())
        #rcodes['0x80004005'] = 'NS_ERROR_FAILURE'
        
        return c
        #return rcodes['0x'.strtoupper(hex(c))] . ' (0x'.strtoupper(hex(c)).')'


"""
    Event listner listens to events from a single VirtualBox
    event source and places them in a Queue
"""
class vboxEventListener(threading.Thread):
    
    eventSource = None
    eventListQueue = None
    
    registered = False
    listener = None
    listenerId = None
    
    running = True
    
    def __init__(self, listenerId, eventSource, eventListQueue):
        
        threading.Thread.__init__(self, name="%s-%s" %(self.__class__.__name__,listenerId))

        self.listenerId = listenerId
        self.eventSource = eventSource
        self.eventListQueue = eventListQueue
        
        self.listener = self.eventSource.createListener()
        self.eventSource.registerListener(self.listener, vboxSubscribeEventList, False)
        self.registered = True
    
    def shutdown(self):
        logger.debug("vboxEventListener %s shutting down" %(self.listenerId,))
        self.running = False
        
    def getEventData(self, event):
        
        data = {'eventType':vboxEnumToString('VBoxEventType', event.type),'sourceId':self.listenerId} 
        
        # Convert to parent class
        eventDataObject = vboxMgr.queryInterface(event, 'I' + data['eventType'][2:] + 'Event')        
        
        # Dedup ID is at least listener key ('vbox' or machine id) and event type
        data['dedupId'] = self.listenerId + '-' + data['eventType']
        
        return formatEvent(data, eventDataObject)

    
    def run(self):

        logger.debug("vboxEventListener %s starting" %(self.listenerId,))
        vboxMgr.initPerThread()
        
        try:

            eventList = []
            
            logger.debug("vboxEventListener %s running" %(self.listenerId,))
            
            while self.running:
                
                event = self.eventSource.getEvent(self.listener, 200)
                
                if event is not None:
                    try:
                        eventList.append(self.getEventData(event))
                    except Exception as e:
                        logger.error("Error processing event %s" %(str(e),))
                        
                    finally:
                        self.eventSource.eventProcessed(self.listener, event)
                        
                    
                elif len(eventList):
                    
                    for e in eventList:
                        self.eventListQueue.put(e)
                    eventList = []
                
        except:
            logger.debug("Event source %s went away" %(self.listenerId,))
            
    
        logger.debug("vboxEventListener unregistering %s" %(self.listenerId,))

        try:
            self.eventSource.unregisterListener(self.listener)
        except Exception as e:
            logger.error("vboxEventListener %s already unregistered: %s" %(self.listenerId,str(e)))
          
        if vboxMgr:      
            vboxMgr.deinitPerThread()     
            


"""
    Event listener pool handles all vboxEventListener threads
"""
class vboxEventListenerPool(threading.Thread):
    
    running = True
    eventListQueue = None
    
    listeners = {}
    listenerLock = threading.Lock()
    
    def __init__(self, eventListQueue):
        self.eventListQueue = eventListQueue
        threading.Thread.__init__(self, name="%s-%s" %(self.__class__.__name__,id(self)))
    
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
                logger.error("Not adding existing listener with id %s" %(id,))
                
        except Exception as e:
            logger.exception(str(e))
        
        self.listenerLock.release()
        
    def shutdown(self):
        
        logger.debug("vboxEventListenerPool shutting down (%s)" %(threading.current_thread(),))
        
        self.listenerLock.acquire(True)
        try:
            for id, l in self.listeners.iteritems():
                l.shutdown()
                l.join()
                
        except Exception as e:
            logger.exception(str(e))
            
        self.running = False
        self.listenerLock.release()        
        
        
    def run(self):
        
        logger.debug("vboxEventListenerPool run (%s)" %(threading.current_thread(),))
        
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
                        logger.debug("vboxEventListenerPool listener %s stopped" %(l.listenerId,))
                        l.join()
                        del self.listeners[l.listenerId]
            except Exception as e:
                logger.exception(str(e))
            
            #print "Listener count is " + str(len(self.listeners))
            self.listenerLock.release()
            time.sleep(1)

        if vboxMgr:
            vboxMgr.deinitPerThread()


"""
    RPC request handler
"""
RPCHeartbeatInterval = 60
class RPCRequestHandler(SocketServer.BaseRequestHandler):

    sendLock = threading.Lock()
    heartbeat = None
    file = None
    heartbeatTimer = None
    
    service = None
    serviceObj = None

    
    def close(self):
        """ 
            Close all open handles. This also forces
            blocking readline() to return
        """
        try: self.request.close()
        except: pass
        try: self.file._sock.close()
        except: pass
        try: self.file.close()
        except: pass
        
    def send(self, message):
        """
            Send a message to the connected client
        """
        
        # RPC calls yield a response
        if inspect.isgeneratorfunction(message):

            self.sendLock.acquire(True)
            
            try:
                for msg in message():
                    try:
                        response = json.dumps(msg)
                    except Exception as e:
                        traceback.format_exc()
                        continue
                    self.request.sendall(response+"\n")
            finally:
                self.sendLock.release()

        # Non generator
        else:
                        
            try:
                response = json.dumps(message)
            except:
                traceback.format_exc()
                return
    
            self.sendLock.acquire(True)
    
            try:
                self.request.sendall(response+"\n")
            finally:
                self.sendLock.release()
    
    def handle(self):
        """
            Handle requests. Main loop
        """
        
        # Create file object from socket so that
        # we can just call readline
        self.file = self.request.makefile()
        
        clientId = "%s:%s" %(self.client_address)
        
        self.server.addClient(clientId, self)
            
        class heartbeatrunner(threading.Thread):
            """
                Essentially just for keeping TCP alive.
            """
            sendLock = None
            request = None
            timer = None
            running = False
            
            def __init__(self, handler):
                self.handler = handler
                threading.Thread.__init__(self, name="%s-%s" %(self.__class__.__name__,id(self)))
                
            def shutdown(self):
                self.running = False
                
            def run(self):
                
                self.running = True
                
                global RPCHeartbeatInterval
                
                RPCHeartbeatMsg = {'msgType':'rpc_heartbeat','thread_id':str(threading.current_thread())}
                
                while self.running:
                    try:
                        self.handler.send(RPCHeartbeatMsg)
                    except:
                        return
                    
                    for i in range(0, RPCHeartbeatInterval):
                        if self.running: time.sleep(1)

        try:
            
            # Start heartbeat
            if self.heartbeat is None:
                self.heartbeat = heartbeatrunner(self)
                self.heartbeat.start()

            """
                Main loop that handles
                RPC requests from the connected client
            """
            while True:

                try:
                    
                    self.requestStr = self.file.readline()
                    
                    
                    # EOF - client disconnected
                    if len(self.requestStr) == 0 or self.requestStr[-1] != "\n":
                        break
                    
                    # Empty line?
                    if self.requestStr.strip() == '': continue
                    
                    try:
                        self.message = json.loads(self.requestStr)
                    except:
                        raise Exception("Invalid json request: %s" %(self.requestStr))
                    
    
                    """
                        A generator function ensures that no other
                        messages will be sent while a request is in progress
                    """
                    def handleResponse():
                        
                        """
                            Initial response dict
                        """
                        response = {
                            'requestId' : self.message.get('requestId',''),
                            'errors': [],
                            'messages' : [],
                            'success' : False
                        }
                        
                        
                        try:      
                            """
                                RPC messages are a simple call / response
                            """
                            if self.message.get('msgType', '') == 'rpc':
                                
                                
                                method = self.message.get('method', None)
                                if not method:
                                    raise Exception("No method specified in rpc call: %s" %(self.requestStr,))
                                
                                """ Set msg type """
                                response.update({'msgType' : '%s_response'%(method,)})
                                
                                
                                if method == 'setService':
                                    """
                                        Set a service for this connection
                                    
                                    """
                                    
                                    if self.serviceObj is not None:
                                        raise Exception("Service has already been set for this connection")
                                    
                                    self.service = self.message.get('args',{}).get('service', None)
                                    if not self.service:
                                        raise Exception('No service specified') 
        
                                
                                    """ Create or get instance of service"""
                                    serviceInstance = self.server.getService(self.service)
                                    if not serviceInstance:
                                        raise Exception("Unknown service: %s" %(self.service,))
                                    
                                    if isinstance(serviceInstance, type):
                                        self.serviceObj = serviceInstance()
                                    else:
                                        self.serviceObj = serviceInstance
                                    
                                    response.update({
                                        'responseData' : True,
                                        'errors': self.serviceObj.errors if hasattr(self.serviceObj, 'errors') else [],
                                        'messages': self.serviceObj.messages if hasattr(self.serviceObj, 'messages') else [],
                                        'success': True,
                                    })
                                
                                
                                elif method == 'registerClient':
                                    """
                                    
                                        Register client with service
                                        
                                    """
                                    
                                    methodResponse = self.serviceObj.registerClient(self)
                                    response.update({
                                        'responseData' : methodResponse,
                                        'success': True
                                    })
        
        
                                    
                                else:
                                    
                                    """
                                        Direct method call
                                        
                                    """
                                    if not self.serviceObj:
                                        raise Exception("A service has not been set for this connection")
                                    
                                    if not getattr(self.serviceObj, 'remote_%s' %(method,), None):
                                        raise Exception("Service '%s' has no method named '%s'" %(self.service, method))
                                    
                                    try:
                                        methodResponse = getattr(self.serviceObj, 'remote_%s' %(method,))(self.message.get('args',{}))
                                        
                                        # Format exceptions
                                        errors = []
                                        for e in self.serviceObj.errors:
                                            errors.append({
                                                'error': '%s' %(str(e),),
                                                'details': e[1]
                                            })
                                            
                                        response.update({
                                            'responseData' : methodResponse,
                                            'errors': errors,
                                            'messages': self.serviceObj.messages,
                                            'success': True
                                        })
                                        
                                        #logger.debug("%s_response: %s" %(method, methodResponse))
                                        
                                    except Exception as ex:
                                        
                                        logger.exception(str(ex))
                                        
                                        response.update({
                                            'responseData' : False,
                                            'errors': [{'details': traceback.format_exc(), 'error': '%s' %(str(ex),) }],
                                            'messages': self.serviceObj.messages
                                        })
        
                                    finally:
                                        self.serviceObj.finishRequest()
                            
                            else:
                                raise Exception("Invalid message type: %s" %(self.message.get('msgType',''),))
                            
                            
                        except Exception as ex:
                            response.update({
                                'msgType':'rpc_exception',
                                'details': traceback.format_exc(),
                                'error': str(ex)
                            })
                            
                        finally:
                            yield response
    
                        
                    self.send(handleResponse)

                
                except Exception as e:
                    # assume connection closed
                    #logger.exception(e)
                    break
    
        finally:
            
            # Stop heartbeat
            if self.heartbeat:
                self.heartbeat.shutdown()
                self.heartbeat.join()
            
            # Unregister client?
            if self.serviceObj:
                self.serviceObj.unregisterClient(self)
                    
                    
            self.server.removeClient(clientId)

            
"""
    RPC server
"""
class RPCServer(SocketServer.ThreadingMixIn, SocketServer.TCPServer):
    
    allow_reuse_address = True
    
    services = {}
    
    clients = {}
    clientLock = threading.Lock()
    
    def shutdown(self):
            
        SocketServer.TCPServer.shutdown(self)

        self.clientLock.acquire(True)
        try:
            for k,c in self.clients.iteritems():
                self.close_request(c)
        finally:
            self.clientLock.release()
        
    def addClient(self, clientId, client):
        self.clientLock.acquire(True)
        try:
            self.clients[clientId] = client
        finally:
            self.clientLock.release()
    
    def removeClient(self, clientId):
        self.clientLock.acquire(True)
        try:
            if self.clients.get(clientId, None):
                del self.clients[clientId]
        finally:
            self.clientLock.release()
    
    def server_activate(self):
        self.services['server'] = self
        SocketServer.TCPServer.server_activate(self)
    
    def remote_shutdown(self, *args):
        self.shutdown()
        return True
            
    def registerService(self, name, service):
        self.services[name] = service
        
    def getService(self, name):
        return self.services.get(name, None)




"""

    Event service is run by RPC server, pumping
    events to connected clients

"""
class vboxEventService(threading.Thread):

    eventQueue = None
    running = True
    clients = {}
    clientLock = threading.Lock()
    
    def __init__(self, eventQueue):
        
        self.eventQueue = eventQueue
        threading.Thread.__init__(self, name="%s-%s" %(self.__class__.__name__,id(self)))
        

    def shutdown(self):

        self.running = False            
                
    def run(self):
        
        while self.running:
            while not self.eventQueue.empty():
                self.clientLock.acquire(True)
                try:
                    e = self.eventQueue.get(False)
                    if e:
                        for c in self.clients.values():
                            try:
                                c.send({'msgType':'vboxEvent','event':e})
                            except:
                                # error sending to client
                                pass
                                
                        self.eventQueue.task_done()
                finally:
                    self.clientLock.release()
                    
            time.sleep(0.2)
        
        self.clientLock.acquire(True)
        try:
            clientKeys = self.clients.keys()
            for k in clientKeys:
                try:
                    self.clients[k].close()
                    del self.clients[k]
                except Exception as e:
                    logger.exception(str(e))
        finally:
            self.clientLock.release()
    
    def registerClient(self, client):

        self.clientLock.acquire(True)
        
        if not self.running:
            self.clientLock.release()
            return False
        try:
            id = "%s:%s" %(client.client_address)
            if self.clients.get(id, None):
                raise Exception("Client already registered")
            self.clients[id] = client
            return True
        finally:
            self.clientLock.release()
        
    def unregisterClient(self, client):
        self.clientLock.acquire(True)
        try:    
            id = "%s:%s" %(client.client_address)
            if self.clients.get(id, None):
                del self.clients[id]
        finally:
            self.clientLock.release()


"""
    Manages progress operations
"""
class vboxProgressOpPool(object):
    
    progressOpsLock = threading.Lock() 
    progressOps = {}
    
    def store(self, progressObj, session = None):
        
        # Does an exception exist?
        if progressObj.completed and progressObj.resultCode:            
            raise Exception("%s (%s): %s" %(progressObj.errorInfo.component, progressObj.errorInfo.resultCode, progressObj.errorInfo.text))

        self.progressOpsLock.acquire(True)
        try:
            pid = 'progressOp-%s' %(str(id(progressObj)),)
            self.progressOps[pid] = (progressObj, session)
        finally:
            self.progressOpsLock.release()
            
        return pid
    
    def cancel(self, progressId):
        self.progressOpsLock.acquire(True)
        try:
            progress, session = self.progressOps.get(progressId)
            progress.cancel()
        finally:
            self.progressOpsLock.release()
        
    def getStatus(self, progressId):
        
        self.progressOpsLock.acquire(True)
        status = None
        try:
            try:
                progress, session = self.progressOps.get(progressId)
                
            except TypeError:
                raise Exception("Progress operation does not exist")
            
            status = {
                'completed' : progress.completed,
                'canceled' : progress.canceled,
                'description' : progress.description,
                'operationDescription' : progress.operationDescription,
                'timeRemaining' : progress.timeRemaining,
                'resultCode' : progress.resultCode,
                'percent' : progress.percent,
                'cancelable' : progress.cancelable
            }


            # Does an exception exist?
            if status['completed'] and status['resultCode']:            
                raise Exception("%s (%s): %s" %(progress.errorInfo.component, progress.errorInfo.resultCode, progress.errorInfo.text))


        finally:
            self.progressOpsLock.release()
            
            # Completed? destroy progress op
            if status and status.get('completed', True) or status['canceled']:
                self.destory(progressId)

                    
        return status
    
    def destory(self, progressId):
        self.progressOpsLock.acquire(True)
        try:
            progress, session = self.progressOps[progressId]
            try:
                if session:
                    session.unlockMachine()
            finally:
                del self.progressOps[progressId]
        finally:
            self.progressOpsLock.release()

"""

    Main()
    
"""
def main(argv = sys.argv):
    
    # For proper UTF-8 encoding / decoding
    #reload(sys)
    #sys.setdefaultencoding('utf8')
    
    
    global vboxMgr, running, progressOpPool
    

    running = True
    
    def stop_sigint(signal, frame):
        global running
        running = False
    signal.signal(signal.SIGINT, stop_sigint)
    
    """
        Holds in-flight progress operations
    """
    progressOpPool = vboxProgressOpPool()
    
    """ Queues to pass events out of vbox to
        connected event listener
    """
    incomingQueue = Queue.Queue()
    outgoingQueue = Queue.Queue()

    """
    
        VBOX event listener pool listens for vbox
        and machine events
        
    """
    listenerPool = vboxEventListenerPool(incomingQueue)

    subscribe = []
    
    # Enumerate all defined machines
    for mach in vboxGetArray(vbox,'machines'):
         
        try:
            if mach.state == vboxMgr.constants.MachineState_Running:
                subscribe.append(mach.id)
                                
        except Exception as e:
            logger.exception(str(e))
    
    
    # Start listener pool
    listenerPool.start()

    # Add main virtualbox event source    
    listenerPool.add('vbox', vbox.eventSource)
    
    # Add machines that are running
    for s in subscribe:
        try:
            machine = vbox.findMachine(s)
            session = vboxMgr.mgr.getSessionObject(vbox)
            machine.lockMachine(session, vboxMgr.constants.LockType_Shared)
            listenerPool.add(s, session.console.eventSource)
            
        except Exception as e:
            logger.exception(str(e))
            
        finally:
            session.unlockMachine()
    
    
    
    """
        RPC Server setup / startup
    """
    # Port 0 means to select an arbitrary unused port
    HOST, PORT = "127.0.0.1", 11033
    rpcServer = RPCServer((HOST, PORT), RPCRequestHandler)
    ip, port = rpcServer.server_address

    # Start a thread with the server -- that thread will then start one
    # more thread for each request
    rpcServer_thread = threading.Thread(target=rpcServer.serve_forever)
    rpcServer_thread.start()
    
    
    """
    
        VBox event service sends events to RPC connected clients
        
    """
    eventServer = vboxEventService(outgoingQueue)
    eventServer.start()
    
    rpcServer.registerService('vboxEvents', eventServer)
    
    """
    
        VBox service hands requests from connected RPC clients
        off to vbox
        
    """
    rpcServer.registerService('vbox', vboxConnector)


    """
        Main loop
    """
    try:
        while running:
            
            # We'll exit when the rpc server dies
            if not rpcServer_thread.isAlive():
                logger.critical("RPCServer died. Exiting ..")
                running = False
                continue
                        
            # Create event listener - this must happen 
            # in the main thread
            if not listenerPool.isVboxAlive():
                logger.critical("vboxEventListenerPool died. Exiting...")
                running = False
                continue
                
            """
                Get events from incoming queue (populated by listenerPool)
                enrich them and place them in the outgoing queue (eventServer)
            """
            eventList = {}
            while not incomingQueue.empty():
                
                event = incomingQueue.get(False)
                
                if event:
                    
                    eventList[event['dedupId']] = event
                    
                    # Subscribe to any machines that are running
                    if event['eventType'] == 'OnMachineStateChanged' and event['state'] == 'Running':
                        
                        try:
                            machine = vbox.findMachine(event['machineId'])
                            session = vboxMgr.mgr.getSessionObject(vbox)
                            machine.lockMachine(session, vboxMgr.constants.LockType_Shared)
                            listenerPool.add(event['machineId'], session.console.eventSource)
                            
                        except Exception as e:
                            logger.exception(str(e))
                            
                        finally:
                            session.unlockMachine()
        
                    incomingQueue.task_done()
    
            if len(eventList):
                enrichEvents(eventList)
                
            for e in eventList.values():
                #eventlogger.debug("Event %s" %(e,))
                outgoingQueue.put(e)
                
            # only sleep if we didn't have events
            if not len(eventList):
                
                try:
                    time.sleep(0.2)
                    
                except IOError:
                    #assume interupt and stop
                    running = False

    except Exception as e:
        logger.exception(str(e))
        
    """
        Shutdown the vbox event server
    """
    eventServer.shutdown()
    eventServer.join()
    
    """
        Shutdown the RPC server
    """
    rpcServer.shutdown()
    rpcServer.server_close()
    rpcServer_thread.join()
    
    """
        Shutdown the listener pool
    """
    listenerPool.shutdown()
    listenerPool.join()
    
    
if __name__ == '__main__':
    main(sys.argv)

    
