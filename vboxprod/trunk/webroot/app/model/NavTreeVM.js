Ext.define('vcube.model.NavTreeVM', {
    extend: 'Ext.data.Model',
    fields: [ 'id', 'name', 'state', 'OSTypeId', 'group_id', 'sessionState', 'icon' ],
    belongsTo: 'NavTreeGroup',
    init: function(){
    	//console.log("init NavTreeVM model");
    }
});