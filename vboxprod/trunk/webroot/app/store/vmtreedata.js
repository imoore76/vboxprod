Ext.define('vcube.store.NavTreeVM', {
    extend: 'Ext.data.Store',
    model: 'vcube.model.NavTreeVM',
    belongsTo: 'NavTreeGroup',
    init: function(){
    	//console.log("init NavTreeVM model");
    }
});