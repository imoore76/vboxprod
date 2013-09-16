

from dispatchers import dispatcher_parent, jsonout, require_admin
from models import Connector
import cherrypy
import app

class dispatcher(dispatcher_parent):

    @jsonout
    @require_admin
    def addConnector(self, *args, **kwargs):
        pass

    @jsonout
    @require_admin
    def deleteConnector(self, *args, **kwargs):
        pass
    
    @jsonout
    @require_admin
    def updateConnector(self, *args, **kwargs):
        pass
    
    @jsonout
    @require_admin
    def getConnectors(self, *args, **kwargs):
        pass
    
    getConnectors.exposed = True


