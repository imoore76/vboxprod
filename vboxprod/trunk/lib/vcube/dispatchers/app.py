
from vcube.dispatchers import dispatcher_parent, jsonout

import vcube

import cherrypy

class dispatcher(dispatcher_parent):

    @jsonout
    def getSession(self, *args, **kwargs):
        data = {}
        for k,v in cherrypy.session.items():
            data[k] = v
        return data
    
    getSession.exposed = True
    
    @jsonout
    def login(self, *args, **kwargs):
        
        user = vcube.getInstance().accounts.authenticate(kwargs.get('u',''), kwargs.get('p',''))
        if user != False:
            cherrypy.session['user'] = user
            return self.getSession(_raw=True)
        return False
    
    login.exposed = True

    @jsonout
    def logout(self, *args, **kwargs):
        cherrypy.lib.sessions.expire()
        cherrypy.session.delete()
        return True
    
    logout.exposed = True

