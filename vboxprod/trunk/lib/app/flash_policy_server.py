
import SocketServer, threading


flash_policy = """
<cross-domain-policy>
     <allow-access-from domain="*" to-ports="*" />
</cross-domain-policy> 
"""

"""
    Flash policy request
"""
class RPCRequestHandler(SocketServer.BaseRequestHandler):

    def handle(self):
        # Create file object from socket so that
        # we can just call readline
        self.file = self.request.makefile()

        request = self.file.readline()
        
        self.send(flash_policy)

"""
    Flash policy server
"""
class FlashPolicyServer(SocketServer.ThreadingMixIn, SocketServer.TCPServer):
    allow_reuse_address = True
        

server_thread = None

def start(ip="0.0.0.0",port=843):
    
    global server_thread
    
    # Port 0 means to select an arbitrary unused port
    server = FlashPolicyServer((ip, port), RPCRequestHandler)

        # Start a thread with the server -- that thread will then start one
    # more thread for each request
    server_thread = threading.Thread(target=server.serve_forever)
    # Exit the server thread when the main thread terminates
    server_thread.daemon = True
    server_thread.start()

def stop():
    
    global server_thread
    
    if server_thread is None: return

    server_thread.shutdown()
    server_thread.join()
    server_thread = None
