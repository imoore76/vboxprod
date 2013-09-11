 /* 
 * view/NavTree
 */
Ext.define('vboxprod.view.NavTree', {
    extend: 'Ext.tree.Panel',
    alias: 'widget.NavTree',
    width: 300,
    tbar: [{
	 xtype: 'tbtext',
	 text: 'Server:'
   },{
	   xtype: 'combobox',
	   flex: 1,
	   editable: false,
	   store: 'ServerList',
	   itemId: 'serverlist',
	   displayField: 'name',
	   valueField: 'id',
	   queryMode: 'local'
   }],
    viewConfig:{
        markDirty:false
    },
    rootVisible: false,
    lines: false,
    useArrows: true,
    root: {
    	expanded: true
    }
});
