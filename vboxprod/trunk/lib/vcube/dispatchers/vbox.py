import os
import vcube
import json
import traceback
from vcube.dispatchers import dispatcher_parent, jsonin, jsonout, jsonResponseTemplate
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
        
    @jsonin
    def vboxAction(self, *args, **kwargs):
        
        cherrypy.response.headers['Content-Type'] = 'application/json'
        
        fn = os.path.basename(cherrypy.url())

        jsonResponse = jsonResponseTemplate
        
        try:
            
            response = vcube.getInstance().vboxAction(str(kwargs.get('server','0')), fn, kwargs)
            
            for k in jsonResponse['data'].keys():
                jsonResponse['data'][k] = response.get(k,jsonResponse['data'][k]) 
                
        except Exception as ex:
            
            e = {'details': traceback.format_exc(), 'error': '%s' %(str(ex),) }
            jsonResponse['data']['errors'].append(e)

        if kwargs.get('_pprint', None):
            return pprint.pformat(jsonResponse)
        
        return json.dumps(jsonResponse)
    

    vboxAction.exposed = True

