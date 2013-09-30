Ext.define('vcube.model.vmdata', {
    extend: 'Ext.data.Model',
    fields: [ 'id', 'name', 'state', 'OSTypeId', 'owner', 'group', {name:'lastStateChange', type: 'int'},
              { name: 'currentStateModified', type: 'int'}, 'sessionState', 'currentSnapshotName',
              'icon' ],
    belongsTo: 'NavTreeGroup',
    init: function(){
    	//console.log("init vmdata model");
    }
});