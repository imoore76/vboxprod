import socket
import threading
import SocketServer
import json
import time
import traceback

#msg = """{"msg": "\n    \nclass ThreadedTCPRequestHandler(SocketServer.BaseRequestHandler):\n\n    def handle(self):\n        data = self.request.recv(1024)\n        cur_thread = threading.current_thread()\n        response = \"{}: {}\".format(cur_thread.name, data)\n        self.request.sendall(response)\n\nclass ThreadedTCPServer(SocketServer.ThreadingMixIn, SocketServer.TCPServer):\n    pass\n\ndef client(ip, port, message):\n    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\n    sock.connect((ip, port))\n    try:\n        sock.sendall(message)\n        response = sock.recv(1024)\n        print \"Received: {}\".format(response)\n    finally:\n        sock.close()\n\nif __name__ == \"__main__\":\n    # Port 0 means to select an arbitrary unused port\n    HOST, PORT = \"localhost\", 0\n\n    server = ThreadedTCPServer((HOST, PORT), ThreadedTCPRequestHandler)\n    ip, port = server.server_address\n\n    # Start a thread with the server -- that thread will then start one\n    # more thread for each request\n    server_thread = threading.Thread(target=server.serve_forever)\n    # Exit the server thread when the main thread terminates\n    server_thread.daemon = True\n    server_thread.start()\n    print \"Server loop running in thread:\", server_thread.name\nclass ThreadedTCPRequestHandler(SocketServer.BaseRequestHandler):\n\n    def handle(self):\n        data = self.request.recv(1024)\n        cur_thread = threading.current_thread()\n        response = \"{}: {}\".format(cur_thread.name, data)\n        self.request.sendall(response)\n\nclass ThreadedTCPServer(SocketServer.ThreadingMixIn, SocketServer.TCPServer):\n    pass\n\ndef client(ip, port, message):\n    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\n    sock.connect((ip, port))\n    try:\n        sock.sendall(message)\n        response = sock.recv(1024)\n        print \"Received: {}\".format(response)\n    finally:\n        sock.close()\n\nif __name__ == \"__main__\":\n    # Port 0 means to select an arbitrary unused port\n    HOST, PORT = \"localhost\", 0\n\n    server = ThreadedTCPServer((HOST, PORT), ThreadedTCPRequestHandler)\n    ip, port = server.server_address\n\n    # Start a thread with the server -- that thread will then start one\n    # more thread for each request\n    server_thread = threading.Thread(target=server.serve_forever)\n    # Exit the server thread when the main thread terminates\n    server_thread.daemon = True\n    server_thread.start()\n    print \"Server loop running in thread:\", server_thread.name\nclass ThreadedTCPRequestHandler(SocketServer.BaseRequestHandler):\n\n    def handle(self):\n        data = self.request.recv(1024)\n        cur_thread = threading.current_thread()\n        response = \"{}: {}\".format(cur_thread.name, data)\n        self.request.sendall(response)\n\nclass ThreadedTCPServer(SocketServer.ThreadingMixIn, SocketServer.TCPServer):\n    pass\n\ndef client(ip, port, message):\n    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\n    sock.connect((ip, port))\n    try:\n        sock.sendall(message)\n        response = sock.recv(1024)\n        print \"Received: {}\".format(response)\n    finally:\n        sock.close()\n\nif __name__ == \"__main__\":\n    # Port 0 means to select an arbitrary unused port\n    HOST, PORT = \"localhost\", 0\n\n    server = ThreadedTCPServer((HOST, PORT), ThreadedTCPRequestHandler)\n    ip, port = server.server_address\n\n    # Start a thread with the server -- that thread will then start one\n    # more thread for each request\n    server_thread = threading.Thread(target=server.serve_forever)\n    # Exit the server thread when the main thread terminates\n    server_thread.daemon = True\n    server_thread.start()\n    print \"Server loop running in thread:\", server_thread.name\nclass ThreadedTCPRequestHandler(SocketServer.BaseRequestHandler):\n\n    def handle(self):\n        data = self.request.recv(1024)\n        cur_thread = threading.current_thread()\n        response = \"{}: {}\".format(cur_thread.name, data)\n        self.request.sendall(response)\n\nclass ThreadedTCPServer(SocketServer.ThreadingMixIn, SocketServer.TCPServer):\n    pass\n\ndef client(ip, port, message):\n    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\n    sock.connect((ip, port))\n    try:\n        sock.sendall(message)\n        response = sock.recv(1024)\n        print \"Received: {}\".format(response)\n    finally:\n        sock.close()\n\nif __name__ == \"__main__\":\n    # Port 0 means to select an arbitrary unused port\n    HOST, PORT = \"localhost\", 0\n\n    server = ThreadedTCPServer((HOST, PORT), ThreadedTCPRequestHandler)\n    ip, port = server.server_address\n\n    # Start a thread with the server -- that thread will then start one\n    # more thread for each request\n    server_thread = threading.Thread(target=server.serve_forever)\n    # Exit the server thread when the main thread terminates\n    server_thread.daemon = True\n    server_thread.start()\n    print \"Server loop running in thread:\", server_thread.name\nclass ThreadedTCPRequestHandler(SocketServer.BaseRequestHandler):\n\n    def handle(self):\n        data = self.request.recv(1024)\n        cur_thread = threading.current_thread()\n        response = \"{}: {}\".format(cur_thread.name, data)\n        self.request.sendall(response)\n\nclass ThreadedTCPServer(SocketServer.ThreadingMixIn, SocketServer.TCPServer):\n    pass\n\ndef client(ip, port, message):\n    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\n    sock.connect((ip, port))\n    try:\n        sock.sendall(message)\n        response = sock.recv(1024)\n        print \"Received: {}\".format(response)\n    finally:\n        sock.close()\n\nif __name__ == \"__main__\":\n    # Port 0 means to select an arbitrary unused port\n    HOST, PORT = \"localhost\", 0\n\n    server = ThreadedTCPServer((HOST, PORT), ThreadedTCPRequestHandler)\n    ip, port = server.server_address\n\n    # Start a thread with the server -- that thread will then start one\n    # more thread for each request\n    server_thread = threading.Thread(target=server.serve_forever)\n    # Exit the server thread when the main thread terminates\n    server_thread.daemon = True\n    server_thread.start()\n    print \"Server loop running in thread:\", server_thread.name\nclass ThreadedTCPRequestHandler(SocketServer.BaseRequestHandler):\n\n    def handle(self):\n        data = self.request.recv(1024)\n        cur_thread = threading.current_thread()\n        response = \"{}: {}\".format(cur_thread.name, data)\n        self.request.sendall(response)\n\nclass ThreadedTCPServer(SocketServer.ThreadingMixIn, SocketServer.TCPServer):\n    pass\n\ndef client(ip, port, message):\n    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\n    sock.connect((ip, port))\n    try:\n        sock.sendall(message)\n        response = sock.recv(1024)\n        print \"Received: {}\".format(response)\n    finally:\n        sock.close()\n\nif __name__ == \"__main__\":\n    # Port 0 means to select an arbitrary unused port\n    HOST, PORT = \"localhost\", 0\n\n    server = ThreadedTCPServer((HOST, PORT), ThreadedTCPRequestHandler)\n    ip, port = server.server_address\n\n    # Start a thread with the server -- that thread will then start one\n    # more thread for each request\n    server_thread = threading.Thread(target=server.serve_forever)\n    # Exit the server thread when the main thread terminates\n    server_thread.daemon = True\n    server_thread.start()\n    print \"Server loop running in thread:\", server_thread.name\n    "}"""

