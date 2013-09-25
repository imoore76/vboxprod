

import json, cherrypy, traceback, pprint

import logging
logger = logging.getLogger(__name__)

__all__ = ['accounts', 'connectors', 'vbox', 'app', 'vmgroups']


"""
    Input data comes from json posted data

"""
def jsonin():

    def decorated(*args, **kwargs):

        try:
            kwargs.update(json.loads(cherrypy.request.body.read(int(cherrypy.request.headers['Content-Length']))))
        except:
            pass
        
        return func(*args, **kwargs)

    return decorated

""""
    Send data as JSON
"""
def jsonout(func):
    cherrypy.response.headers['Content-Type'] = 'application/json'
    def decorated(*args, **kwargs):

        try:
            kwargs.update(json.loads(cherrypy.request.body.read(int(cherrypy.request.headers['Content-Length']))))
        except:
            pass
        
        if kwargs.get('_raw') == True:
            return func(*args, **kwargs)
        
        errors = []
        messages = []
        success = False
        responseData = None
        try:
            responseData = func(*args, **kwargs)
            success = True
        except Exception as ex:
            
            logger.exception(str(ex))

            e = {'details': traceback.format_exc(), 'error': '%s' %(str(ex),) }
            errors.append(e)
        
        for x in args[0].errors:
            errors.append(x)
            
        if kwargs.get('_pprint', None):
            return pprint.pformat({'data':{'success':success,'errors':errors,'messages':args[0].messages,'responseData':responseData}})
        
        return json.dumps({'data':{'success':success,'errors':errors,'messages':args[0].messages,'responseData':responseData}})
    
    return decorated

"""
    Require a valid session
"""
def require_auth(func):
    def decorated(*args, **kwargs):
        return func(*args, **kwargs)
    return decorated


"""
    Require an administrator
"""
def require_admin(func):
    def decorated(*args, **kwargs):        
        return func(*args, **kwargs)
    return decorated


"""
    Parent dispatcher class
"""
class dispatcher_parent(object):
    
    errors = []
    messages = []
        
    