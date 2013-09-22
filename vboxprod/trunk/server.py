import sys, os, signal

import threading
import ConfigParser
import traceback
from pprint import pprint

# Our library modules
basepath = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0,basepath+'/lib')

import cherrypy

from app import app, flash_policy_server, install

import logging
 
#logging.basicConfig(level=logging.DEBUG)







"""
       
    Web Server Thread starts cherrypy
       
"""
class WebServerThread(threading.Thread):
               
    def finish(self):
        cherrypy.engine.exit()

    def run(self):
        
        from mysqlsession import MySQLSession

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
    
        
        """
            WebSocket server
        """
        from ws4py.server.cherrypyserver import WebSocketPlugin, WebSocketTool
        from ws4py.websocket import WebSocket

        WebSocketPlugin(cherrypy.engine).subscribe()
        cherrypy.tools.websocket = WebSocketTool()
        
        webconfig['/eventStream']  = {'tools.websocket.on': True }


        """
            Start server
        """
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

    # Flash policy server to allow flash
    # app to use sockets
    flash_policy_server.start()
    


if __name__ == '__main__':
    main(sys.argv)

