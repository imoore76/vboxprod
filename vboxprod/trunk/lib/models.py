
from peewee import *

MODELS = ['User', 'Group', 'VMGroup', 'Connector', 'AppConfig']

class User(Model):
    
    id = PrimaryKeyField()
    username = CharField(unique = True, max_length=32, null = False)
    name = CharField(max_length=128)
    password = CharField(max_length=128, null = False)
    group_id = IntegerField(default = 0)
    
class Group(Model):
    
    id = PrimaryKeyField()
    name = CharField(unique = True, max_length=32, null = False)
    description = CharField(max_length=256)
    
class VMGroup(Model):

    id = PrimaryKeyField()
    name = CharField(unique = True, max_length=32, null = False)
    description = CharField(max_length=256)
    location = CharField(max_length=256)
    parent = ForeignKeyField('self', related_name = 'children')
    
    
class Connector(Model):

    id = PrimaryKeyField()
    name = CharField(unique = True, max_length=32, null = False)    
    ip = CharField(max_length=256, null = False)
    port = IntegerField()
    status = IntegerField(default = 0)    
    
class AppConfig(Model):
    
    id = PrimaryKeyField()
    name = CharField(unique = True, max_length=32)
    value = CharField(max_length=256)
