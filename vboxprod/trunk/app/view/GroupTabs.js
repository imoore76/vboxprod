Ext.define('vboxprod.view.GroupTabs', {
    extend: 'Ext.tab.Panel',
    alias: 'widget.GroupTabs',
    defaults: {
    	border: false,
    	layout: 'fit',
    	padding: 5
    },    
    items: [{
        title: 'Group Tab 1'
    }, {
        title: 'Group Tab 2',
        tabConfig: {
            title: 'Custom Title',
            tooltip: 'A button tooltip'
        }
    }]
});