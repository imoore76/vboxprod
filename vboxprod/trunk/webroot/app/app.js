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
	
	/* Generic app items */
    name: 'vcube',
    
    autoCreateViewport: true,
    
    /* Various utils and scripts */
    requires: ['vcube.data.reader.Json', 'vcube.data.proxy.Ajax', 'Ext.ux.Deferred',
               'Ext.ux.form.plugin.FieldHelpText',
               'vcube.ExtPatches.ExtZIndexManager',
               'vcube.vmdatamediator', 'vcube.vmactions', 'vcube.eventlistener',
               'vcube.previewbox'],
    
    /* Controllers used by this app */
    controllers: [
                  // Main Views
                  'Viewport','Login','NavTree','MainPanel','Menubar','TasksAndEventsMain',
                  // VM Group tabs
                  'GroupTabs',
                  // Server Tabs
                  'ServerConnector', 'ServerHost', 'ServerTasksAndEvents',
                  // VM tabs
                  'VMTabs', 'VMSummary','VMDetails','VMSnapshots','VMTasksAndEvents','VMConsole'
                  
    ],
    
    
    /* Stores */
    stores: ['Events','Tasks'],
    
    // Load mask created on app init
    loadMask: null,
    
    settings : {},
    
    /* Progress operations to watch */
    progressOps : {},
    
    /* Task list to watch */
    taskList: {},
    
    /* Add progress operation to watch list */
    addProgress: function(pid) {
    	this.progressOps[pid] = true;
    },
    
    version: '0.3 beta',
    
    /* Check for progress operation completion */
    onProgressCompleted: function(event) {
    	
    	for(var i in this.progressOps) {
    		if(typeof(i) != 'string') continue;

    		if(i == event.eventData.progress) {
    			
    			if(event.eventData.canceled) {
    				vcube.utils.alert('Task `' + event.eventData.taskName + '` was canceled.');
    				
    			} else if(event.eventData.resultCode){
    				
    				vcube.utils.alert('Task `' + event.eventData.taskName +'` failed.<p>' + event.eventData.error+'</p>');
    			}
    			
    			delete this.progressOps[i];
    			return;
    		}
    	}
    	
    },
    
    /* Check for a task we wanted to be notified of */
    onTaskUpdate: function(event) {
    	
    	
    	
    },
    
    /* Notify of task update */
    notifyTask: function(task_id, promise) {
    	this.taskList[task_id] = promise;
    },
    
    
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
    
    /* Show loading screen */
    setLoading: function(loading) {
    	return;
    },
    
    // Show login box
    showLogin: function() {

    	Ext.create('vcube.view.Login', {id: 'login_form'}).show();
    	
    },
        
    // Constants
    constants: null,
    
    // User session data
    session: null,
    
    // Global server store
    serverStore: null,
	
    /**
     * Load session data
     */
    loadSession: function(sessionData) {
    	
    	var self = this;
    	
    	self.session = sessionData;
    	
    	if(self.session && self.session.user) {
    		
    		Ext.ux.Deferred.when(vcube.utils.ajaxRequest('app/getConstants')).done(function(constants){
    			
    			self.constants = constants;
    			
    			self.serverStore.load({
    				scope: this,
    				callback: function(r,o,success) {
    					if(!success) return;
    					Ext.ux.Deferred.when(vcube.eventlistener.start(this.fireEvent, this)).done(function(){
    						Ext.ux.Deferred.when(vcube.vmdatamediator.start()).done(function(){
    							if(!self.died) {
    								self.serverStore.load();
    								self.fireEvent('start');
    							}
    						});    			
    					});
    				}
    			})
    			
    		});
    		
    	} else {
    		self.showLogin();
    	}

    },
    
    onConnectorUpdated: function(eventData) {
    	this.serverStore.getById(eventData.connector_id).set(eventData.connector);
    },
    
    /**
     * Main application launch
     */
    launch: function() {

    	
    	this.on({
    		'ConnectorUpdated': this.onConnectorUpdated,
    		'ProgressCompleted': this.onProgressCompleted,
    		scope: this
    	});
    	
    	// Create some shortcuts
    	vcube.app = this;
    	
    	// App ref
    	var self = this;
    	
    	// Create server store
    	this.serverStore = Ext.create('Ext.data.Store',{
    		autoload: false,
    		fields : [
    		   {name: 'id', type: 'int'},
    		   {name: 'name', type: 'string'},
    		   {name: 'description', type: 'string'},
    		   {name: 'location', type: 'string'},
    		   {name: 'state_text', type: 'string'},
    		   {name: 'state', type: 'int'}
    		],
    		proxy: {
    			type: 'vcubeAjax',
    			url: 'connectors/getConnectors',
    	    	reader: {
    	    		type: 'vcubeJsonReader'
    	    	}
    		}
    	})

    	if (Ext.get('page-loader')) {
    		Ext.get('page-loader').remove();
    	}

    	vcube.utils.ajaxRequest('app/getSession',{},function(data){
    		self.loadSession(data);
    	});
    	
    }
});