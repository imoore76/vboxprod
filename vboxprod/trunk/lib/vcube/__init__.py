import sys
import json
import re
from datetime import datetime
import time
import os, sys, ConfigParser, threading, Queue
import MySQLdb
import pprint, traceback

from connector import vboxConnector
import constants

from vboxclient import vboxRPCClient, vboxRPCClientPool



import logging
logger = logging.getLogger('vcube')

config = None
app = None


def getConfig():
    # Read config 
    global config
    if not config:
        config = ConfigParser.SafeConfigParser()
        config.read(os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))) + '/settings.ini')
    return config

def getInstance():
    global app
    if not app:                
        app = Application()
    return app

def start():
    global app
    app = getInstance()
    app.start()
    
def stop():
    global app
    app.stop()
    app.join()

# Imported after these are defined
from models import Connector, EventLog, TaskLog
    
class vboxEventsToEventLog:
    events = [
        'MachineStateChanged',
        'SnapshotTaken',
        'MachineRegistered',
        'MachineDataChanged'
    ]
    
    @staticmethod
    def MachineDataChanged(eventData):
        return {'name':'Machine settings changed',
                'machine':eventData['machineId'],
                'connector': eventData['connector_id'],
                'category' : constants.LOG_CATEGORY['CONFIGURATION']
        }
        
    @staticmethod
    def SnapshotTaken(eventData):
        return {'name':'Snapshot taken',
                'machine':eventData['machineId'],
                'details':'Snapshot `%s` taken' %(eventData['enrichmentData'].get('currentSnapshotName'),),
                'connector': eventData['connector_id'],
                'category' : constants.LOG_CATEGORY['SNAPSHOT']
        }

    @staticmethod
    def MachineRegistered(eventData):
        if eventData['registered']:
            name = 'Machine registered'
            severity = constants.SEVERITY['INFO']
            try:
                details = "`%s` registered" %(eventData['enrichmentData']['name'])
            except:
                pass
        else:
            name = 'Machine unregistered'
            severity = constants.SEVERITY['WARNING']
            details = ''
        return {'name':name,
                'details' : details,
                'machine':eventData['machineId'],
                'connector': eventData['connector_id'],
                'severity' : severity,
                'category' : constants.LOG_CATEGORY['VBOX']
        }

    @staticmethod
    def MachineStateChanged(eventData):
        severities = {
            'PoweredOff': constants.SEVERITY['ERROR'],
            'Paused' : constants.SEVERITY['WARNING'],
            'Stuck' : constants.SEVERITY['CRITICAL'],
            'Saved' : constants.SEVERITY['WARNING']
        }
        return {'name':'Machine state changed',
                'machine':eventData['machineId'],
                'details':'State changed to %s' %(re.sub(r'([a-z])([A-Z])',r'\1 \2',eventData['state']),),
                'connector': eventData['connector_id'],
                'severity' : severities.get(eventData['state'], constants.SEVERITY['INFO']),
                'category' : constants.LOG_CATEGORY['STATE_CHANGE']
        }


