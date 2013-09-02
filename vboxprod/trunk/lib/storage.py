
import sqlite3
import os

def dict_factory(cur,row):
    d = {}
    for idx,col in enumerate(cur.description):
        d[col[0]] = row[idx]
    return d

class storage(object):
    
    _connection = None
    _connected = False
    
    _configOpts = ['file']
    _file = None
    
    def __init__(self, config):
        self.config = config
        for option in config:
            if option[0] not in self._configOpts:
                print "Unknown config option %s" % (option[0],)
            else:
                setattr(self, '_'+option[0], option[1])        
        self.connect()
    
    
    def connect(self):
        if self._connected: return True
        if not self._file.startswith('/'):
            self._file = os.path.dirname(os.path.dirname(os.path.realpath(__file__))) + '/' + self._file
        self._connection = sqlite3.connect(self._file,detect_types=True)
        self._connection.row_factory = dict_factory
        self._connected = True
        return True

    def query(self, query):
        
        with self._connection:    
    
            cur = self._connection.cursor()    
            cur.execute(query)

            return cur.fetchall()
    
    def query_affected(self, query):
        pass
    
    def get(self, query):
        pass
    
    def set(self, query):
        pass
    
    def insert(self, query):
        pass
    
    def delete(self, query):
        pass