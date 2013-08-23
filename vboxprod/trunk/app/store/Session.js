Ext.define('vboxprod.store.Session', {
    extend: 'Ext.data.Store',
    model: 'vboxprod.model.Session',
    data: {id:'asdf',username:'ian',valid:true,admin:true},
    init: function(){
    	console.log("init session store");
    }
});