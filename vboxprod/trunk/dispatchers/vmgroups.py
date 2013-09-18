from dispatchers import dispatcher_parent, jsonout, require_admin
import cherrypy, app

from models import VMGroup

class dispatcher(dispatcher_parent):


    @jsonout
    @require_admin
    def addGroup(self, *args, **kwargs):
        ex = None
        try:
            ex = VMGroup(VMGroup.name == kwargs.get('name')).get()
        except:
            pass
        if ex:
            raise Exception("A Group with that name exists")
        
        c = VMGroup(VMGroup.name == kwargs.get('name'))
        for attr in ['name','location']:
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
        for attr in ['name','location']:
            if kwargs.get(attr,None):
                setattr(c, attr, kwargs.get(attr))
        c.save()
        return True
    updateGroup.exposed = True
    
    @jsonout
    @require_admin
    def getGroups(self, *args, **kwargs):
        return list(VMGroup.select().dicts())    
    getGroups.exposed = True

