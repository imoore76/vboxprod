Ext.define('vboxprod.store.NavTreeVM', {
    extend: 'Ext.data.Store',
    model: 'vboxprod.model.NavTreeVM',
    belongsTo: 'NavTreeGroup',
    init: function(){
    	console.log("init NavTreeVM model");
    }
});