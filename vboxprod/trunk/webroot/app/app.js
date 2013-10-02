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
    requires: ['vcube.jquery','vcube.JsonReader', 'vcube.AjaxProxy', 'Ext.ux.Deferred',
               'vcube.vmdatamediator', 'vcube.vmactions', 'vcube.eventlistener',
               'vcube.previewbox'],
    
    /* Controllers used by this app */
    controllers: ['Viewport','Login','NavTree','MainPanel','GroupTabs','Menubar',
                  'VMTabs','VMTabSummary','VMTabDetails','VMTabSnapshots','VMTabConsole'],
    
    /* Login window */
    views: ['Login'],
    
    // Load mask created on app init
    loadMask: null,
    
    // a fatal error has occurred, stop everything and display error
    died: false,
    fatalError: function(message) {    	
    	if(this.died) return;
    	this.died = true;
    	this.stop();
    	vcube.utils.alert("A fatal error has occurred: `" + message + "` - reload the page to try again.");
    },
    
    /* Stop the application - perform cleanup */
    stop: function() {
    	vcube.eventlistener.stop();
    	vcube.vmdatamediator.stop();
    	this.fireEvent('stop');
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
    		
    		vcube.jquery.when(vcube.eventlistener.start(this.fireEvent, this)).done(function(){
    			vcube.jquery.when(vcube.vmdatamediator.start()).done(function(){
    				if(!self.died)
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

    	vcube.utils.ajaxRequest('app/getSession',{},function(data){
    		self.loadSession(data);
    	});
    	
    }
});