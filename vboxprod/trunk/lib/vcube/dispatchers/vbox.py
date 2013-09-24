import os
from vcube.dispatchers import dispatcher_parent, jsonout
from vcube.vboxconnectorclient import vboxRPCAction
from vcube.models import Connector
import pprint, cherrypy


class dispatcher(dispatcher_parent):
    
    def __init__(self):
        
        from connector import vboxConnector
        
        for f in dir(vboxConnector):
        
            if f.startswith('remote_'):
                fn = f[7:]
                def callback(*args, **kwargs):
                    return self.vboxAction(self, *args, **kwargs)
                callback.exposed = True
                setattr(self, fn, callback)
        
    @jsonout    
    def vboxAction(self, *args, **kwargs):
        
        fn = os.path.basename(cherrypy.url())
        
        location = Connector.get(Connector.id == kwargs.get('server')).location
        
        server = vboxRPCAction(location)
        response = server.rpcCall(fn, kwargs)
        server.close()
        
        self.errors = response.get('errors',[])
        self.messages = response.get('messages',[])
        
        return response.get(fn+'_response')
    
    @jsonout
    def vboxBulkRequest(self, *args, **kwargs):
        
        fn = os.path.basename(cherrypy.url())
        
        location = Connector.get(Connector.id == kwargs.get('server')).location
        
        server = vboxRPCAction(location)
        response = server.rpcCall(fn, kwargs)
        server.close()
        
        self.errors = response.get('errors',[])
        self.messages = response.get('messages',[])
        
        return response.get(fn+'_response')

    vboxBulkRequest.exposed = True

