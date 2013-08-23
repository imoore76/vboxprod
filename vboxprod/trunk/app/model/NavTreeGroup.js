Ext.define('vboxprod.model.NavTreeGroup', {
    extend: 'Ext.data.TreeModel',
    fields: [ 'id', 'name', 'description', 'location', 'parent_id'],
    
    associations: [{
        type: 'hasMany',
        model: 'vboxprod.model.NavTreeGroup',
        primaryKey: 'id',
        foreignKey: 'parent_id',
        autoLoad: true,
        associationKey: 'children' // read child data from child_groups
    /*}, {
        type: 'belongsTo',
        model: 'vboxprod.model.NavTreeGroup',
        primaryKey: 'id',
        foreignKey: 'parent_id',
        /*autoLoad: true/*,
        associationKey: 'parent_group' // read parent data from parent_group*/
    }]
    init: function(){
    	console.log("init NavTreeGroup model");
    }
});