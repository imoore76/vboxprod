/*
 * VirtualMachinegroup  model
 */
Ext.define('vcube.model.VMGroup', {
    extend: 'Ext.data.Model',
    fields: [
        {name:'id', type:'int'},
        {name:'name', type:'string'},
        {name:'description', type:'string'},
        {name:'parent_id', type:'int'}
    ]
});