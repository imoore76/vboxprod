/*
 * NavTree Controller
 */
Ext.define('vcube.controller.Menubar', {
    extend: 'Ext.app.Controller',
    
    // Hold nav tree ref so that we only have to get this once
    refs : [{
    	selector: 'viewport > Menubar',
    	ref: 'Menubar'
    },{
    	selector: 'viewport > Menubar #logout',
    	ref: 'LogoutItem'
    }],
    
    /* Watch for events */
    init: function(){
    	
    	/* Application level events */
        this.application.on({
            start: this.updateLogout, 
            scope: this
        });
        
        /* Tree events */
        this.control({
        	'NavTree' : {
        		select: this.selectItem
        	},
        	'viewport > Menubar menuitem' : {
        		click: this.itemClicked
        	}
        });
    },
    
    /* Menu item is clicked */
    itemClicked: function(item) {
    	
    	switch(item.itemId) {
    	
    		case 'logout':
    			this.application.stop();
    			this.application.ajaxRequest('app/Logout',{},function(){
    				location.reload(true);
    			});
    			break;
    	}
    },
    
    /* An item is selected */
    selectItem: function(row,record,index,eOpts) {
    	//console.log(record);
    },
    
    /* Populate navigation tree with groups and VMs */
    updateLogout: function() {
    	this.getLogoutItem().setText('Logout - ' + (this.application.session.user.name ? this.application.session.user.name : this.application.session.user.userid));
    }
    	
});