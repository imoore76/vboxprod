import socket, sys
import cherrypy, json, pprint
from urlparse import urlparse
import os, sys, ConfigParser, threading, time
import MySQLdb

print "Imported app"

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
    
def getDB():
    global config
    local = threading.local()
    if hasattr(local, 'db'):
        return local.db
    else:
        
        dbconfig = {}
        for k,v in config.items('storage'):
            dbconfig[k] = v
    
        db = MySQLdb.connect(**dbconfig)
        local.db = db
        return db


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
    
    def __init__(self):

        # Setup accounts interface
        import accounts
        __import__('app.accounts.' + self.getConfigItem('app','accountsModule') )
        self.accounts = getattr(accounts, self.getConfigItem('app','accountsModule')).interface()
                    
        threading.Thread.__init__(self)
        

    """
     * Return a configuration item or its default
     """
    def getConfigItem(self, section, item):
        try:
            return config.get(section, item)
        except:
            return self.configDefaults.get(item, None)    
            
    
    def pumpEvent(self, event):

        cherrypy.engine.publish('websocket-broadcast', json.dumps(event))
            
        
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
        
    
    def addConnector(self, connector):
        """
        Connect to a vbox connector server and get events
        """
        self.eventListenersLock.acquire(True)
        try:
            if self.running:
                print "Adding connector %s" %(connector['name'],)
                self.eventListeners[str(connector['id'])] = vboxConnectorEventListener(connector, self.pumpEvent)
                self.eventListeners[str(connector['id'])].start()
        finally:
            self.eventListenersLock.release()
            
    def updateConnector(self, connector):
        """
            Connector changed during runtime
        """
        cid = str(connector['id'])
        if self.eventListeners.get(cid, None) and self.eventListeners['location'] != connector['location']:
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
        from models import Connector
        for c in list(Connector.select().dicts()):
            pprint.pprint(c)
            self.addConnector(c)

        
        eid = 0
        
        while self.running:
            self.pumpEvent({'asdf':'foo','id':eid, 'queues': len(self.eventQueues)})
            eid = eid + 1
            time.sleep(2)

        self.eventListenersLock.acquire(True)
        try:
            for cid, c in self.eventListeners.iteritems():
                print "Stopping connector client %s" %(cid,)
                c.stop()
                c.join()
        finally:
            self.eventListenersLock.release()
    

class vboxConnectorEventListener(threading.Thread):
    
    STATUS_DISCONNECTED = -1
    STATUS_RUNNING = 5
    STATUS_CONNECTED = 10
    STATUS_ERROR = 20
    
    status = STATUS_DISCONNECTED
    
    server = None
    
    connected = False
    
    onEvent = None
    
    sock = None
    
    file = None
    
    running = False
        
    def __init__(self, server, onEvent):
        self.server = server
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.onEvent = onEvent
        threading.Thread.__init__(self)
        
    def connect(self):
        
        print "here in connect"
        sys.stdout.flush()

        try:
            url = urlparse(self.server['location'])
            
        except Exception as e:
            pprint.pprint(e)
            print "Failed to parse server location %s" %(self.server['location'])
            sys.stdout.flush()

            self.stop()
            return
        
        try:
            
            print "Trying to connect to %s:%s" %(url.hostname, url.port)
            sys.stdout.flush()
            self.sock.connect((url.hostname, url.port))
            print "Connected..."
            sys.stdout.flush()
            self.file = self.sock.makefile()
            self.connected = True
            
        except Exception as e:
            pprint.pprint(e)
            
    def disconnect(self):
        print "here in disconnect"
        sys.stdout.flush()
        if self.sock:
            self.sock.close()
        self.connected = False
        self.sock = None
    
    def stop(self):
        self.running = False
        self.disconnect()
        
    def run(self):
        
        self.running = True
        
        while self.running:
            
            while not self.connected:
                
                if not self.running: break
                self.connect()
                if not self.running: break
                
                if not self.connected:
                    for i in range(0,10):
                        if self.running: time.sleep(i)
                        else: break
            
            try:                
                response = self.file.readline()
            
            # assume disconnect by server
            except Exception as e:
                pprint.pprint(e)
                self.disconnect()
                break
                
            if response.strip() == '': continue
            
            try:
                message = json.loads(response)
            except Exception as e:
                print "Invalid json response: %s" %(response)
                continue

            
            # Message has event
            if message.get('event', None):
                self.onEvent(message['event'])
            else:
                time.sleep(0.2)
        
        self.disconnect()
        
    
        
app = Application()


