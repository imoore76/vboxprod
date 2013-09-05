Ext.define('vboxprod.model.NavTreeGroup', {
    extend: 'Ext.data.TreeModel',
    fields: [ 'id', 'name', 'description', 'location', {name: 'parent_id', type: 'int'}, {name: 'order', type: 'int'}],
    
    associations: [{
        type: 'hasMany',
        model: 'vboxprod.model.NavTreeGroup',
        primaryKey: 'id',
        foreignKey: 'parent_id',
        autoLoad: true,
        associationKey: 'children' // read child data from child_groups
    }]
    init: function(){
    	console.log("init NavTreeGroup model");
    }
});