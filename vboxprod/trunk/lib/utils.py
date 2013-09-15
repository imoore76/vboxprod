"""
    Singleton meta class
"""
from threading import Lock

class Singleton(type):
    
    _lock = Lock()
    _instances = {}
    
    def __call__(cls, *args, **kwargs):
        cls._lock.acquire(True)
        try:
            if cls not in cls._instances:
                cls._instances[cls] = super(Singleton, cls).__call__(*args, **kwargs)
        except:
            cls._lock.release()
            raise
        
        cls._lock.release()
        return cls._instances[cls]
    

def genhash(key):
    import hashlib
    return hashlib.sha224(key).hexdigest()
