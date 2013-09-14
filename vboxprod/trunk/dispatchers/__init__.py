

import json, cherrypy, traceback

""""
    Send data as JSON
"""
def jsonout(func):
    cherrypy.response.headers['Content-Type'] = 'application/json'
    def decorated(*args, **kwargs):
        errors = []
        messages = []
        success = False
        responseData = None
        try:
            responseData = func(*args, **kwargs)
            success = True
        except:
            errors.append(traceback.format_exc())
        
        (errors.append(x) for x in args[0].errors)
            
        return json.dumps({'data':{'success':success,'errors':errors,'messages':args[0].messages,'responseData':responseData}})
    return decorated

"""
    Require a valid session
"""
def require_auth(func):
    def decorated(*args, **kwargs):
        return func(args, kwargs)
    return decorated


"""
    Require an administrator
"""
def require_admin(func):
    def decorated(*args, **kwargs):
        return func(args, kwargs)
    return decorated

from pprint import pprint
"""
    Parent dispatcher class
"""
class dispatcher_parent(object):
    
    errors = []
    messages = []
    
    