import cherrypy, json, pprint
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
     * Client vent queues waiting for events
    """
    eventQueues = {}
    
    """
        Queue lock for adding / removing
    """
    eventQueuesLock = threading.Lock()
    
    def __init__(self):

        import accounts
        __import__('accounts.' + self.getConfigItem('app','accountsModule') )
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
            
    
    def pumpEvents(self, events):
        

        for e in events:
            cherrypy.engine.publish('websocket-broadcast', json.dumps(e))
            
        
        self.eventQueuesLock.acquire(True)
        try:
            for ev in events:
                for e in self.eventQueues.values():
                    try:
                        e.put(ev)
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

    def shutdown(self):
        print "app shutting down"
        self.running = False
        
    def run(self):
        
        self.running = True
        
        eid = 0
        
        while self.running:
            self.pumpEvents([{'asdf':'foo','id':eid, 'queues': len(self.eventQueues)}])
            eid = eid + 1
            time.sleep(2)
    

app = Application()
app.start()

cherrypy.engine.subscribe('stop', app.shutdown)

