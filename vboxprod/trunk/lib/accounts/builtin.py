
import os, sys

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
        from utils import genhash
        import pprint
        try:
            u = User.get(User.username == username)
            pprint.pprint(u)
        except User.DoesNotExist:
            return False
        print u