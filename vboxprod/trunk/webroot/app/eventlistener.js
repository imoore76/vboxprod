/**
 * 
 * @fileOverview Event listener singleton. Provides vcube.eventlistener
 * @author Ian Moore (imoore76 at yahoo dot com)
 * @version $Id: eventlistener.js 554 2013-08-17 13:53:53Z imoore76 $
 * @copyright Copyright (C) 2010-2013 Ian Moore (imoore76 at yahoo dot com)
 */

/**
 * vcube.eventlistener
 * 
 * Polls vboxwebsrv for pending events and triggers
 * events on Ext.get('vboxPane')
 * 
 * @namespace vcube.eventlistener
 */
Ext.define('vcube.eventlistener', {

	singleton: true,
	
	// Not initially running
	running : false,
	
	// web socket
	ws: null,

	/**
	 *  Start event listener loop
	 *  @param {Array} vmlist - list of VM ids to subscribe to
	 */
	start : function(vmlist) {
		
		// Already started?
		if(vcube.eventlistener.running) return;
		
		vcube.eventlistener.running = true;
		
		var started = Ext.create('Ext.ux.Deferred');
		
		window.WEB_SOCKET_DEBUG = true
		window.WEB_SOCKET_SWF_LOCATION = "lib/web-socket-js/WebSocketMain.swf";

		vcube.eventlistener.ws = new WebSocket("ws://" + location.host + "/eventStream");
		vcube.eventlistener.ws.onmessage = function(e) {
			
			vcube.eventlistener.pumpEvent(JSON.parse(e.data));
		};
			  
		vcube.eventlistener.ws.onclose = function() {
			if(vcube.eventlistener.running) {
				vcube.eventlistener.running = false;
				vcube.app.fireEvent('vcubeEventListenerConnectionLost');
			}
		};
		  
		vcube.eventlistener.ws.onopen = function() {
			started.resolve();
		};
		
		return started;
	},
	
	/**
	 *  Stop event listener loop and unsubscribe from events
	 */
	stop : function() {
		
		vcube.eventlistener.running = false;
		vcube.eventlistener.ws.close();
	},

	/**
	 * Send out an event through main application
	 */
	pumpEvent: function(e) {
		
		
		// Discard heartbeats
		if(e['eventSource'] == 'vcube' && e['eventType'] == 'heartbeat')
			return;
		
		console.log(e);

		if(e['eventSource'] == 'vbox') {
			vcube.app.fireEvent('vbox' + e.eventType, e);			
		}
		vcube.app.fireEvent(e.eventType, e);
		
		
	}
	
});

