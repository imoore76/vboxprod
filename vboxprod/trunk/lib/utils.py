"""
    Singleton meta class
"""
class Singleton(type):
    _instances = {}
    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super(Singleton, cls).__call__(*args, **kwargs)
        return cls._instances[cls]
    

"""
    Storage class
"""
class Storage(object):
    __metaclass__ = Singleton
    
"""
    Application configuration
"""
class AppConfig(object):
    __metaclass__ = Singleton