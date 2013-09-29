/**
 * Main vcube application
 */
Ext.Loader.setConfig({
    enabled: true,
    paths: {
        'Ext.ux':'extjs/ux',
        'vcube':'app'
    }
});

Ext.application({
	
    name: 'vcube',
    autoCreateViewport: true,
    
    /* Various utils and scripts */
    requires: ['vcube.AppJsonReader', 'Ext.ux.Deferred',
               'vcube.vmdatamediator', 'vcube.vmactions', 'vcube.eventlistener',
               'vcube.previewbox'],
    
    /* Controllers used by this app */
    controllers: ['Viewport','Login','NavTree','MainPanel','GroupTabs','VMTabs','Menubar'],
    
    /* Login window */
    views: ['Login'],
    
    // Load mask created on app init
    loadMask: null,
    
    /* Alert dialog */
    alert: function(msg, dialogStyle) {
    	
    	if( typeof(msg) == 'object' && msg['error'])
    		msg = msg.error + "<br />" + msg.details;
    		
    	
    	new Ext.window.MessageBox().show({
    		title: "<div style='display:inline-block;width:16px;height:16px;background:url(images/vbox/OSE/about_16px.png) no-repeat;padding-left:20px'>"+this.name+"</div>",
    		msg: msg,
    		icon: Ext.MessageBox.ERROR,
    		modal: true,
    		buttonText: {ok:vcube.utils.trans('OK')},
    		closeAction: 'destroy'
    	})
    	
    },
    
    /* Stop the application - perform cleanup */
    stop: function() {
    	vcube.eventlistener.stop();
    	vcube.vmdatamediator.stop();
    	this.fireEvent('stop');
    },
    
    // Ajax request handler
    ajaxRequest: function(ajaxURL, addparams, success_callback, failure_callback, context) {
    	
    	// Halt if fatal error has occurred
    	if(this._fatalErrorOccurred) return;
    	
    	// Hold ref to this object
    	var self = this;
    	
    	// Add function to params
    	if(!addparams) addparams = {};
    	
    	// Deferred object will be returned
    	var promise = Ext.create('Ext.ux.Deferred');
    	
    	Ext.Ajax.request({
    		
    		url: ajaxURL,
    		method: 'POST',
    		params: {},
    		jsonData: addparams,
    		
    		success: function(response){
    			
    			var data = Ext.JSON.decode(response.responseText).data;
    			    			
    			// Append debug output to console
    			if(data && data.messages && window.console && window.console.log) {
    				for(var i = 0; i < data.messages.length; i++) {
    					window.console.log(data.messages[i]);
    				}
    			}

    			// Errors
    			if(data.errors && data.errors.length) {
    				
    				for(var i = 0; i < data.errors.length; i++) {
						// Error from normal request
						self.alert(data.errors[i],{'width':'400px'});
					} // </ foreach error >
				
    			}
    			
    			if(data && data.responseData !== null) {
    				
    				promise.resolve(data.responseData, addparams, context);
    				
    				if(success_callback) {
    					success_callback(data.responseData, addparams, context);    				
    				}
    			} else {
    				promise.reject();
    			}
    		},
    		failure: function(response, opts) {
    		   self.alert("Request failed: with status code " + response.status);
    		   promise.reject();
    		   if(failure_callback) failure_callback()
		   }
    	});
    	
    	return promise;
    },
    
    // Show login box
    showLogin: function() {

    	Ext.create('vcube.view.Login', {id: 'login_form'}).show();
    	
    },
        
    // User session data
    session: null,
    
    /**
     * Load session data
     */
    loadSession: function(sessionData) {
    	
    	var self = this;
    	
    	self.session = sessionData;
    	
    	if(self.session && self.session.user) {
    		
    		Ext.ux.Deferred.when(vcube.eventlistener.start(this.fireEvent, this)).done(function(){
    			Ext.ux.Deferred.when(vcube.vmdatamediator.start()).done(function(){
    				self.fireEvent('start');    
    			});    			
    		});
    		
    	} else {
    		self.showLogin();
    	}

    },
    
    /**
     * Main application launch
     */
    launch: function() {

    	// Create some shortcuts
    	vcube.app = this;
    	
    	// App ref
    	var self = this;

    	self.ajaxRequest('app/getSession',{},function(data){
    		self.loadSession(data);
    	});
    	
    }
});