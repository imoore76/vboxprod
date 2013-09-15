
import os, sys

sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__)))+'/lib')

from models import User, Group

CAPABILITIES = [
    'groups',
    'updategroups',
    'updateusers',
    'logout'
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
        u = User.get(User.username == username)
        print u