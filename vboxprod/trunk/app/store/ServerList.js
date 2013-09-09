/*
 * store/NavTree
 */
Ext.define('vboxprod.store.ServerList', {
    extend: 'Ext.data.Store',
	autoLoad: false,
	model: 'vboxprod.model.VboxServer',
	proxy: {
        type: 'ajax',
        url : 'ajax.php',
        extraParams: {'service':'vboxservers','fn':'getServerList'},
        reader: {
        	type: 'AppJsonReader'
        }
    }
});