
from dispatchers import dispatcher_parent, jsonout

from app import app

class dispatcher(dispatcher_parent):
    
    @jsonout
    def getStuff(self, *args, **kwargs):
        return "asdf"
    
    getStuff.exposed = True
    