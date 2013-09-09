Ext.define('vboxprod.store.Config', {
    extend: 'Ext.data.Store',
    fields: [],
    init: function(){
    	// console.log("init Config store");
    },
    listeners: {
    	load: function(store,records,success) {var fields = [];
    		var config = store.getAt(0);
    		
    	}
    },
    proxy: {
        type: 'ajax',
        url: 'ajax.php',
        extraParams: {
        	fn: 'getConfig',
        	service: 'app'
        },
        reader: {
            type: 'AppJsonReader'
        }
    }

});