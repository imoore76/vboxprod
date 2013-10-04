from vcube.dispatchers import dispatcher_parent, jsonout, require_admin
import cherrypy

import vcube, pprint

from vcube.models import EventLog

class dispatcher(dispatcher_parent):


    @jsonout
    def getEvents(self, *args, **kwargs):
        pprint.pprint(kwargs)
        q = EventLog.select()
        if kwargs.get('vm', None):
            q = q.where(EventLog.machine == kwargs.get('vm'))
        if kwargs.get('limit', None):
            q = q.limit(kwargs.get('limit'))
        
        return list(q.order_by(EventLog.id.desc()).dicts())
        
    getEvents.exposed = True
        


