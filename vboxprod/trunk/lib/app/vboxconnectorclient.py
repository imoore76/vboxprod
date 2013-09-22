import threading, pprint, socket, sys, time
from urlparse import urlparse

class vboxAction():
    pass

class eventListener(threading.Thread):
    
    STATE_DISCONNECTED = -1
    STATE_RUNNING = 5
    STATE_ERROR = 20
    
    server = None
    
    id = None
    
    connected = False
    
    onEvent = None
    onStateChange = None
    
    sock = None
    
    file = None
    
    running = False
        
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
        
        print "here in connect"
        sys.stdout.flush()
        
        try:
            url = urlparse(self.server['location'])
            
        except Exception as e:
            pprint.pprint(e)
            print "Failed to parse server location %s" %(self.server['location'])
            sys.stdout.flush()
            
            # Error state
            self.onStateChange(self.id, self.STATE_ERROR)
            
            self.stop()
            return
        
        try:
            
            print "Trying to connect to %s:%s" %(url.hostname, url.port)
            sys.stdout.flush()
            self.sock.connect((url.hostname, url.port))
            print "Connected..."
            sys.stdout.flush()
            self.file = self.sock.makefile()
            self.connected = True
            
            # RUnning state
            self.onStateChange(self.id, self.STATE_RUNNING)
            
        except Exception as e:

            # Error state
            self.onStateChange(self.id, self.STATE_ERROR)

            pprint.pprint(e)
            
    def disconnect(self):
        print "here in disconnect"
        sys.stdout.flush()
        if self.sock:
            self.sock.close()
        self.connected = False
        self.sock = None
    
    def stop(self):
        self.running = False
        self.disconnect()
        
    def run(self):
        
        self.running = True
        
        while self.running:
            
            while not self.connected:
                
                if not self.running: break
                self.connect()
                if not self.running: break
                
                if not self.connected:
                    for i in range(0,10):
                        if self.running: time.sleep(i)
                        else: break
            
            try:                
                response = self.file.readline()
            
            # assume disconnect by server
            except Exception as e:
                pprint.pprint(e)
                self.disconnect()
                
                # Error state
                self.onStateChange(self.id, self.STATE_ERROR)

                break
                
            if response.strip() == '': continue
            
            try:
                message = json.loads(response)
            except Exception as e:
                print "Invalid json response: %s" %(response)
                continue

            self.onEvent(message)
            
            time.sleep(0.2)
        
        self.disconnect()
