
from peewee import *

import vcube

INSTALLMODELS = ['AuthUser', 'Group', 'VMGroup', 'Connector', 'AppConfig']

dbconfig = {}
dbname = ''
for k,v in vcube.getConfig().items('storage'):
    if k == 'db': dbname = v
    else: dbconfig[k] = v
dbconfig['threadlocals'] = True

db = MySQLDatabase(dbname,**dbconfig)

class MySqlModel(Model):
    class Meta:
        database = db

class User(MySqlModel):
    
    id = PrimaryKeyField()
    username = CharField(unique = True, max_length=32, null = False)
    name = CharField(max_length=128)
    group_id = IntegerField(default = 0)

class AuthUser(User):
    password = CharField(max_length=128, null = False)
    class Meta:
        database = db
        db_table = 'User'
    

class Group(MySqlModel):
    
    id = PrimaryKeyField()
    name = CharField(unique = True, max_length=32, null = False)
    description = CharField(max_length=256)
    
    
class VMGroup(MySqlModel):

    id = PrimaryKeyField()
    name = CharField(unique = True, max_length=32, null = False)
    description = CharField(max_length=256, null = True)
    parent_id = IntegerField(default = 0)
    order = IntegerField(default = 0)
    
    
class Connector(MySqlModel):

    id = PrimaryKeyField()
    name = CharField(unique = True, max_length=32, null = False)    
    location = CharField(max_length=256, null = False)
    description = CharField(max_length=256, null = True, default='')
    status = IntegerField(default = 0)
    status_text = CharField(max_length=256, null = True, default='')
    
    
class AppConfig(MySqlModel):
    
    id = PrimaryKeyField()
    name = CharField(unique = True, max_length=32)
    value = CharField(max_length=256)
