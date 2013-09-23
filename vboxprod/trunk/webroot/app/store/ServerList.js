/*
 * store/NavTree
 */
Ext.define('vcube.store.ServerList', {
    extend: 'Ext.data.Store',
	autoLoad: false,
	model: 'vcube.model.VboxServer',
	proxy: {
        type: 'ajax',
        url : 'ajax.php',
        extraParams: {'service':'vboxservers','fn':'getServerList'},
        reader: {
        	type: 'AppJsonReader'
        }
    }
});