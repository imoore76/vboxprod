# -*- coding: utf-8 -*-
import logging
import socket
import time
import threading
import types
import inspect
import traceback
import pprint


import cherrypy
from cherrypy import Tool
from cherrypy.process import plugins
from cherrypy.wsgiserver import HTTPConnection, HTTPRequest

"""
from ws4py import WS_KEY, WS_VERSION
from ws4py.exc import HandshakeError, StreamClosed
from ws4py.streaming import Stream
from ws4py.messaging import Message, PongControlMessage
from ws4py.compat import basestring, unicode
"""

logger = logging.getLogger('ws4py')

__all__ = ['WebStream']

class WebStream(object):
    """ Represents a webstream endpoint and provides a high level interface to drive the endpoint. """

    def __init__(self, sock, environ=None):
        """ The ``sock`` is an opened connection
        resulting from the webstream handshake.

        If ``protocols`` is provided, it is a list of protocols
        negotiated during the handshake as is ``extensions``.

        If ``environ`` is provided, it is a copy of the WSGI environ
        dictionnary from the underlying WSGI server.
        """

        self.sock = sock
        """
        Underlying connection.
        """

        self.client_terminated = False
        """
        Indicates if the client has been marked as terminated.
        """

        self.server_terminated = False
        """
        Indicates if the server has been marked as terminated.
        """

        self.environ = environ
        """
        WSGI environ dictionary.
        """

        self._local_address = None
        self._peer_address = None

    @property
    def local_address(self):
        """
        Local endpoint address as a tuple
        """
        if not self._local_address:
            self._local_address = self.sock.getsockname()
            if len(self._local_address) == 4:
                self._local_address = self._local_address[:2]
        return self._local_address

    @property
    def peer_address(self):
        """
        Peer endpoint address as a tuple
        """
        if not self._peer_address:
            self._peer_address = self.sock.getpeername()
            if len(self._peer_address) == 4:
                self._peer_address = self._peer_address[:2]
        return self._peer_address

    def opened(self):
        """
        Called by the server when the stream handshake
        has succeeeded.
        """
        pass

    @property
    def terminated(self):
        """
        Returns ``True`` if both the client and server have been
        marked as terminated.
        """
        return self.client_terminated is True and self.server_terminated is True

    @property
    def connection(self):
        return self.sock

    def close_connection(self):
        """
        Shutdowns then closes the underlying connection.
        """
        if self.sock:
            try:
                self.sock.shutdown(socket.SHUT_RDWR)
                self.sock.close()
            except:
                pass
            finally:
                self.sock = None

    def received_message(self, message):
        """
        Called whenever a complete ``message``, binary or text,
        is received and ready for application's processing.

        The passed message is an instance of :class:`messaging.TextMessage`
        or :class:`messaging.BinaryMessage`.

        .. note:: You should override this method in your subclass.
        """
        pass

    def send(self, data):
        """
        Sends the given ``payload`` out.

        """
        if self.terminated or self.sock is None:
            raise RuntimeError("Cannot send on a terminated webstream")

        try:
            self.sock.sendall(data + "\n")
        except Exception as e:
            #print e.__class__.__name__
            pprint.pprint(e)
            traceback.print_exc()
            # Can't write to socket, terminate
            self.terminate()
            
            

    def terminate(self):
        """
        Completes the webstream by calling the `closed`
        method either using the received closing code
        and reason, or when none was received, using
        the special `1006` code.

        Finally close the underlying connection for
        good and cleanup resources by unsetting
        the `environ` and `stream` attributes.
        """

        self.client_terminated = self.server_terminated = True

        self.close_connection()

        # Cleaning up resources
        self.environ = None


    def run(self):
        """
        Performs the operation of reading from the underlying
        connection in order to feed the stream of bytes.

        We start with a small size of two bytes to be read
        from the connection so that we can quickly parse an
        incoming frame header. Then the stream indicates
        whatever size must be read from the connection since
        it knows the frame payload length.

        Note that we perform some automatic opererations:

        * On a closing message, we respond with a closing
          message and finally close the connection
        * We respond to pings with pong messages.
        * Whenever an error is raised by the stream parsing,
          we initiate the closing of the connection with the
          appropiate error code.

        This method is blocking and should likely be run
        in a thread.
        """
        self.sock.setblocking(True)

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

    def stream(self, handler_cls=WebStream):
        """
        Performs the stream of the connection to the WebStream
        protocol.

        The provided protocols may be a list of WebStream
        protocols supported by the instance of the tool.

        When no list is provided and no protocol is either
        during the stream, then the protocol parameter is
        not taken into account. On the other hand,
        if the protocol from the handshake isn't part
        of the provided list, the stream fails immediatly.
        """
        request = cherrypy.serving.request
        request.process_request_body = False

        response = cherrypy.serving.response
        response.stream = True
        response.headers['Content-Type'] = 'text/plain'

        addr = (request.remote.ip, request.remote.port)
        conn = request.rfile.rfile._sock
        request.ws_handler = handler_cls(conn,
                                         request.wsgi_environ.copy())

    def complete(self):
        """
        Sets some internal flags of CherryPy so that it
        doesn't close the socket down.
        """
        self._set_internal_flags()

    def start_handler(self):
        """
        Runs at the end of the request processing by calling
        the opened method of the handler.
        """
        request = cherrypy.request
        if not hasattr(request, 'ws_handler'):
            return

        addr = (request.remote.ip, request.remote.port)
        ws_handler = request.ws_handler
        request.ws_handler = None
        delattr(request, 'ws_handler')

        # By doing this we detach the socket from
        # the CherryPy stack avoiding memory leaks
        request.rfile.rfile._sock = None

        cherrypy.engine.publish('handle-webstream', ws_handler, addr)

    def _set_internal_flags(self):
        """
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
                   # HTTPConnection is more inner than
                   # HTTPRequest so we can leave once
                   # we're done here
                   return
            _locals = None
            current = current.f_back

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

    def handle(self, ws_handler, peer_addr):
        """
        Tracks the provided handler.

        :param ws_handler: webstream handler instance
        :param peer_addr: remote peer address for tracing purpose
        """
        self.manager.add(ws_handler)

    def cleanup(self):
        """
        Terminate all connections and clear the pool. Executed when the engine stops.
        """
        self.manager.close_all()

    def broadcast(self, message):
        """
        Broadcasts a message to all connected clients known to
        the server.

        :param message: a message suitable to pass to the send() method
          of the connected handler.
        :param binary: whether or not the message is a binary one
        """
        self.manager.broadcast(message)


class WebStreamManager():
    
    handlerLock = threading.Lock()
    handlers = {}
    
    def add(self, handler):
        self.handlerLock.acquire(True)
        hid = 'handler-%s' %(id(handler),)
        try:
            self.handlers[hid] = handler
        finally:
            self.handlerLock.release()
    
    def close_all(self):
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
            
    
