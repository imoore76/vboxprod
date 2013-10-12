

from vcube.dispatchers import dispatcher_parent, jsonout, require_admin
from vcube.models import Connector
import cherrypy

import vcube
from vcube import constants

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
        
        c = Connector()
        for attr in ['name','location','description']:
            setattr(c, attr, kwargs.get(attr))
        c.status = 0
        c.save()
        
        # Tell application that a connector was added
        vcube.getInstance().addConnector(dict(c._data.copy()))
        
        vcube.getInstance().pumpEvent({
            'eventSource' : 'vcube',
            'eventType':'ConnectorAdded',
            'connector_id' : c.id,
            'connector' : dict(c._data.copy())
        })

        
        return True
    addConnector.exposed = True
        

    @jsonout
    @require_admin
    def deleteConnector(self, *args, **kwargs):
        
        Connector(Connector.id == kwargs.get('id', 0)).delete()
        
        # Tell application that a connector was removed
        vcube.getInstance().removeConnector(kwargs.get('id',0))
        
        vcube.getInstance().pumpEvent({
            'eventSource' : 'vcube',
            'eventType':'ConnectorRemoved',
            'connector_id' : kwargs.get('id', 0)
        })


        return True

    deleteConnector.exposed = True
    
    @jsonout
    @require_admin
    def updateConnector(self, *args, **kwargs):
        c = Connector.get(Connector.id == kwargs.get('id',0))
        for attr in ['name','location', 'description', 'status_text']:
            if kwargs.get(attr, None) is not None:
                setattr(c, attr, kwargs.get(attr))
                
        
        if kwargs.get('status',None) is not None:
            if int(kwargs['status']) == constants.CONNECTOR_STATES['DISABLED'] or (c.status == constants.CONNECTOR_STATES['DISABLED'] and int(kwargs['status']) == constants.CONNECTOR_STATES['DISCONNECTED']):
                c.status = kwargs.get('status')

        c.save()
        
        # Tell application that a connector was removed
        vcube.getInstance().updateConnector(dict(c._data.copy()))

        vcube.getInstance().pumpEvent({
            'eventSource' : 'vcube',
            'eventType':'ConnectorUpdated',
            'connector_id' : c.id,
            'connector' : dict(c._data.copy())
        })

        return True
    
    updateConnector.exposed = True
    
    @jsonout
    @require_admin
    def getConnectors(self, *args, **kwargs):
        return list(Connector.select().dicts())
    getConnectors.exposed = True


