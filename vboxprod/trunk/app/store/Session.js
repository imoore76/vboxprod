Ext.define('vboxprod.store.Session', {
    extend: 'Ext.data.Store',
    fields: [ 'id', 'username', 'valid', 'admin' ],
    data: {id:'asdf',username:'ian',valid:true,admin:true},
    init: function(){
    	console.log("init session store");
    }
});