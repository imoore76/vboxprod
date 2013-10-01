/*
 * Connector / virtualbox server model
 */
Ext.define('vcube.model.Connector', {
    extend: 'Ext.data.Model',
    fields: [
       {name:'id', type: 'int'},
       {name:'name', type: 'string'},
       {name:'description', type: 'string'},
       {name:'location', type: 'string'},
       {name:'status', type:'int'},
       {name:'status_name', type: 'string'},
       {name:'status_texg', type: 'string'}
    ]
});