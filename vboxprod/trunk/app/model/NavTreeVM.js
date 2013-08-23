Ext.define('vboxprod.model.NavTreeVM', {
    extend: 'Ext.data.Model',
    fields: [ 'id', 'name', 'state', 'OSTypeId', 'group_id', 'sessionState', 'customIcon' ],
    belongsTo: 'NavTreeGroup',
    init: function(){
    	console.log("init NavTreeVM model");
    }
});