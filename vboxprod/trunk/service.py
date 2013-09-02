
import sys
import os

""" insert librar paths """
sys.path.insert(0,os.path.dirname(os.path.realpath(__file__)) + '/lib')
sys.path.insert(0,os.path.dirname(os.path.realpath(__file__)))

from storage import storage

import cherrypy
from cherrypy.process import plugins, servers
from cherrypy import Application

from ConfigParser import ConfigParser

class app(object):
    
    storage = None
    settings = None
    servers = []
    
    def __init__(self):
        
        self.settings = ConfigParser()
        self.settings.read('settings.ini')

        """ set up storage """
        self.storage = storage(self.settings.items('storage'))
        
        self.servers = self.storage.query("select * from vbox_servers")

        print self.servers
    
    def startconfigwatch(self):
        pass
    
    def startweb(self):
        
        configfiles=None
        environment=None
        pidfile=None
        imports=None
        
        """Subscribe all engine plugins and start the engine."""
        sys.path = [''] + sys.path
        for i in imports or []:
            exec("import %s" % i)
        
        for c in configfiles or []:
            cherrypy.config.update(c)
            # If there's only one app mounted, merge config into it.
            if len(cherrypy.tree.apps) == 1:
                for app in cherrypy.tree.apps.values():
                    if isinstance(app, Application):
                        app.merge(c)
        
        engine = cherrypy.engine
        
        if environment is not None:
            cherrypy.config.update({'environment': environment})
        
        # Daemonize
        # cherrypy.config.update({'log.screen': False})
        #plugins.Daemonizer(engine).subscribe()
        
        if pidfile:
            plugins.PIDFile(engine, pidfile).subscribe()
        
        if hasattr(engine, "signal_handler"):
            engine.signal_handler.subscribe()
        if hasattr(engine, "console_control_handler"):
            engine.console_control_handler.subscribe()
        
        
        # Always start the engine; this will start all other services
        try:
            engine.start()
        except:
            # Assume the error has been logged already via bus.log.
            sys.exit(1)
        else:
            engine.block()
            
        

myApp = app()
