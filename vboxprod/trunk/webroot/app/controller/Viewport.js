/*
 * Main Panel Controller
 */
Ext.define('vboxprod.controller.Viewport', {
    extend: 'Ext.app.Controller',
    
    laodMask: null,
    
    /* Watch for events */
    init: function(){
    	
    	var loadMask = null;
    	
        this.control({
        	'viewport' : {
    		   afterrender: function(v) {
    			   loadMask = new Ext.LoadMask({target:v,useMsg:false});
    			   loadMask.show();
    		   }
        	}
        	
        });
                
    	/* Application level events */
        this.application.on({
            start: function() {
            	loadMask.hide();
            },
 		   stop: function() {
			   loadMask.show();
		   }
        });

    } 	
});