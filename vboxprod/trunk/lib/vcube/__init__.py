import sys
import json
import os, sys, ConfigParser, threading, time
import MySQLdb

import logging
logger = logging.getLogger(__name__)

from vboxconnectorclient import vboxRPCEventListener

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
        Connector server thread list
    """
    eventListeners = {}
    eventListenersLock = threading.Lock()
    
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
                    
        threading.Thread.__init__(self)
        

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
        
        
        c = Connector.get(Connector.id == int(cid))
        c.status = state
        c.status_text = message
        c.save()
        
    def addConnector(self, connector):
        """
        Connect to a vbox connector server and get events
        """
        self.eventListenersLock.acquire(True)
        try:
            if self.running:
                logger.info("Adding connector %s" %(connector['name'],))
                self.eventListeners[str(connector['id'])] = vboxRPCEventListener(connector, self.pumpEvent, self.onConnectorStateChange)
                self.eventListeners[str(connector['id'])].start()
        finally:
            self.eventListenersLock.release()
            
    def updateConnector(self, connector):
        """
            Connector changed during runtime
        """
        cid = str(connector['id'])
        if self.eventListeners.get(cid, None) and self.eventListeners[cid].server['location'] != connector['location']:
            self.removeConnector(cid)
            self.addConnector(connector)
            
    def removeConnector(self, cid):
        """
            Remove connector
        """
        self.eventListenersLock.acquire(True)
        try:
            if self.eventListeners.get(cid, None):
                self.eventListeners[cid].stop()
                self.eventListeners[cid].join()
                del self.eventListeners[cid]
        finally:
            self.eventListenersLock.release()
            
    def run(self):
        
        self.running = True
        
        # Add connectors
        for c in list(Connector.select().dicts()):
            self.addConnector(c)

        
        while self.running:
            for i in range(0, self.heartbeatInterval):
                if not self.running: break
                time.sleep(1)
            self.pumpEvent({'eventType':'heartbeat'})

        self.eventListenersLock.acquire(True)
        try:
            for cid, c in self.eventListeners.iteritems():
                logger.info("Stopping connector client %s" %(cid,))
                c.stop()
                c.join()
        finally:
            self.eventListenersLock.release()
    

        
    
        
app = Application()


