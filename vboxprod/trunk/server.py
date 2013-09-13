import sys, os
import json
import threading
import traceback
from pprint import pprint

# Our library modules
sys.path.insert(0,os.path.abspath(os.path.dirname(__file__))+'/lib')

import cherrypy
from utils import *


"""

    Ajax requests
    
"""
class AjaxRequests(object):
    pass

# Load dispatchers
import dispatchers

dispatch_names = ['app','accounts','connectors','vbox','vmgroups']

for d in dispatch_names:
    __import__('dispatchers.' + d)
    setattr(AjaxRequests, d, getattr(dispatchers, d).dispatcher())
    
"""

    Application

"""
class app(object):
    
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
     * Log in to the application and return a session object
     """
    def login(username, password):       
        pass
            
    


"""
       
    Web Server Thread starts cherrypy
       
"""
class WebServerThread(threading.Thread):
       
    def __init__(self):       
        threading.Thread.__init__(self)
        
    def finish(self):
        cherrypy.engine.exit()

    def run(self):

        
        config = {
            '/': {
                'tools.staticdir.on': True,
                'tools.staticdir.dir': os.path.abspath(os.path.dirname(__file__))+'/webroot',                                                                                       
                'tools.staticdir.index': 'index.html'}
        }

            
        cherrypy.quickstart(AjaxRequests(), '/', config)

            
            
def main(argv = sys.argv):
    
    # For proper UTF-8 encoding / decoding
    reload(sys)
    sys.setdefaultencoding('utf8')
    
    webserver = WebServerThread()
    webserver.start()
    


if __name__ == '__main__':
    main(sys.argv)