#json.loads(msg)

RPCHeartbeatInterval = 60

class ThreadedTCPRequestHandler(SocketServer.BaseRequestHandler):

    sendLock = threading.Lock()
    heartbeat = None
    file = None
    heartbeatTimer = None
    
    def send(self, message):
        
        response = json.dumps(message)

        self.sendLock.acquire(True)

        try:
            self.request.sendall(response+"\n")
        finally:
            self.sendLock.release()
            
    def handle(self):
        
        # Create file object from socket so that
        # we can just call readline
        self.file = self.request.makefile()
        
            
        class heartbeatrunner(threading.Thread):
            
            sendLock = None
            request = None
            timer = None
            running = False
            
            def __init__(self, handler):
                self.handler = handler
                threading.Thread.__init__(self)
                
            def shutdown(self):
                self.running = False
                
            def run(self):
                
                self.running = True
                
                global RPCHeartbeatInterval
                
                RPCHeartbeatMsg = {'msgType':'rpc_heartbeat','thread_id':str(threading.current_thread())}
                
                while self.running:
                    self.handler.send(RPCHeartbeatMsg)
                    for i in range(0, RPCHeartbeatInterval):
                        if self.running: time.sleep(1)

                
        streamingService = False
        
        try:
            
            while True:
                
                request = self.file.readline()
                response = {}
                
                try:
                    
                    # Ignore empty lines
                    if request.strip() == '': continue
                    
                    try:
                        message = json.loads(request)
                    except:
                        raise Exception("Invalid json request: %s" %(request))
                    
                    
                    service = message.get('service', None)
                    if not service:
                        raise Exception('No service specified') 

                    
                    """
                        RPC messages are a simple call / response
                    """
                    if message.get('msgType', '') == 'rpc':
                        
                        """ Create instance of service and call method """
                        serviceClass = self.server.getService(service)
                        if not serviceClass:
                            raise Exception("Unknown service: %s" %(service,))

                        serviceObj = serviceClass()
                        
                        method = message.get('method', None)
                        
                        if not method:
                            raise Exception("No method specified in rpc call: %s" %(request,))
                        

                        if not getattr(serviceObj, 'remote_%s' %(method,), None):
                            raise Exception("Service '%s' has no method named '%s'" %(service, method))
                        
                        try:
                            response = getattr(serviceObj, 'remote_%s' %(method,))(message.get('args',{}))
                            
                            # Format exceptions
                            errors = []
                            for e in serviceObj.errors:
                                errors.append({
                                    'error': '%s: %s'%(e[0].__class__.__name__, e[0].msg),
                                    'details': e[1]
                                })
                                
                            response = {
                                '%s_response'%(method,) : response,
                                'errors': errors,
                                'messages': serviceObj.messages,
                                'success': True
                            }
                            
                        except Exception as ex:
                            
                            response = {
                                '%s_response'%(method,) : False,
                                'errors': [{'msgType':'rpc_exception','details': traceback.format_exc(), 'error': '%s: %s'%(ex.__class__.__name__,ex.msg) }],
                                'messages': serviceObj.messages,
                                'success': False
                            }

                    
                    # Clients expect a stream from the service
                    elif message.get('msgType', '') == 'registerStream':

                        """ Get instance of service and register stream """
                        serviceObj = self.server.getService(service)
                        if not serviceObj:
                            raise Exception("Unknown service: %s" %(service,))

                        serviceObj.registerClient(self)
                        streamingService = True
                        response = {'msgType':'registerStream_response','registered':True}
                        
                        # Start heartbeat
                        self.heartbeat = heartbeatrunner(self)
                        self.heartbeat.start()

                        
                    else:
                        raise Exception("Invalid message type: %s" %(message.get('msgType',''),))
                    
                    
                except Exception as ex:
                    response = {'msgType':'rpc_exception','details': traceback.format_exc(), 'error': ex.__class__.__name__ + ': ' + ex.message}
                    

                self.send(response)
                
        except:
            # assume connection closed
            pass
         
        finally:
            
            # Unregister client?
            if streamingService and serviceObj:
                serviceObj.unregisterClient(self)
                
            # Stop heartbeat
            if self.heartbeat:
                self.heartbeat.shutdown()
                self.heartbeat.join()
            
        #cur_thread = threading.current_thread()
        #self.request.sendall(request)

class ThreadedRPCServer(SocketServer.ThreadingMixIn, SocketServer.TCPServer):
    
    allow_reuse_address = True
    
    services = {}
    
    def server_activate(self):
        self.services['server'] = self
        SocketServer.TCPServer.server_activate(self)
    
    def remote_shutdown(self, *args):
        self.shutdown()
        return True
            
    def registerService(self, name, service):
        self.services[name] = service
        
    def getService(self, name):
        return self.services.get(name, None)
    
if __name__ == "__main__":
    
    # Port 0 means to select an arbitrary unused port
    HOST, PORT = "localhost", 11032

    server = ThreadedRPCServer((HOST, PORT), ThreadedTCPRequestHandler)
    ip, port = server.server_address

    # Start a thread with the server -- that thread will then start one
    # more thread for each request
    server_thread = threading.Thread(target=server.serve_forever)
    # Exit the server thread when the main thread terminates
    server_thread.daemon = True
    server_thread.start()
    server_thread.join()

        