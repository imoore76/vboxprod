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
                    return self.vboxAction(*args, **kwargs)
                callback.exposed = True
                setattr(self, fn, callback)
        
    @jsonout    
    def vboxAction(*args, **kwargs):
        
        fn = os.path.basename(cherrypy.url())
        
        location = Connector.get(Connector.id == kwargs.get('server')).location
        
        return vboxRPCAction(location).rpcCall(fn, kwargs)

