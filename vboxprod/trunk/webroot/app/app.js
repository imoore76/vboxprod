/* Define Actions */
var vcubeActions = {
   'global' : {
      'vmm': {'text':'Virtual Media Manager...','icon':'images/vbox/diskimage_16px.png'},
      'importappliance' : {'text':'Import Appliance...','icon':'images/vbox/import_16px.png'},
      'exportappliance' : {'text':'Export Appliance...','icon':'images/vbox/export_16px.png'},
      'preferences' : {'text':'Preferences...','icon':'images/vbox/global_settings_16px.png'}
   }
}

/*
Ext.Loader.setConfig({
	enabled	: true,
	paths	: {
		vcube :"app"
	}
});

Ext.require('vcube.view.Login');
Ext.require('vcube.AppJsonReader');

 */
Ext.application({
	
    name: 'vcube',
    autoCreateViewport: true,
    
    requires: ['vcube.AppJsonReader'],
    
    controllers: ['Viewport','Login','NavTree','MainPanel','GroupTabs','VMTabs','Menubar'],
    
    views: ['Login'],
    
    // Fatal error
    _fatalErrorOccurred: false,
    
    // Load mask created on app init
    loadMask: null,
    
    // Alert
    alert: function(msg, dialogStyle) {
    	
    	new Ext.window.MessageBox().show({
    		title: "<div style='display:inline-block;width:16px;height:16px;background:url(images/vbox/OSE/about_16px.png) no-repeat;padding-left:20px'>"+this.name+"</div>",
    		msg: msg,
    		icon: Ext.MessageBox.ERROR,
    		modal: true,
    		buttonText: {ok:trans('OK')},
    		closeAction: 'destroy'
    	})
    	
    },
    
    // Listeners for application wide events
    listeners: {
    	login: function() {
    		//this.loadMask.hide();
    		console.log('ok');
    	}
    },
    
    // Stop the application - perform cleanup
    stop: function() {
    	this.fireEvent('stop');
    },
    
    // Ajax request handlers
    ajaxRequest: function(ajaxURL, addparams, callback) {
    	
    	// Halt if fatal error has occurred
    	if(this._fatalErrorOccurred) return;
    	
    	// Hold ref to this object
    	var self = this;
    	
    	// Add function to params
    	if(!addparams) addparams = {};
    	
    	Ext.Ajax.request({
    		
    		url: ajaxURL,
    		method: 'POST',
    		params: {},
    		jsonData: addparams,
    		
    		success: function(response){
    			
    			var data = Ext.JSON.decode(response.responseText).data;
    			
    			
    			
    			//console.log(data);
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
    			if(callback) callback(data.responseData);
    		},
    		failure: function(response, opts) {
    		   self.alert("Request failed: with status code " + response.status);
		   }
    	});       	
    },
    
    // Show login box
    showLogin: function() {

    	Ext.create('vcube.view.Login', {id: 'login_form'}).show();
    	
    },
        
    // User session data
    session: null,
    
    // Load session data and fire event
    loadSession: function(sessionData) {
    	this.session = sessionData;
    	this.fireEvent('start');
    },
    
    /**
     * 
     */
    setVboxServer: function(id) {
    	console.log("CHanging server to " + id);
    	this.vboxServerId = id;
    },
    
    launch: function() {

    	//this.loadMask = new Ext.LoadMask(Ext.ComponentQuery.query('viewport')[0]).show();
    	
    	// App ref
    	var self = this;

    	self.ajaxRequest('app/getSession',{},function(d){
    	
			self.session = d;
			
			if(self.session && self.session.user) self.fireEvent('start');
			else self.showLogin();

    	});
    	
    }
});