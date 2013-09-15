
import os, sys

from models import AuthUser, User, Group
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
        return dict(User.get(User.username == username)._data.copy())
    
    def getGroup(self, groupname):
        return dict(User.get(Group.name == name)._data.copy())
    
    def getUsers(self):
        return list(User.select().dicts())
    
    def getGroups(self):
        return list(Group.select().dicts())
    
    def changePassword(self, username, password):
        u = AuthUser.get(AuthUser.username == username)
        u.password = genhash(password)
        u.save()
        return True
    
    def updateUser(self, **updata):
        
        username = updata.get('username', None)
        if username is None: return False
        del updata['username']
        
        u = User.get(username == updata.get('username'))
        newpw = None
        del updata['username']
        for k, v in updata.iteritems():
            if k == 'password':
                newpw = v
                continue
            setattr(u, k, v)
        u.save()
        
        if newpw is not None:
            self.changePassword(username, newpw)
            
    def addGroup(self, name, description = ''):
        g = Group()
        g.name = name
        g.description = description
        g.save()
        return True
        
    def updateGroup(self, update):
        pass
    
    def deleteGroup(self, groupname):
        Group.get(name == groupname).delete()
        return True
    
    def deleteUser(self, username):
        User.get(name == username).delete()
        return True
    
    def authenticate(self, username, password):
        try:
            u = AuthUser.get(AuthUser.username == username and AuthUser.password == genhash(password))
            return self.getUser(username)
        except AuthUser.DoesNotExist:
            pass
        return False
    