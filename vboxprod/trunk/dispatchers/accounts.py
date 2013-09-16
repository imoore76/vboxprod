from dispatchers import dispatcher_parent, jsonout, require_admin
import cherrypy, pprint

import app

class dispatcher(dispatcher_parent):
    
    
    @jsonout
    @require_admin
    def getUsers(self, *args, **kwargs):
        return app.getInstance().accounts.getUsers()
    getUsers.exposed = True
    
    @jsonout
    @require_admin
    def getGroups(self, *args, **kwargs):
        return app.getInstance().accounts.getGroups()
    getGroups.exposed = True
    
    @jsonout
    @require_admin
    def updateGroup(self, *args, **kwargs):
        print "here..."
        pprint.pprint(kwargs)
        pprint.pprint(args)
        return app.getInstance().accounts.updateGroup(kwargs)
    updateGroup.exposed = True

    @jsonout
    @require_admin
    def deleteGroup(self, *args, **kwargs):
        pass
    
    @jsonout
    @require_admin
    def addGroup(self, *args, **kwargs):
        return app.getInstance().accounts.addGroup(kwargs)
    addGroup.exposed = True

    @jsonout
    @require_admin
    def updateUser(self, *args, **kwargs):
        pass

    @jsonout
    @require_admin
    def deleteUser(self, *args, **kwargs):
        pass
    
    @jsonout
    @require_admin
    def addUser(self, *args, **kwargs):
        pass
    