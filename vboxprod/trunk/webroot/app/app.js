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
    version: '0.3 beta',
    
    autoCreateViewport: true,
    
    /* Various utils and scripts */
    requires: [
               // Custom ajax and json
               'vcube.data.reader.Json',
               'vcube.data.proxy.Ajax',
               
               // Deferred object
               'Ext.ux.Deferred',
               
               // Actions
               'vcube.actionpool',
               
               'Ext.ux.form.plugin.FieldHelpText',
               'vcube.ExtOverrides.ExtZIndexManager',
               
               'vcube.storemanager',
               'vcube.vmdatamediator',
               'vcube.eventlistener'
               //,'vcube.previewbox'
           ],
    
    /* Controllers used by this app */
    controllers: [
                  
                  // Machine ctions controller
                  'machineactions',
                  
                  // Toolbar extension
                  'ExtToolbars',
                  
                  // Main Views
                  'Viewport','Login','NavTree','MainPanel','Menubar','TasksAndEventsMain',
                  
                  // Main vm list
                  'MainVirtualMachinesList',
                  
                  // VM Group tabs
                  'GroupTabs', 'GroupVirtualMachinesList',
                  
                  // Server Tabs
                  'ServerConnector', 'ServerHost', 'ServerTasksAndEvents', 'ServerVirtualMachinesList',
                  
                  // VM tabs
                  'VMTabs', 'VMSummary','VMDetails','VMSnapshots','VMTasksAndEvents','VMConsole'
                  
    ],
    
    /* Common views */
    views: ['common'],
    
    /* Stores */
    stores: ['Events','Tasks','VirtualMachines'],
    
    /* App Settings */
    settings : {},
    
    /* Task list to watch */
    taskWatchList: {},

    /* Add progress operation to watch list */
    watchTask: function(task_id) {
    	this.taskWatchList[task_id] = Ext.create('Ext.ux.Deferred');
    	return this.taskWatchList[task_id];
    },
    
    
    /* Check for a task we wanted to be notified of */
    taskLogWatch: function(event) {
    	
    	// We are watching this task
    	if(this.taskWatchList[event.eventData.id]) {
    		
    		switch(event.eventData.status) {
    		
    			case this.constants.TASK_STATUS['STARTED']:
    			case this.constants.TASK_STATUS['INPROGRESS']:
    				if(event.eventData.progress) {
    					this.taskWatchList[event.eventData.id].progressUpdate(event.eventData.progress.percent,
    							event.eventData.progress.details);
    				}
    				break;
    		
    			case this.constants.TASK_STATUS['COMPLETED']:
    				// resolve
    				this.taskWatchList[event.eventData.id].resolve();
    				break;
    			
    			case this.constants.TASK_STATUS['ERROR']:
    			
    				vcube.utils.alert('Task `' + event.eventData.name +'` failed.<p>' + event.eventData.details+'</p>');
    				this.taskWatchList[event.eventData.id].reject('task operation failed');
    				break;
    			
    			case this.constants.TASK_STATUS['CANCELED']:
    			
    				vcube.utils.alert('Task `' + event.eventData.name  + '` was canceled.');
    				this.taskWatchList[event.eventData.id].reject('task operation was canceled');
    				break;
    			
    			default:
    				vcube.utils.alert("Unkonwn task state " + event.eventData.status);
    			
    		}
    		
    		if (!(event.eventData.status < this.constants.TASK_STATUS_FIRST_STOPPED_STATE)) {
	
    			delete this.taskWatchList[event.eventData.id];
    		}
    		
    	}
    	
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
    	vcube.storemanager.stop();
    	vcube.eventlistener.stop();
    	vcube.vmdatamediator.stop();
    	this.fireEvent('stop');
    },
    
    // Show login box
    showLogin: function() {

    	Ext.create('vcube.view.common.Login', {id: 'login_form'}).show();
    	
    },
        
    // Constants
    constants: null,
    
    // User session data
    session: null,
    
    /**
     * Load session data
     */
    loadSession: function(sessionData) {
    	
    	var self = this;
    	
    	self.session = sessionData;
    	
    	if(self.session && self.session.user) {
    		
    		Ext.ux.Deferred.when(vcube.utils.ajaxRequest('app/getConstants')).done(function(constants){
    			
    			self.constants = constants;

    			
    			Ext.ux.Deferred.when(vcube.storemanager.start)
	    			.then(vcube.vmdatamediator.start)
    				.then(vcube.eventlistener.start)
					.then(function() {
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

    	/* Populate actions */
    	//this.populateActionPool();
    	
    	this.on({
    		'taskLogEntry': this.taskLogWatch,
    		'taskLogUpdate': this.taskLogWatch,
    		scope: this
    	});
    	
    	// Create some shortcuts
    	vcube.app = this;
    	
    	// App ref
    	var self = this;
    	
    	if (Ext.get('page-loader')) {
    		Ext.get('page-loader').remove();
    	}
    	
    	Ext.ux.Deferred.when(vcube.utils.ajaxRequest('app/getSession')).done(function(data){
    		self.loadSession(data);
    	});
    	
    }
});