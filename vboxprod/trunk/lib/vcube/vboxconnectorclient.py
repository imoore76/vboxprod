import threading, pprint, socket, sys, time
from urlparse import urlparse

class vboxRPCAction(object):
    
    location = None
    
    sock = None
    
    file = None
    
    def __init__(self, server):
        
        try:
            url = urlparse(self.server['location'])
    
        except Exception as e:
            pprint.pprint(e)
            return
        
        self.sock.connect((url.hostname, url.port))
            
        self.file = self.sock.makefile()
        self.connected = True
        
    def rpcCall(self, method, args):
        
        call = {
            'msgType' : 'rpc',
            'service' : 'vbox',
            'method' : method,
            'args' : args
        }
        
        try:
            
            self.sock.sendall(json.dumps(call) + "\n")

        except Exception as e:
            pprint.pprint(e)
            return
        
        


class vboxRPCEventListener(threading.Thread):
    
    STATE_DISCONNECTED = 0
    STATE_RUNNING = 5
    STATE_ERROR = 20
    
    id = None
    server = None
    
    pollInterval = 0.2
    
    onEvent = None
    onStateChange = None
    
    sock = None
    file = None
    
    connected = False
    running = False
    registered = False
    
    connectionRetryInterval = 10
        
    def __init__(self, server, onEvent, onStateChange):
        
        self.server = server
        
        self.id = server['id']
        
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        
        self.onEvent = onEvent
        self.onStateChange = onStateChange
        
        # Initial state is disconnected
        self.onStateChange(self.id, self.STATE_DISCONNECTED)
        
        threading.Thread.__init__(self)
        
    def connect(self):
        
        
        try:
            url = urlparse(self.server['location'])
            
        except Exception as e:

            self.disconnect()            
            self.stop()

            # Error state
            self.onStateChange(self.id, self.STATE_ERROR, "Failed to parse server location %s" %(self.server['location']))
            
            return
        
        try:
            
            self.sock.connect((url.hostname, url.port))
            
            self.file = self.sock.makefile()
            self.connected = True
            
            call = {
                'msgType' : 'registerStream',
                'service' : 'vboxEvents'
            }
            
            try:
                
                self.sock.sendall(json.dumps(call) + "\n")
    
            except Exception as e:
                pprint.pprint(e)
                self.disconnect()
                return

            
            # RUnning state
            self.onStateChange(self.id, self.STATE_RUNNING)
            
        except Exception as e:

            # Error state
            self.onStateChange(self.id, self.STATE_ERROR, str(e))

            
    def disconnect(self):

        if self.sock:
            self.sock.close()
        
        self.connected = False
        self.sock = None
        self.registered = False
    
    def stop(self):
        self.running = False
        self.disconnect()
        
        self.onStateChange(self.id, self.STATE_DISCONNECTED)

        
    def run(self):
        
        self.running = True
        
        while self.running:
            
            while not self.connected:
                
                if not self.running: break
                self.connect()
                if not self.running: break
                
                if not self.connected:
                    for i in range(0,self.connectionRetryInterval):
                        if self.running: time.sleep(i)
                        else: break
            
            try:                
                response = self.file.readline()
                if response.strip() == '': continue
            
            # assume disconnect by server
            except Exception as e:
                
                # Error state
                if self.running:
                    self.onStateChange(self.id, self.STATE_ERROR, 'Connection closed')

                self.disconnect()
                
                break
                
            try:
                message = json.loads(response)
            except Exception as e:
                print "Invalid json response: %s" %(response)
                continue

            """ Expect a registered response """
            self.onEvent(message)
            
            time.sleep(self.pollInterval)
        
        self.disconnect()
