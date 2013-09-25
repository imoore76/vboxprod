Ext.define('vcube.view.Welcome', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.Welcome',
    flex: 1,
    //bodyStyle: { background: '#999' },
    layout: {
    	type: 'vbox',
    	align: 'center',
    	pack: 'center'
    },
    items: [
       {
    	   html: '<div style="background: #000"><img src="images/vbox/welcome.png" width=320 height=268 /></div>',
    	   flex: 1
       }
    ]
});