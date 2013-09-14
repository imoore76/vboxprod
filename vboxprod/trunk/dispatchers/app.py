

from dispatchers import dispatcher_parent, jsonout
import cherrypy
import server
import pprint

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
        self.app.accounts.authenticate(kwargs['u'], kwargs['p'])
        cherrypy.session['user'] = kwargs['u']
        return self.getSession()
        
    login.exposed = True

    @jsonout
    def logout(self, *args, **kwargs):
        cherrypy.lib.sessions.expire()
        cherrypy.session.delete()
        return True
    
    logout.exposed = True