"""

    Application

"""
class Application(threading.Thread):
        
    """
      * Error number describing a fatal error
      * @var integer
    """
    ERRNO_FATAL = 32
    
    """
     * Error number describing a connection error
     * @var integer
     """
    ERRNO_CONNECT = 64
    
    """
     * Default configuration items
     """
    configDefaults = {
        'dbType' : 'mysql',
        'accountsModule' : 'builtin'
    }
    
    accounts = None
    
    running = False
    
    """
     * Client event queues waiting for events
    """
    eventQueues = {}
    
    """
        Queue lock for adding / removing
    """
    eventQueuesLock = threading.Lock()
    
    """
        Connector event listener threads
    """
    connectorEventListeners = {}
    
    """
        dict of connectors by ID that vbox
        actions will be sent to
    """
    connectorActionPool = {}

    """
        dict by connector id of actions waiting
        to be performed
    """
    connectorActionQueues = {}
    
    """
        Lock for manipulating connector list
    """
    connectorsLock = threading.Lock()
    
    """
        Max threads per connector
    """
    connectorThreads = 5

    """
        Event handlers - callbacks to call when we emit
        an event
    """
    eventHandlers = []
    
    """
        Heartbeat interval for event pump
    """
    heartbeatInterval = 20
    
    """
        VirtualMachines list
    """
    virtualMachines = {}
    virtualMachinesLock = threading.Lock()
    
    """
        Used for progress operation to task mapping
    """
    progressOps = {}
    
    def __init__(self):

        # Setup accounts interface
        import accounts
        __import__('vcube.accounts.' + self.getConfigItem('vcube', 'accountsModule'))
        self.accounts = getattr(accounts, self.getConfigItem('vcube', 'accountsModule')).interface()
                    
        threading.Thread.__init__(self, name="%s-%s" % (self.__class__.__name__, id(self)))
        

    """
     * Return a configuration item or its default
     """
    def getConfigItem(self, section, item):
        try:
            return config.get(section, item)
        except:
            return self.configDefaults.get(item, None)    
            
    
    """
        Run callbacks when an event is received
    """
    def addEventHandler(self, handler):
        self.eventHandlers.append(handler)
        
    """
        Send event to all listeners
    """
    def pumpEvent(self, event):

        pprint.pprint(event)

        # onEvent returns false if we should not
        # pump this event to the client
        if not self.onEvent(event):
            return
        
        
        for eh in self.eventHandlers:
            eh(event)
            
        self.eventQueuesLock.acquire(True)
        try:
            for e in self.eventQueues.values():
                try:
                    e.put(event)
                except:
                    pass
            
        finally:
            self.eventQueuesLock.release()

    """
       Log a task
    """
    def logTask(self, taskData):

        try:
            task = TaskLog()
            task.started = int(time.time())
            
            task.status = taskData.get('status', constants.TASK_STATUS['STARTED'])
            task.started = datetime.today().strftime('%Y-%m-%d %H:%M:%S')
            
            for attr in ['name','machine','details','connector','user','category']:
                setattr(task, attr, taskData.get(attr,None))

            task.save()
            
            self.pumpEvent({
                'source' : 'vcube',
                'eventType' : 'taskLogEntry',
                'eventData' : dict(task._data.copy())
            })
            return task
        
        except Exception as e:
            traceback.print_exc()
            logger.exception(e)
            
            return None

    """
        Update a task
    """
    def updateTask(self, task, taskData):
        
        try:
            task.status = taskData.get('status', constants.TASK_STATUS['COMPLETED'])
            
            if task.status > 0 and not taskData.get('completed', None):
                taskDat['completed'] = datetime.today().strftime('%Y-%m-%d %H:%M:%S')
                
            for attr in ['name','machine','details','completed']:
                if taskData.get(attr, None):
                    setattr(task, attr, taskData.get(attr))
    
            task.save()
            
        
            self.pumpEvent({
                'source' : 'vcube',
                'eventType' : 'taskLogUpdate',
                'eventData' : dict(task._data.copy())
            })
            
            return task
        
        except Exception as e:
            traceback.print_exc()
            logger.exception(e)
            
        return None
        
    """
        Update a task based on progress status event
    """
    def updateTaskProgress(self, event):
        
        if not self.progressOps.get(event['progress'], None): return

        task = self.progressOps[event['progress']]
        
        taskData = {}
        
        status = dict(event['status'].copy())
        
        if status['completed'] or status['canceled']:
        
            try:            
                taskData['status'] = constants.TASK_STATUS['COMPLETED'] if not status['canceled'] else constants.TASK_STATUS['CANCELED']
                
                taskData['completed'] = datetime.today().strftime('%Y-%m-%d %H:%M:%S')
                
                if status.get('resultCode', None):
                    taskData['status'] = constants.TASK_STATUS['ERROR']
                    taskData['details'] = status.get('error', taskData['details'])
                    
                self.updateTask(task, taskData)

            finally:
                # remove from list
                del self.progressOps[pid]

        else:
            
            taskData['details'] = status.get('description', task.details)

            eventTaskData = dict(task._data.copy())
            eventTaskData.update(taskData)
            status['progress_id'] = event['progress']
            status['connector_id'] = event['connector_id']
            eventTaskData['progress'] = status
            
            self.pumpEvent({
                'source' : 'vcube',
                'eventType' : 'taskLogUpdate',
                'eventData' : eventTaskData
            })
        
    """
       Log an event
    """
    def logEvent(self, event):

        try:
            el = EventLog()
            el.started = int(time.time())
            el.severity = event.get('severity', constants.SEVERITY['INFO'])
            el.time = datetime.today().strftime('%Y-%m-%d %H:%M:%S')
            
            for attr in ['name','machine','details','connector','category']:
                setattr(el, attr, event.get(attr,''))

            el.save()
            
            self.pumpEvent({
                'source' : 'vcube',
                'eventType' : 'eventLogEntry',
                'eventData' : dict(el._data.copy())
            })
            return el.id
        
        except Exception as e:
            traceback.print_exc()
            logger.exception(e)
            
    def registerEventQueue(self, queue):
        
        eqid = 'eventQueue-%s' % (id(queue),)
        
        self.eventQueuesLock.acquire(True)
        try:
            self.eventQueues[eqid] = queue
        finally:
            self.eventQueuesLock.release()

        return eqid

    def unregisterEventQueue(self, eqid):
        
        self.eventQueuesLock.acquire(True)
        try:
            del self.eventQueues[eqid]
        finally:
            self.eventQueuesLock.release()

    def stop(self):
        self.running = False
        
    """
        Place vboxConnectorAction in queue and wait
    """
    def vboxAction(self, connector_id, action, args, user=''):
        
        # Pass-through non-loggable actions
        if not getattr(getattr(vboxConnector, 'remote_'+action), 'log', False):
            return self.connectorActionPool[str(connector_id)].vboxAction(action, args)
        
        # Initial task entry
        try:
            logData = getattr(vboxConnector, 'remote_'+action+'_log')(args, {})
        except Exception as e:
            traceback.print_exc()
            logger.exception(e)
            logData = {
                'name': action,
                'details': 'Log failed: %s' %(str(e),)
            }
        
        # Enrich task log data
        logData['connector'] = connector_id
        logData['user'] = user

        
        # Log task
        task = self.logTask(logData)

        # Perform action and parse result
        result = self.connectorActionPool[str(connector_id)].vboxAction(action, args)
        
        # Failed to create task..
        if not task:
            return result
        
        # Get updated task entry
        try:
            
            logData.update(getattr(vboxConnector, 'remote_'+action+'_log')(args, ({} if not result.get('success', False) else result.get('responseData',{}))))
            
        except Exception as e:
            traceback.print_exc()
            logger.exception(e)
            logData.update({
                'name': action,
                'details': 'Log update failed: %s' %(str(e),)
            })

        # Set status to completed if it was successful,
        # else set to erred and append errors
        if not result.get('success', False):
            
            logData['status'] = constants.TASK_STATUS['ERROR']
            
            task.completed = datetime.today().strftime('%Y-%m-%d %H:%M:%S')

            if len(result.get('errors',[])):
                errorStrings = []
                for e in result.get('errors'):
                    errorStrings.append(e.get('error','Unkonwn'))
                logData['details'] = ' '.join(errorStrings)
            
    
        # vboxConnector method says we should look for a progress operation
        # result and responseData contains a progress id
        elif getattr(getattr(vboxConnector, 'remote_'+action), 'progress', False) and type(result.get('responseData',None)) is dict and result.get('responseData',{}).get('progress',None):
            
            # Add to progress / task pool
            self.progressOps[result['responseData']['progress']] = task
            logData['status'] = constants.TASK_STATUS['INPROGRESS']

        # Task is completed
        else:
            logData['status'] = constants.TASK_STATUS['COMPLETED']
            logData['completed'] = datetime.today().strftime('%Y-%m-%d %H:%M:%S')
            
        self.updateTask(task, logData)
        
        return result
        
        
    
    """
        Return internal list of virtual machines
    """
    def getVirtualMachines(self):
        
        vmList = []
        self.virtualMachinesLock.acquire(True)
        try:
            vmList = list(self.virtualMachines.values())
        finally:
            self.virtualMachinesLock.release()

        return vmList
    
    def onEvent(self, event):
        
        if event['eventType'] == 'progressUpdate':
            """
                Update task
            """
            self.updateTaskProgress(event)
            return False
            
        if event['eventType'] == 'ConnectorStateChanged':
            """
                Connector state change
            """
            
            if event['status'] == constants.CONNECTOR_STATES['RUNNING']:
                """ Running """
                
                vmListAdded = []
                
                rpcVMList = self.vboxAction(event['connector_id'], 'vboxGetMachines', {})
                
                self.virtualMachinesLock.acquire(True)
                try:
                    
                    for vm in rpcVMList['responseData']:
                        
                        vm['connector_id'] = event['connector_id']
                        self.virtualMachines[vm['id']] = vm
                        vmListAdded.append(vm)
                    
                    if len(vmListAdded):
                        
                        self.pumpEvent({
                            'eventSource' : 'vcube',
                            'eventType' : 'MachinesAdded',
                            'connector_id' : event['connector_id'],
                            'machines' : vmListAdded
                        })

                finally:
                    self.virtualMachinesLock.release()
            
            else:
                """ Not running """
                
                self.virtualMachinesLock.acquire(True)
                vmListRemoved = []
                try:
                    vmIds = self.virtualMachines.keys()
                    for id in vmIds:
                        
                        if self.virtualMachines[id]['connector_id'] == event['connector_id']:
                            del self.virtualMachines[id]      
                            vmListRemoved.append(id)      

                    if len(vmListRemoved):
                        
                        self.pumpEvent({
                            'eventSource' : 'vcube',
                            'eventType':'MachinesRemoved',
                            'connector' : event['connector_id'],
                            'machines' : vmListRemoved
                        })
                                            
                finally:
                    self.virtualMachinesLock.release()
            
        elif event['eventType'] == 'MachineRegistered':
            """
                Machine added or removed from virtualbox server
            """
            
            self.virtualMachinesLock.acquire(True)
            try:
                if event['registered']:
                    vm = event['enrichmentData']
                    vm['connector_id'] = event['connector_id']
                    self.virtualMachines[vm['id']] = vm
                else:
                    del self.virtualMachines[event['machineId']]
            finally:
                self.virtualMachinesLock.release()
        
        
        elif event['eventType'] == 'SessionStateChanged':
            """
                Machine session state change
            """
            self.virtualMachinesLock.acquire(True)
            try:
                self.virtualMachines[event['machineId']]['sessionState']  = event['state']
            finally:
                self.virtualMachinesLock.release()
                
        elif event['eventType'] == 'MachineStateChanged':
            """
                Machine state changed
            """
            self.virtualMachinesLock.acquire(True)
            try:
                self.virtualMachines[event['machineId']]['state']  = event['state']
                self.virtualMachines[event['machineId']]['lastStateChange'] = event['enrichmentData']['lastStateChange']
            finally:
                self.virtualMachinesLock.release()
        
        elif event['eventType'] == 'MachineDataChanged':
            """
                Any type of machine data changed
            """
            self.virtualMachinesLock.acquire(True)
            try:
                self.virtualMachines[event['machineId']].update(event['enrichmentData'])
            finally:
                self.virtualMachinesLock.release()
        
        elif event['eventType'] == 'MachineGroupChanged':
            """
                Group Changed
            """
            self.virtualMachinesLock.acquire(True)
            try:
                self.virtualMachines[event['machineId']]['group_id']  = event['group']
            finally:
                self.virtualMachinesLock.release()

        elif event['eventType'] == 'MachineIconChanged':
            """
                Icon changed
            """
            self.virtualMachinesLock.acquire(True)
            try:
                self.virtualMachines[event['machineId']]['icon']  = event['icon']
            finally:
                self.virtualMachinesLock.release()
            
        """ Add to event log """        
        if event['eventType'] in vboxEventsToEventLog.events:
            self.logEvent(getattr(vboxEventsToEventLog, event['eventType'])(event))
            
        return True
                          
    def onConnectorStatusChange(self, cid, status, message=''):
        
        """
            Pump event to clients first
        """
        self.pumpEvent({
            'eventSource' : 'vcube',
            'eventType':'ConnectorStateChanged',
            'connector_id' : cid,
            'status' : status,
            'status_text' : message
        })
        
        logEvent = False
        
        try:
            c = Connector.get(Connector.id == int(cid) and Connector.status > -1)
            if int(c.status) != int(status):
                logEvent = True
            c.status = status
            c.status_text = message
            c.save()
            
        except Connector.DoesNotExist:
            return
        
        except Exception as e:
            traceback.print_exc()
            logger.exception(e)
            
        if logEvent:
            
            sevLookups = {
                constants.CONNECTOR_STATES['DISABLED'] : constants.SEVERITY['WARNING'],
                constants.CONNECTOR_STATES['DISCONNECTED'] : constants.SEVERITY['INFO'],
                constants.CONNECTOR_STATES['ERROR'] : constants.SEVERITY['CRITICAL'],
                constants.CONNECTOR_STATES['REGISTERING'] : constants.SEVERITY['WARNING'],
                constants.CONNECTOR_STATES['RUNNING'] : constants.SEVERITY['INFO']
            }
            
            try:
                self.logEvent({
                    'name' : 'Server status changed to ' + constants.CONNECTOR_STATES_TEXT.get(status, 'Unknown'),
                    'details' : message,
                    'connector' : cid,
                    'severity' : sevLookups.get(status, constants.SEVERITY['INFO']),
                    'category' : constants.LOG_CATEGORY['CONNECTOR']
                })
                
            except Exception as e:
                traceback.print_exc()
                logger.exception(e)
            
        
    def addConnector(self, connector):
        """
        Connect to a vbox connector server and get events
        """        
        self.connectorsLock.acquire(True)
        cid = None
        try:
            if self.running:
                
                logger.info("Adding connector %s" % (connector['name'],))
                
                cid = str(connector['id'])
                
                """ Add event listener """
                self.connectorEventListeners[cid] = vboxRPCClient(server=connector, service='vboxEvents',
                          onStateChange=self.onConnectorStatusChange, listener=True)
                
                # Start
                self.connectorEventListeners[cid].start()
                                
                def sendEvent(message):
                    
                    try:
                        message['event']['connector_id'] = cid
                        message['event']['eventSource'] = 'vbox'
                        self.pumpEvent(message['event'])
                    
                    except Exception as e:
                        traceback.print_exc()
                        logger.exception(e)
                    
                # Listen for vbox events
                self.connectorEventListeners[cid].listen(['vboxEvent'], sendEvent)
                
                """ Add to action pool """
                self.connectorActionPool[cid] = vboxRPCClientPool(connector, self.connectorThreads)
                self.connectorActionPool[cid].start()

        except Exception as e:
            traceback.print_exc()
            logger.exception(e)
            if cid and self.connectorEventListeners.get(cid, None):
                del self.connectorEventListeners[cid]
        
        finally:
            self.connectorsLock.release()

    def removeConnector(self, cid):
        """
            Remove connector
        """
        self.connectorsLock.acquire(True)
        try:

            if self.connectorEventListeners.get(cid, None):
                
                """ Remove event listener """
                self.connectorEventListeners[cid].stop()
                self.connectorEventListeners[cid].join()
                del self.connectorEventListeners[cid]
                
            if self.connectorActionPool.get(cid, None):
                
                """ Remove from action pool """
                self.connectorActionPool[cid].stop()
                self.connectorActionPool[cid].join()
                del self.connectorActionPool[cid]
                
                
        finally:
            self.connectorsLock.release()
            
            
    def updateConnector(self, connector):
        """
            Connector changed during runtime
        """
        cid = str(connector['id'])
        
        if self.connectorEventListeners.get(cid, None) and self.connectorEventListeners[cid].server['location'] != connector['location']:
            """ Updated location """
            self.removeConnector(cid)
            self.addConnector(connector)
            
        elif int(connector['status']) == -1 and self.connectorEventListeners.get(cid, None):
            """ disabled """
            self.removeConnector(cid)
        
        elif int(connector['status']) == 0 and not self.connectorEventListeners.get(cid, None):
            """ enabled """
            self.addConnector(connector)
        
            
    def run(self):
        """
            Main thread loop
        """
        
        self.running = True
        
        # Add connectors
        for c in list(Connector.select().where(Connector.status > -1).dicts()):
            self.addConnector(c)

        
        while self.running:
            for i in range(0, self.heartbeatInterval):
                if not self.running: break
                time.sleep(1)
            self.pumpEvent({'eventType':'heartbeat', 'eventSource':'vcube'})

 
        self.connectorsLock.acquire(True)
        try:
            
            """ Stop event listener clients """
            for cid, c in self.connectorEventListeners.iteritems():
                logger.info("Stopping connector client %s" % (cid,))
                c.stop()
                
            """ Stop action pool clients """
            for cid, c in self.connectorActionPool.iteritems():
                logger.info("Stopping connector client %s" % (cid,))
                c.stop()

            """ Join event listeners """
            for cid, c in self.connectorEventListeners.iteritems():
                c.join()
            
            """ Join clients """
            for cid, c in self.connectorActionPool.iteritems():
                c.join()
            
            
            self.connectorActionPool = {}
            self.connectorEventListeners = {}

        finally:
            self.connectorsLock.release()
    



