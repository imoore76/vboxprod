
import sys, time, traceback, threading, Queue
import signal
import pprint

from multiprocessing import Process

""" Helpers """
def enumToString(constants, enum, elem):
    all = constants.all_values(enum)
    for e in all.keys():
        if str(elem) == str(all[e]):
            return e
    return "<unknown>"


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
        self.eventSource.registerListener(self.listener, [wrapper.constants.VBoxEventType_Any], False)
        self.registered = True
    
    def join(self, timeout=None):
        print "vboxEventListener shutting down (%s)" %(threading.current_thread(),)
        self.running = False
        super(vboxEventListener, self).join(timeout)
    
    def getEventData(self, event):
        
        data = {'eventType':enumToString(wrapper.constants, 'VBoxEventType', event.type),'sourceId':self.listenerId }
        
        # Convert to parent class
        eventDataObject = wrapper.queryInterface(event, 'I' + data['eventType'][2:] + 'Event')        
        
        # Dedup ID is at least listener key ('vbox' or machine id) and event type
        data['dedupId'] = self.listenerId + '-' + data['eventType']
        
        
        if data['eventType'] == 'OnMachineStateChanged':
                        
            data['machineId'] = eventDataObject.machineId
            data['state'] = enumToString(vboxConstants, "MachineState", eventDataObject.state)
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
            data['state'] = str(eventDataObject.state)
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
        elif data['eventType'] == 'OnVRDEServerChanged' or data['eventType'] == 'OnUSBControllerChanged' or data['eventType'] == 'OnVRDEServerInfoChanged':
            data['machineId'] = data['sourceId']
         
        elif data['eventType'] == 'OnSharedFolderChanged':
            data['machineId'] = data['sourceId']
            data['global'] = getattr(eventDataObject,'global')

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
        wrapper.initPerThread()
        
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
            
    
        print "vboxEventListener unregistering (%s)" %(threading.current_thread(),)
        if self.listener and self.registered:
            try:
                self.eventSource.unregisterListener(self.listener)
            except:
                print "Listener already unregistered"
                
        wrapper.deinitPerThread()     
            

class vboxEventListenerPool(threading.Thread):
    
    running = True
    eventListQueue = None
    
    listeners = []
    listenerLock = threading.Lock()
    
    def __init__(self, eventListQueue):
        self.eventListQueue = eventListQueue
        threading.Thread.__init__(self)
        
    def add(self, id, eventSource):
        
        self.listenerLock.acquire(True)
        
        if not self.running:
            self.listenerLock.release()
            return

        try:
            l = vboxEventListener(id, eventSource, self.eventListQueue)
            l.start()
            self.listeners.append(l)
        except:
            traceback.print_exc()
        
        self.listenerLock.release()
        
    def join(self, timeout=None):
        
        print "vboxEventListenerPool shutting down (%s)" %(threading.current_thread(),)
        
        self.listenerLock.acquire(True)
        try:
            for l in self.listeners:
                l.join(timeout)
        except:
            traceback.print_exc()
            
        self.running = False
        self.listenerLock.release()
        
        super(vboxEventListenerPool, self).join(timeout)
        
    def run(self):
        
        print "vboxEventListenerPool Run (%s)" %(threading.current_thread(),)
        
        wrapper.initPerThread()
        
        while self.running:
            
            # Clean up threads
            self.listenerLock.acquire(True)
            try:
                if not self.running:
                    self.listenerLock.release()
                    continue
                index = 0
                listeners = self.listeners
                for l in listeners:
                    if not l.isAlive():
                        print "Thread stopped ..."
                        l.join()
                        self.listeners.pop(index)
                    index = index + 1
            except:
                traceback.print_exc()
            
            print "Listener count is " + str(len(self.listeners))
            self.listenerLock.release()
            time.sleep(1)

        wrapper.deinitPerThread()

from vboxapi import VirtualBoxManager
wrapper = VirtualBoxManager(None, None)

# Get the VirtualBox manager
mgr  = wrapper.mgr

# Get the global VirtualBox object
vbox = wrapper.vbox

print "Running VirtualBox version %s" %(vbox.version)

# Get all constants through the Python wrapper code
vboxConstants = wrapper.constants

# Start a thread that obtains all VMs and listens for events
vmlist = []
subscribe = []
listeners = []

# Enumerate all defined machines
for mach in vbox.machines:
     
    try:
        
        vm = {
           'id':mach.id,
           'name':mach.name,
           'state':enumToString(vboxConstants, "MachineState", mach.state),
           'sessionState':enumToString(vboxConstants, "SessionState", mach.sessionState),
           'OSTypeId':mach.OSTypeId
        }
        
        if vm['state'] == 'Running':
            subscribe.append(vm['id'])
            
        vmlist.append(vm)
        
    except:
        traceback.print_exc()


# Subscribe to events

q = Queue.Queue()

listenerPool = vboxEventListenerPool(q)
listenerPool.start()
listenerPool.add('vbox', vbox.eventSource)

# Add running machines
for s in subscribe:
    machine = vbox.findMachine(s)
    session = mgr.getSessionObject(vbox)
    machine.lockMachine(session, wrapper.constants.LockType_Shared)
    listenerPool.add(s, session.console.eventSource)
    session.unlockMachine()
    


running = True

def stop_sigint(signal, frame):
    global running
    running = False
    
signal.signal(signal.SIGINT, stop_sigint)

while running:
    print "CHecking queue..."
    while not q.empty():
        
        # Check for dead listener pool
        if not listenerPool.isAlive():
            running = False
            continue
        
        event = q.get(False)
        if event:
            print "got event"
            pprint.pprint(event)
            
            if event['eventType'] == 'OnMachineStateChanged' and event['state'] == 'Running':
                machine = vbox.findMachine(event['machineId'])
                session = mgr.getSessionObject(vbox)
                machine.lockMachine(session, wrapper.constants.LockType_Shared)
                listenerPool.add(event['machineId'], session.console.eventSource)
                session.unlockMachine()

                
            q.task_done()
    time.sleep(1)
    
listenerPool.join()

del wrapper
