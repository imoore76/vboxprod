/*
 * VirtualMachine model
 */
Ext.define('vcube.model.VirtualMachine', {
    extend: 'Ext.data.Model',
    fields: [
        {name:'id', type:'string'},
        {name:'name', type:'string'},
        {name:'lastStateChange', type: 'int'},
        {name:'accessible', type: 'boolean'},
        {name:'OSTypeDesc', type:'string'},
        {name:'currentSnapshotName', type:'string'},
        {name:'state', type:'string'},
        {name:'OSTypeId', type:'string'},
        {name:'sessionState', type:'string'},
        {name:'group_id', type:'int'},
        {name:'icon', type: 'string'},
        {name:'connector_id', type: 'int'}
    ]
});