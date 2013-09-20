# -*- coding: utf-8 -*-
import logging
import socket
import time
import threading
import types
import inspect
import traceback
import pprint

# For HTTP date header
from wsgiref.handlers import format_date_time
from datetime import datetime

# Fake HTTP request object's writing socket
import socket as dummySocket
def fakeSend(*args,**kwargs): return len(args[0])
dummySocket.send = fakeSend


import cherrypy
from cherrypy import Tool
from cherrypy.process import plugins
from cherrypy.wsgiserver import HTTPConnection, HTTPRequest


logger = logging.getLogger('WebStream')

__all__ = ['WebStream', 'WebStreamTool', 'WebStreamPlugin']

class WebStream(object):
    """ Represents a webstream endpoint and provides a high level interface to drive the endpoint. """

    def __init__(self, connection):
        
        self.connection = connection
        """
        Underlying connection.
        """

        self.terminated = False
        """
        Indicates if the connection has been terminated.
        """

    def send(self, data):
        """
        Sends the given ``data`` out.

        """
        if self.terminated or self.connection is None:
            raise RuntimeError("Cannot send on a terminated webstream")

        # Emulate chunked transfer encoding
        try:
            self.connection.sendall("%x\r\n%s\r\n" %(len(data), data))
        except Exception as e:
            # Can't write to socket, terminate
            self.terminate()
            
            

    def terminate(self):
        """
            Terminate processing
        """
        self.terminated = True

        """
        Shutdowns then closes the underlying connection.
        """
        if self.connection:
            try:
                self.connection.shutdown(socket.SHUT_RDWR)
                self.connection.close()
            finally:
                self.connection = None


"""
    Initiates handlers when a relevant request comes
    into cherry.py
"""
class WebStreamTool(Tool):
    
    
    def __init__(self):
        Tool.__init__(self, 'before_request_body', self.stream)

    def _setup(self):
        conf = self._merged_args()
        hooks = cherrypy.serving.request.hooks
        p = conf.pop("priority", getattr(self.callable, "priority",
                                         self._priority))
        hooks.attach(self._point, self.callable, priority=p, **conf)
        hooks.attach('before_finalize', self.complete,
                     priority=p)
        hooks.attach('on_end_request', self.start_handler,
                     priority=70)
        
        

    def stream(self):
        """
            Sets up web stream handler
        """
        
        request = cherrypy.serving.request
        request.process_request_body = False

        response = cherrypy.serving.response
        
        # For logging
        addr = (request.remote.ip, request.remote.port)
        
        conn = request.rfile.rfile._sock
        request.ws_handler = WebStream(conn)
        
    def complete(self):
        """
        Sets some internal flags of CherryPy so that it
        doesn't close the socket down.

        CherryPy has two internal flags that we are interested in
        to enable WebStream within the server. They can't be set via
        a public API and considering I'd want to make this extension
        as compatible as possible whilst refraining in exposing more
        than should be within CherryPy, I prefer performing a bit
        of introspection to set those flags. Even by Python standards
        such introspection isn't the cleanest but it works well
        enough in this case.

        This also means that we do that only on WebStream
        connections rather than globally and therefore we do not
        harm the rest of the HTTP server.
        """
        
        current = inspect.currentframe()
        while True:
            if not current:
                break
            _locals = current.f_locals
            if 'self' in _locals:
               if type(_locals['self']) == HTTPRequest:
                   _locals['self'].close_connection = True
               if type(_locals['self']) == HTTPConnection:
                   
                   _locals['self'].linger = True
                   _locals['self'].wfile._sock = None
                   _locals['self'].wfile._sock = dummySocket
                   
                   # HTTPConnection is more inner than
                   # HTTPRequest so we can leave once
                   # we're done here
                   return
            _locals = None
            current = current.f_back
            

    def start_handler(self):
        """
        Runs at the end of the request processing by calling
        the opened method of the handler.
        """
        request = cherrypy.request
        if not hasattr(request, 'ws_handler'):
            return

        ws_handler = request.ws_handler
        request.ws_handler = None
        delattr(request, 'ws_handler')

        # By doing this we detach the socket from
        # the CherryPy stack avoiding memory leaks
        request.rfile.rfile._sock = None
        
        # Print HTTP header
        headerLines = ['HTTP/1.1 200 OK',
                       'Date: %s' %(format_date_time(time.mktime(datetime.now().timetuple())),),
                       'Content-Type: application/json',
                       'Server: webstreamer via CherryPy/%s' %(cherrypy.__version__,),
                       'Transfer-Encoding: chunked']

        ws_handler.connection.sendall("\r\n".join(headerLines) + "\r\n\r\n")
        

        # Send event
        cherrypy.engine.publish('handle-webstream', ws_handler)


""""
    Provides access between all handlers and WebStreamManager
"""
class WebStreamPlugin(plugins.SimplePlugin):
    
    def __init__(self, bus):
        plugins.SimplePlugin.__init__(self, bus)
        self.manager = WebStreamManager()

    def start(self):
        cherrypy.log("Starting WebStream processing")
        self.bus.subscribe('stop', self.cleanup)
        self.bus.subscribe('handle-webstream', self.handle)
        self.bus.subscribe('webstream-broadcast', self.broadcast)

    def stop(self):
        cherrypy.log("Terminating WebStream processing")
        self.bus.unsubscribe('stop', self.cleanup)
        self.bus.unsubscribe('handle-webstream', self.handle)
        self.bus.unsubscribe('webstream-broadcast', self.broadcast)

    def handle(self, ws_handler):
        """
        Tracks the provided handler.
        """
        self.manager.add(ws_handler)

    def cleanup(self):
        """
        Terminate all connections and clear the pool. Executed when the engine stops.
        """
        self.manager.close_all()

    def broadcast(self, message):
        self.manager.broadcast(message)


class WebStreamManager():
    
    handlerLock = threading.Lock()
    """
        Threadsafe lock for manipulating managed handlers
    """
    
    handlers = {}
    """
        List of managed handlers
    """
    
    def add(self, handler):
        """
            Add handler to list
        """
        self.handlerLock.acquire(True)
        hid = 'handler-%s' %(id(handler),)
        try:
            self.handlers[hid] = handler
        finally:
            self.handlerLock.release()
    
    
    def close_all(self):
        """
            Close all managed handlers
        """
        self.handlerLock.acquire(True)
        try:
            for h in self.handlers.values():
                try:
                    h.terminate()
                except Exception as e:
                    traceback.print_exc()
                    pprint.pprint(e)
        finally:
            self.handlerLock.release()                
        self.running = False
    
    
    def broadcast(self, message):
        """
            Broadcast message to all managed handlers
        """
        self.handlerLock.acquire(True)
        try:
            closedList = []
            
            for k, h in self.handlers.iteritems():
                
                if h.terminated:
                    closedList.append(k)
                    continue
            
                try:
                    h.send(message)
                except Exception as e:
                    traceback.print_exc()
                    pprint.pprint(e)
            
            for hid in closedList:
                del self.handlers[hid]
                
        finally:
            self.handlerLock.release()
            
    
