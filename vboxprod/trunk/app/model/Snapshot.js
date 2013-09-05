Ext.define('vboxprod.model.Snapshot', {
    extend: 'Ext.data.TreeModel',
    fields: ['id', 'name', 'description', 'online', 'timeStamp',
             { name: 'expanded', type: 'boolean', defaultValue: true, persist: true }]
});