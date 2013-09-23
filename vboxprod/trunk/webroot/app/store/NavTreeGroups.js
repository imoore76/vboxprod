/*
 * store/NavTree
 */
Ext.define('vcube.store.NavTreeGroups', {
    extend: 'Ext.data.TreeStore',
	autoLoad: false,
	remoteSort: true,
	proxy: {
        type: 'ajax',
        url : 'ajax.php',
        extraParams: {'service':'vmgroups','fn':'getGroupsList'},
        reader: {
        	type: 'AppJsonReader'
        }
    }
});