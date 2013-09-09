Ext.define('vboxprod.store.Config', {
    extend: 'Ext.data.Store',
    model: 'vboxprod.model.Config',
    data: {id:'asdf',username:'ian',valid:true,admin:true},
    init: function(){
    	//console.log("init Config store");
    }
});