/* Define Actions */
var vboxprodActions = {
   'global' : {
      'vmm': {'text':'Virtual Media Manager...','icon':'images/vbox/diskimage_16px.png'},
      'importappliance' : {'text':'Import Appliance...','icon':'images/vbox/import_16px.png'},
      'exportappliance' : {'text':'Export Appliance...','icon':'images/vbox/export_16px.png'},
      'preferences' : {'text':'Preferences...','icon':'images/vbox/global_settings_16px.png'}
   }
}

Ext.application({
    name: 'vboxprod',
    autoCreateViewport: true,
    stores: ['Session'],
    controllers: ['NavTree','MainPanel'],
    launch: function() {

    	var s = this.getSessionStore().getAt(0);
    	
    	if(!s.data || !s.data.valid) {
    		console.log('invlid session, load login');
    	}
    	console.log('valid session');
    	
    	this.fireEvent('login', s);
    	
    	
    }
});