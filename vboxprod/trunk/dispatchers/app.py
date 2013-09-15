

from dispatchers import dispatcher_parent, jsonout
import app as GlobalApp
import cherrypy
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
        pprint.pprint(GlobalApp)
        GlobalApp.getInstance().accounts.authenticate(kwargs['u'], kwargs['p'])
        cherrypy.session['user'] = kwargs['u']
        return self.getSession()
        
    login.exposed = True

    @jsonout
    def logout(self, *args, **kwargs):
        cherrypy.lib.sessions.expire()
        cherrypy.session.delete()
        return True
    
    logout.exposed = True
