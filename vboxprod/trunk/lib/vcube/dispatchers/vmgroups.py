from vcube.dispatchers import dispatcher_parent, jsonout, require_admin
import cherrypy

import vcube

from vcube.models import VMGroup

class dispatcher(dispatcher_parent):


    @jsonout
    @require_admin
    def addGroup(self, *args, **kwargs):
        c = VMGroup(VMGroup.name == kwargs.get('name'))
        for attr in ['name','description', 'parent_id']:
            setattr(c, attr, kwargs.get(attr))
        c.save()
        return True
    addGroup.exposed = True
        

    @jsonout
    @require_admin
    def deleteGroup(self, *args, **kwargs):
        c = VMGroup(VMGroup.id == kwargs.get('id', 0)).delete()
        return True
    deleteGroup.exposed = True
    
    @jsonout
    @require_admin
    def updateGroup(self, *args, **kwargs):
        c = VMGroup.get(VMGroup.id == kwargs.get('id',0))
        for attr in ['name','description', 'parent_id']:
            if kwargs.get(attr,None):
                setattr(c, attr, kwargs.get(attr))
        c.save()
        return True
    updateGroup.exposed = True
    
    @jsonout
    @require_admin
    def getGroups(self, *args, **kwargs):
        return list(VMGroup.select().order_by(VMGroup.parent_id, VMGroup.order).dicts())    
    getGroups.exposed = True

