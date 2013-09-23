/*
 * store/NavTree
 */
Ext.define('vcube.store.NavTreeVMs', {
    extend: 'Ext.data.TreeStore',
	autoLoad: false,
	remoteSort: false,
	sorters: [{
		property: 'order'
	}],
	proxy: {
        type: 'ajax',
        url : 'data/vms.json',
        reader: {
        	type: 'json',
        	root: 'responseData'
        }
    }
});