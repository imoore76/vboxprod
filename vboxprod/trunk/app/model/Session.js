Ext.define('vboxprod.model.Session', {
    extend: 'Ext.data.Model',
    fields: [ 'id', 'username', 'valid', 'admin' ],
    init: function(){
    	console.log("init Session model");
    }
});