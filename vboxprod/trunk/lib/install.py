
import app, models

from models import User
from utils import genhash 

def database(config):
        
    for m in models.INSTALLMODELS:
        getattr(models, m).create_table()
    
    # create dummy class
    from mysqlsession import MySQLSession

    db = app.getDB()

    cursor = db.cursor()
    cursor.execute(MySQLSession.SCHEMA % 'sessions')
    db.commit()
    
    # Insert admin user
    resetadmin(config)

def resetadmin(config):
    
    
    try:
        u = AuthUser.get(AuthUser.username == 'admin')
    except AuthUser.DoesNotExist:
        u = AuthUser()
        u.username = 'admin'
        u.name = 'Administrator'
        u.group_id = 0
    
    u.password = genhash('admin')
    u.save()
        