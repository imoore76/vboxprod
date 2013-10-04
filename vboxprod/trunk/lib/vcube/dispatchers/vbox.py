import os
import vcube
import json, base64
import traceback, time
from vcube.dispatchers import dispatcher_parent, jsonin, jsonout
from vcube.models import Connector
import pprint, cherrypy

class dispatcher(dispatcher_parent):
    
    def __init__(self):
        
        from connector import vboxConnector
        
        for f in dir(vboxConnector):
        
            if f.startswith('remote_'):
                fn = f[7:]

                if hasattr(self, fn): continue

                def callback(*args, **kwargs):
                    return self.vboxAction(self, *args, **kwargs)
                callback.exposed = True
                setattr(self, fn, callback)
        
    def machineGetScreenShot(self, *args, **kwargs):
        
        """
                // Let the browser cache saved state images
        $ctime = 0;
        if(strpos($_SERVER['HTTP_IF_NONE_MATCH'],'_')) {
            $ctime = preg_replace("/.*_/",str_replace('"','',$_SERVER['HTTP_IF_NONE_MATCH']));
        } else if(strpos($_ENV['HTTP_IF_NONE_MATCH'],'_')) {
            $ctime = preg_replace("/.*_/",str_replace('"','',$_ENV['HTTP_IF_NONE_MATCH']));
        } else if(strpos($_SERVER['HTTP_IF_MODIFIED_SINCE'],'GMT')) {
            $ctime = strtotime($_SERVER['HTTP_IF_MODIFIED_SINCE']);
        } else if(strpos($_ENV['HTTP_IF_MODIFIED_SINCE'],'GMT')) {
            $ctime = strtotime($_ENV['HTTP_IF_MODIFIED_SINCE']);
        }
        
        if($dlm <= $ctime) {
            if (strpos(strtolower(php_sapi_name()),'cgi') !== false) {
                Header("Status: 304 Not Modified");
            } else {
                Header("HTTP/1.0 304 Not Modified");
            }
              exit;
        }
        """
        try:
            
            response = vcube.getInstance().vboxAction(kwargs['connector'], 'machineGetScreenShot', kwargs)
            
            cherrypy.response.headers['Content-Type'] = 'image/png'

            return base64.b64decode(response['responseData'])
                    
        except Exception as e:
            pprint.pprint(e)
            return None
        
    machineGetScreenShot.exposed = True
            
    @jsonin
    def vboxAction(self, *args, **kwargs):
        
        cherrypy.response.headers['Content-Type'] = 'application/json'
        
        fn = os.path.basename(cherrypy.url())
        

        jsonResponse = {'data':{'success':False,'errors':[],'messages':[],'responseData':None}}
        
        try:
            
            if not kwargs.get('connector', None):
                raise Exception("No VirtualBox connector id specified")
            
            response = vcube.getInstance().vboxAction(kwargs['connector'], fn, kwargs, cherrypy.session.get('user',{}).get('username','Unknown'))
            
            for k in jsonResponse['data'].keys():
                jsonResponse['data'][k] = response.get(k,jsonResponse['data'][k])
                
                
        except Exception as ex:
            
            e = {'details': traceback.format_exc(), 'error': '%s' %(str(ex),) }
            jsonResponse['data']['errors'].append(e)

        if kwargs.get('_pprint', None):
            return pprint.pformat(jsonResponse)
        
        return json.dumps(jsonResponse)
    

    vboxAction.exposed = True

