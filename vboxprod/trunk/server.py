import sys, os, signal

# Our library modules
basepath = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0,basepath+'/lib')

from ws4py.server.cherrypyserver import WebSocketPlugin, WebSocketTool

import threading
import ConfigParser
import traceback
import app
import install
from pprint import pprint

import logging
 
#logging.basicConfig(level=logging.DEBUG)



import cherrypy
from utils import *
from models import *


print "In server..."



"""
       
    Web Server Thread starts cherrypy
       
"""
class WebServerThread(threading.Thread):
               
    def finish(self):
        cherrypy.engine.exit()

    def run(self):
        
        config = app.getConfig()
        
        dbconfig = {}
        for k,v in config.items('storage'):
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
            def eventStream(self):
                pass
            eventStream.exposed = True
        
        # Load dispatchers
        import dispatchers
        
        print "Getting dispatcherrs"
        
        for d in dispatchers.__all__:
            __import__('dispatchers.' + d)
            setattr(DispatchRoot, d, getattr(dispatchers, d).dispatcher())
    
        from mysqlsession import MySQLSession
        
        from ws4py.websocket import WebSocket
        
        class EchoWebSocket(WebSocket):
            def received_message(self, message):
                """
                Automatically sends back the provided ``message`` to
                its originating endpoint.
                """
                self.send(message.data, message.is_binary)
        
        WebSocketPlugin(cherrypy.engine).subscribe()
        cherrypy.tools.websocket = WebSocketTool()
        
        webconfig['/eventStream']  = {
            'tools.websocket.on': True,
            'tools.websocket.handler_cls': EchoWebSocket
        }


        cherrypy.quickstart(DispatchRoot(), '/', webconfig)

            


    
    
def main(argv = sys.argv):
    
    # For proper UTF-8 encoding / decoding
    #reload(sys)
    #sys.setdefaultencoding('utf8')
    
    
    if len(argv) > 1 and argv[1] == 'installdb':
        install.database(config)
        sys.exit()
        
    if len(argv) > 1 and argv[1] == 'resetadmin':
        install.resetadmin(config)
        sys.exit()
    
    # Start web thread
    webserver = WebServerThread()    
    webserver.start()

    


if __name__ == '__main__':
    main(sys.argv)

