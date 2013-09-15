print "IN accounts dispatcher.."

from dispatchers import dispatcher_parent, jsonout, require_admin

class dispatcher(dispatcher_parent):
    
    @jsonout
    @require_admin
    def getUsers(self, *args, **kwargs):
        pass
    getUsers.exposed = True
    
    @jsonout
    @require_admin
    def getGroups(self, *args, **kwargs):
        pass
    getGroups.exposed = True
    
    @jsonout
    @require_admin
    def updateGroup(self, *args, **kwargs):
        pass

    @jsonout
    @require_admin
    def deleteGroup(self, *args, **kwargs):
        pass
    
    @jsonout
    @require_admin
    def addGroup(self, *args, **kwargs):
        pass

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
    