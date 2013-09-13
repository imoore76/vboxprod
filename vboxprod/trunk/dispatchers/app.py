

from dispatchers import dispatcher_parent, jsonout

class dispatcher(dispatcher_parent):

    @jsonout
    def getSession(self, *args, **kwargs):
        return {}
    getSession.exposed = True
    
    @jsonout
    def login(self, *args, **kwargs):
        pass
    login.exposed = True
