
basepath = os.path.abspath(os.path.dirname(__file__))

import models.User, models.Group

CAPABILITIES = [
    'groups',
    'updategroups',
    'updateusers'
]

class interface:
    
    def getUser(self, username):
        pass
    
    def getGroup(self, groupname):
        pass
    
    def getUsers(self):
        pass
    
    def getGroups(self):
        pass
    
    def changePassword(self, username, password):
        pass
    
    def updateUser(self, updata):
        pass
    
    def updateGroup(self, update):
        pass
    
    def deleteGroup(self, groupname):
        pass
    
    def deleteUser(self, username):
        pass
    
    def authenticate(self, username, password):
        u = models.User.get(User.username == username)
        print u