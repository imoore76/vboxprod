

from dispatchers import dispatcher_parent, jsonout, require_admin
from models import Connector
import cherrypy
import app

class dispatcher(dispatcher_parent):

    @jsonout
    @require_admin
    @cherrypy.expose
    def addConnector(self, *args, **kwargs):
        pass

    @jsonout
    @require_admin
    @cherrypy.expose
    def deleteConnector(self, *args, **kwargs):
        pass
    
    @jsonout
    @require_admin
    @cherrypy.expose
    def updateConnector(self, *args, **kwargs):
        pass
    
    @jsonout
    @require_admin
    @cherrypy.expose
    def getConnectors(self, *args, **kwargs):
        pass


