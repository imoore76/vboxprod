/*
 * store/NavTree
 */
Ext.define('vboxprod.store.NavTreeGroups', {
    extend: 'Ext.data.TreeStore',
	autoLoad: false,
	remoteSort: false,
	sorters: [{
		property: 'order'
	}],
	proxy: {
        type: 'ajax',
        url : 'data/groups.json',
        reader: {
        	type: 'json',
        	root: 'responseData'
        }
    }
});