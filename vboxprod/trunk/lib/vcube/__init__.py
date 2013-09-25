import sys
import json
import os, sys, ConfigParser, threading, time, Queue
import MySQLdb
import pprint, traceback

import logging
logger = logging.getLogger('vcube')

from vboxclient import vboxRPCClient, vboxRPCClientPool

global config, app

# Read config 
config = ConfigParser.SafeConfigParser()
config.read(os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))) + '/settings.ini')

def getConfig():
    return config

def getInstance():
    global app
    return app

def start():
    global app
    app.start()
    
def stop():
    global app
    app.stop()
    app.join()

# Imported after these are defined
from models import Connector

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
    
    
    
    def __init__(self):

        # Setup accounts interface
        import accounts
        __import__('vcube.accounts.' + self.getConfigItem('vcube','accountsModule') )
        self.accounts = getattr(accounts, self.getConfigItem('vcube','accountsModule')).interface()
                    
        threading.Thread.__init__(self, name="%s-%s" %(self.__class__.__name__,id(self)))
        

    """
     * Return a configuration item or its default
     """
    def getConfigItem(self, section, item):
        try:
            return config.get(section, item)
        except:
            return self.configDefaults.get(item, None)    
            
    
    """
        Run callbacks when an event is recieved
    """
    def onEvent(self, handler):
        self.eventHandlers.append(handler)
        
    def pumpEvent(self, event):

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

    def registerEventQueue(self, queue):
        
        eqid = 'eventQueue-%s'%(id(queue),)
        
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
    def vboxAction(self, connector_id, action, args):
        return self.connectorActionPool[connector_id].vboxAction(action, args)
        
    
    def onConnectorStateChange(self, cid, state, message=''):
        
        """
            Pump event to clients first
        """
        self.pumpEvent({
            'eventType':'connectorStateChange',
            'connector' : cid,
            'status' : state,
            'message' : message
        })
        
        try:
            c = Connector.get(Connector.id == int(cid) and Connector.status > -1)
            c.status = state
            c.status_text = message
            c.save()
            
        except Connector.DoesNotExist:
            pass
        
        except Exception as e:
            logger.exception(e)
            
        
    def addConnector(self, connector):
        """
        Connect to a vbox connector server and get events
        """        
        self.connectorsLock.acquire(True)
        cid = None
        try:
            if self.running:
                
                logger.info("Adding connector %s" %(connector['name'],))
                
                cid = str(connector['id'])
                
                """ Add event listener """
                self.connectorEventListeners[cid] = vboxRPCClient(server=connector, service='vboxEvents',
                          onStateChange=self.onConnectorStateChange, listener=True)
                
                # Start
                self.connectorEventListeners[cid].start()
                                
                def sendEvent(message):
                    self.pumpEvent(message.get('event'))
                    
                # Listen for vbox events
                self.connectorEventListeners[cid].listen(['vboxEvent'], sendEvent)
                
                """ Add to action pool """
                self.connectorActionPool[cid] = vboxRPCClientPool(connector, self.connectorThreads)
                self.connectorActionPool[cid].start()

        except Exception as e:
            traceback.print_exc()
            logger.exception(e)
            print str(e)
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
            self.pumpEvent({'eventType':'heartbeat'})

 
        self.connectorsLock.acquire(True)
        try:
            
            """ Stop event listener clients """
            for cid, c in self.connectorEventListeners.iteritems():
                logger.info("Stopping connector client %s" %(cid,))
                c.stop()
                
            """ Stop action pool clients """
            for cid, c in self.connectorActionPool.iteritems():
                logger.info("Stopping connector client %s" %(cid,))
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
    

        
    
        
app = Application()


