

from dispatchers import dispatcher_parent, jsonout, require_admin
from models import Connector
import cherrypy
from app import app

class dispatcher(dispatcher_parent):

    @jsonout
    @require_admin
    def addConnector(self, *args, **kwargs):
        ex = None
        try:
            ex = Connector(Connector.name == kwargs.get('name')).get()
        except:
            pass
        if ex:
            raise Exception("A connector with that name exists")
        
        c = Connector(Connector.name == kwargs.get('name'))
        for attr in ['name','location']:
            setattr(c, attr, kwargs.get(attr))
        c.save()
        return True
    addConnector.exposed = True
        

    @jsonout
    @require_admin
    def deleteConnector(self, *args, **kwargs):
        Connector(Connector.id == kwargs.get('id', 0)).delete()
        return True
    deleteConnector.exposed = True
    
    @jsonout
    @require_admin
    def updateConnector(self, *args, **kwargs):
        c = Connector.get(Connector.id == kwargs.get('id',0))
        for attr in ['name','location']:
            if kwargs.get(attr,None):
                setattr(c, attr, kwargs.get(attr))
        c.save()
        return True
    updateConnector.exposed = True
    
    @jsonout
    @require_admin
    def getConnectors(self, *args, **kwargs):
        return list(Connector.select().dicts())    
    getConnectors.exposed = True


