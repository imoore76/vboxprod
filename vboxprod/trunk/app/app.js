/* Define Actions */
var vboxprodActions = {
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
		vboxprod :"app"
	}
});

Ext.require('vboxprod.view.Login');
Ext.require('vboxprod.AppJsonReader');

 */
Ext.application({
	
    name: 'vboxprod',
    autoCreateViewport: true,
    
    requires: ['vboxprod.AppJsonReader'],
    
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
    	}
    },
    
    // Stop the application - perform cleanup
    stop: function() {
    	this.fireEvent('stop');
    },
    
    // Ajax request handlers
    ajaxRequest: function(service, fn, addparams, callback) {
    	
    	// Halt if fatal error has occurred
    	if(this._fatalErrorOccurred) return;
    	
    	// Hold ref to this object
    	var self = this;
    	
    	// Add function to params
    	if(!addparams) addparams = {};
    	
    	Ext.Ajax.request({
    		
    		url: 'ajax.php',
    		method: 'POST',
    		params: {'fn':fn,'service':service},
    		jsonData: addparams,
    		
    		success: function(response){
    			
    			console.log({'fn':fn,'service':service,requestData:addparams});
    			
    			var data = Ext.JSON.decode(response.responseText);
    			
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
						
						// Handle fatal and connection errors
						if(data.errors[i].fatal || data.errors[i].connection) {
							
							// Multiple Servers check
							if(data.errors[i].connection) {
								
								self._fatalErrorOccurred = true;
								
								
								//$('#vboxPane').css({'display':'none'});
								
								s='';
								/*
								if(self.config.servers && self.config.servers.length) {
									var servers = self.config.servers;
									for(var a = 0; a < servers.length; a++) {
										servers[a] = "<a href='?server="+servers[a].name+"'>"+$('<div />').html(servers[a].name).text()+"</a>";
									}
									s = '<div style="display: block">'+trans('Server List','phpVirtualBox')+': '+servers.join(', ')+'</div>';
								}
								if(s) self.alert(s);
								self.alert(data.errors[i],{'width':'400px'});
								self.alert('<p>'+trans('An error occurred communicating with your vboxwebsrv. No more requests will be sent by phpVirtualBox until the error is corrected and this page is refreshedata. The details of this connection error should be displayed in a subsequent dialog box.','phpVirtualBox')+'</p>'+s,{'width':'50%'});
								*/
								
							
							// Ignore connection errors until we have config data unless this was a login attempt
							} else if(!data.errors[i].connection || fn == 'login') {
								
								// If we have config data, and the error is fatal, halt processing
								if(data.errors[i].fatal) { //} && self.config) {
									self._fatalErrorOccurred = true;
								}
	
								self.alert(data.errors[i],{'width':'400px'});
								
							}
							
						} else {
							
							// Error from normal request
							self.alert(data.errors[i],{'width':'400px'});
						}
						
					} // </ foreach error >
				
    			}
    			if(callback) callback(data.data.responseData);
    		}
    	});       	
    },
    
    // Show login box
    showLogin: function() {

    	Ext.create('vboxprod.view.Login', {id: 'login_form'}).show();
    	
    },
        
    // User session data
    session: null,
    
    // Load session data and fire event
    loadSession: function(sessionData) {
    	this.session = sessionData;
    	this.fireEvent('start');
    },
    
    launch: function() {

    	//this.loadMask = new Ext.LoadMask(Ext.ComponentQuery.query('viewport')[0]).show();
    	
    	// App ref
    	var self = this;
		self.ajaxRequest('app','getSession',{},function(d){
    	
			self.session = d;
			
			if(self.session && self.session.id) self.fireEvent('start');
			else self.showLogin();

    	});
    	
    }
});