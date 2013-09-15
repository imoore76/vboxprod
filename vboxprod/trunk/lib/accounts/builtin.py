
import os, sys

from models import User, Group
from utils import genhash
import pprint

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
        try:
            u = User.get(User.username == username)
            if u.password == genhash(password):
                user = {
                    'id':u.id,
                    'username':u.username,
                    'name':u.name,
                    'group_id':u.group_id
                }
                return user
        except User.DoesNotExist:
            pass
        return False