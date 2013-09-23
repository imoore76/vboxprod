
from vcube.dispatchers import dispatcher_parent, jsonout

vboxFunctionList = []

from connector import vboxConnector
for f in dir(vboxConnector):
    if f.startswith('remote_'): vboxFunctionList.append(f[7:])


class dispatcher(dispatcher_parent):
    
    def __getattr__(self, name):
        print "attr: %s" %(name,)
        if name in vboxFunctionList:
            setattr(self, name + '.exposed', True)
            print "Yep.... for %s" %(name,)
            return self.vboxAction
        raise AttributeError
    
    def vboxAction(self, action, **kwargs):
        print "Performing vbox action %s.." %(action,)
        
    @jsonout
    def getStuff(self, *args, **kwargs):
        return "asdf"
    
    getStuff.exposed = True
    
    def getMedia(self, *args, **kwargs):
        return "asdf"

# Monkeypatch self
"""
from connector import vboxConnector
for f in dir(vboxConnector):
    if f.startswith('remote_'):
        setattr(vcube.dispatchers.vbox.dispatcher, f[7:] + '.exposed', True)
"""
