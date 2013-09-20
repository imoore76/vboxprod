from dispatchers import dispatcher_parent, jsonout, require_admin

import Queue
import cherrypy, pprint
import json, time

import app

class dispatcher(dispatcher_parent):
    
    def eventStream(self):
        
        cherrypy.response.headers['Content-Type'] = 'application/json'
        
        def getContent():
            
            eventQueue = Queue.Queue()
            eqid = app.getInstance().registerEventQueue(eventQueue)
            
            try:
                
                while True:
                    
                    while not eventQueue.empty():
                
                        event = eventQueue.get(False)
                        eventQueue.task_done()
                        
                        if event:

                            try:
                                event = json.dumps(event)
                            except:
                                pass
                            
                            yield event
                            
                    time.sleep(1)
                    
            finally:
                app.getInstance().unregisterEventQueue(eqid)
                
        return getContent()
    
    eventStream._cp_config = {'response.stream': True}
    eventStream.exposed = True