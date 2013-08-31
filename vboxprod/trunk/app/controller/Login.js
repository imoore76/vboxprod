/* 
 * Login form controller
 */
Ext.define('vboxprod.controller.Login', {
	
    extend: 'Ext.app.Controller',
    
    refs : [{
    	selector: 'Login',
    	ref: 'LoginWindow',
    },{
    	selector: 'Login button',
    	ref: 'LoginButton'
    },{
    	selector: 'Login [name=loginUsername]',
    	ref: 'UsernameField'
    },{
    	selector: 'Login [name=loginPassword]',
    	ref: 'PasswordField'
    }],
    
    // Log in to app
    login: function() {
    	
    	var self = this;
    	
    	// only if submit buttin is enabled
    	if(this.getLoginButton().disabled) return;
    	
    	console.log('trynig to log in...');
    	
    	this.application.ajaxRequest('login',{u:this.getUsernameField().getValue(),
    		
    		p:this.getPasswordField().getValue()},function(data){
    			// This returns a session object wich must be valid
    			if(data && data.valid) {
    				self.getLoginWindow().hide();
    				self.application.loadSession(data);
    			} else {
    				self.application.alert('Invalid login');
    				self.getPasswordField().setValue('').focus();
    			}
    		});

    },
    
    init: function() {
    	
    	this.control({
    		
    		// Submit on enter
          'Login' : {
              show: function(thisForm, options){
            	  thisForm.keyNav = Ext.create('Ext.util.KeyNav', thisForm.el, {
                      enter: this.login,
                      scope: this
                  });
              }
          },
          'Login button' : {
        	  click: function(b) {
        		  this.login();
        	  }
          }
    	});
    }
});