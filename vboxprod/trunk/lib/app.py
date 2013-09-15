
import os, sys, ConfigParser, threading
import MySQLdb

print "Imported app"

global config, app

# Read config 
config = ConfigParser.SafeConfigParser()
config.read(os.path.abspath(os.path.dirname(os.path.dirname(__file__))) + '/settings.ini')

def getConfig():
    return config

def getInstance():
    global app
    return app

def getDB():
    global config
    local = threading.local()
    if hasattr(local, 'db'):
        return local.db
    else:
        
        dbconfig = {}
        for k,v in config.items('storage'):
            dbconfig[k] = v
    
        db = MySQLdb.connect(**dbconfig)
        local.db = db
        return db


"""

    Application

"""
class Application:
        
    """
      * Error number describing a fatal error
      * @var integer
    """
    ERRNO_FATAL = 32
    
    """
     * Error number describing a connection error
     * @var integer
     """
    ERRNO_CONNECT = 64
    
    """
     * Default configuration items
     """
    configDefaults = {
        'dbType' : 'mysql',
        'accountsModule' : 'builtin'
    }
    
    accounts = None
    
    def __init__(self):

        import accounts
        __import__('accounts.' + self.getConfigItem('app','accountsModule') )
        self.accounts = getattr(accounts, self.getConfigItem('app','accountsModule')).interface()
        

    """
     * Return a configuration item or its default
     """
    def getConfigItem(self, section, item):
        try:
            return config.get(section, item)
        except:
            return self.configDefaults.get(item, None)    
            
    
    def run(self):
        pass
    

app = Application()