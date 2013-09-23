Ext.define('vcube.store.Config', {
    extend: 'Ext.data.Store',
    model: 'vcube.model.Config',
    data: {id:'asdf',username:'ian',valid:true,admin:true},
    init: function(){
    	//console.log("init Config store");
    }
});