import sys, os
import threading
import ConfigParser
import traceback
from pprint import pprint

import logging
 
#logging.basicConfig(level=logging.DEBUG)

basepath = os.path.abspath(os.path.dirname(__file__))
app = None

# Our library modules
sys.path.insert(0,basepath+'/lib')

import cherrypy
from utils import *
from models import *


    
"""

    Application

"""
class Application(threading.Thread):
    
    __metaclass__ = Singleton
    
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
        'accountsModule' : 'Builtin'
    }
    
    config = None
    
    def __init__(self, config):
        self.config = config
        threading.Thread.__init__(self)
    
    """
     * Return a configuration item or its default
     """
    def getConfigItem(self, item):
        if config.get(item, None):
            return config['item']
        return configDefaults.get('item', None)
    
        
    """
     * Get current user
     """
    def getUser(self):
        pass
            #a = new modulefactory('accounts', self::getConfigItem('accountsModule'))
            #return a.getUser(_SESSION['userid'])
    
    
    """
     * Authenticate against the user db
     """
    def auth(self, username, password):
        user = User.select().where(User.name == username).get()
        pprint(user)     
        return True
            
    
    def run(self):
        pass

"""
       
    Web Server Thread starts cherrypy
       
"""
class WebServerThread(threading.Thread):
       
    config = None
    
    def __init__(self, config):     
        self.config = config  
        threading.Thread.__init__(self)
        
    def finish(self):
        cherrypy.engine.exit()

    def run(self):

        dbconfig = {}
        for k,v in self.config.items('storage'):
            dbconfig[k] = v
        
        webconfig = {
            '/': {
                  
                'tools.staticdir.on': True,
                'tools.staticdir.dir': basepath+'/webroot',                                                                                       
                'tools.staticdir.index': 'index.html',
                                 
                'tools.sessions.on': True,
                'tools.sessions.storage_type': "Mysql",
                'tools.sessions.connect_arguments': dbconfig,
                'tools.sessions.table_name': 'sessions'
            }
        }
        
        """
            All requests go through dispatchers in the /dispatchers folder 
        """
        class DispatchRoot(object):
            pass
        
        # Load dispatchers
        import dispatchers
        
        dispatch_names = ['app','accounts','connectors','vbox','vmgroups']
        
        for d in dispatch_names:
            __import__('dispatchers.' + d, globals(), locals())
            setattr(DispatchRoot, d, getattr(dispatchers, d).dispatcher())
    
        from mysqlsession import MySQLSession
            
        cherrypy.quickstart(DispatchRoot(), '/', webconfig)

            
            
def main(argv = sys.argv):
    
    global app
    
    # For proper UTF-8 encoding / decoding
    reload(sys)
    sys.setdefaultencoding('utf8')
    
    # Read config 
    config = ConfigParser.SafeConfigParser()
    config.read(basepath + '/settings.ini')
    
    # Start application thread
    app = Application(config)
    app.start()
    
    # Start web thread
    webserver = WebServerThread(config)
    webserver.start()
    


if __name__ == '__main__':
    main(sys.argv)

