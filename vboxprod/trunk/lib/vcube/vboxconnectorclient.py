import threading, socket, sys, time, json, pprint
from urlparse import urlparse
import traceback

import logging
logger = logging.getLogger(__name__)
messageLogger = logging.getLogger(__name__ + '.messages')

class vboxRPCAction(object):
    
    location = None
    
    sock = None
    
    file = None
    
    error = None
    
    def __init__(self, url):
        
        try:
            url = urlparse(url)
    
        except Exception as e:
            logger.exception(str(e))
            self.error = str(e)
            return
        
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)        
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
            logger.exception(str(e))
            self.error = str(e)
            return
        
        self.response = self.file.readline()
        
        self.sock.close()
        self.file.close()
        
        self.message = json.loads(self.response)
        
        pprint.pprint(self.message)
        
        if self.message.get('msgType','') == '%s_response'%(method,):
            return self.message
        
        return False
        
        


class vboxRPCEventListener(threading.Thread):
    
    STATE_DISCONNECTED = 0
    STATE_ERROR = 20
    STATE_REGISTERING = 30
    STATE_RUNNING = 100
    
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
                
        self.onEvent = onEvent
        self.onStateChange = onStateChange
        
        # Initial state is disconnected
        self.onStateChange(self.id, self.STATE_DISCONNECTED, '')
        
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
            
            logger.debug("Trying to connect...")
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.sock.connect((url.hostname, url.port))
            
            self.file = self.sock.makefile()
            self.connected = True
            
            call = {
                'msgType' : 'registerStream',
                'service' : 'vboxEvents'
            }
            
            try:
                
                self.sock.sendall(json.dumps(call) + "\n")
    
                self.onStateChange(self.id, self.STATE_REGISTERING, '')
                
            except Exception as e:
                logger.exception(str(e))
                self.disconnect()
                return

                        
        except Exception as e:

            logger.exception("%s %s" %(self.server['location'], str(e)))

            # Error state
            self.onStateChange(self.id, self.STATE_ERROR, str(e))
            

            
    def disconnect(self):

        if self.sock:
            self.sock.close()
        
        if self.file:
            try:
                self.file._sock.close()
            except:
                pass
            self.file.close()
        
        self.connected = False
        self.sock = None
        self.file = None
        self.registered = False
    
    def stop(self):
        logger.debug("Stop requested")
        self.running = False
        self.disconnect()
        
        self.onStateChange(self.id, self.STATE_DISCONNECTED, '')

        
    def run(self):
        
        self.running = True
        
        while self.running:
            
            while not self.connected:
                
                if not self.running: break
                self.connect()
                if not self.running: break
                
                if not self.connected:
                    
                    for i in range(0,self.connectionRetryInterval):
                        if self.running: time.sleep(1)
                        else: break
            
            try:

                # This will block            
                logger.debug("Waiting for response")    
                response = self.file.readline()
                
                logger.debug("Got response %s" %(response,))
                
                # EOF
                if len(response) == 0 or response[-1] != "\n":
                    raise Exception('Connection closed')

            # assume disconnect by server
            except Exception as e:
                
                if self.file is not None:
                    logger.exception(str(e))
                
                # Error state
                if self.running:
                    self.onStateChange(self.id, self.STATE_ERROR, 'Connection closed - will attempt to reconnect')

                self.disconnect()
                
                continue
                
            try:
                message = json.loads(response)
            except Exception as e:
                logger.exception(str(e))
                continue
            
            messageLogger.debug("Got message: %s" %(message,))

            if message.get('msgType', '') == 'rpc_heartbeat':
                """ Discard heartbeats """
                continue

            if message.get('msgType','') == 'rpc_exception':
                """ Error... disconnect """
                self.onStateChange(self.id, self.STATE_ERROR, message.get('error', 'Unknown RPC error'))
                self.disconnect()
                continue

                
            if self.registered and message.get('event',None):
                """ When we're registered, we accept events """
                # add our id
                message['event']['connector'] = self.id     
                self.onEvent(message['event'])
                continue
                
            elif not self.registered and message.get('msgType','') == 'registerStream_response':
                """ Register stream response """

                self.registered = True
                
                # Running state
                self.onStateChange(self.id, self.STATE_RUNNING, '')

                continue
            
            
            time.sleep(self.pollInterval)
        
        self.disconnect()
