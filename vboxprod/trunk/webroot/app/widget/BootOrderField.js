Ext.define('vcube.widget.BootOrderField', {
    extend: 'Ext.form.field.Base',
    mixins: {
        field: 'Ext.form.field.Field'
    },
    alias: 'widget.BootOrderField',
    layout: 'hbox',
    combineErrors: true,
    msgTarget: 'side',
    submitFormat: 'c',
        
    getValue: function() {
    	return '';
    },
    
    setValue: function(val) {
    },
    
    initComponent: function(options) {
    	
    	Ext.apply(this, options);
    	
    	this.items = [{
    		xtype: 'gridpanel',
    		height: 300,
			hideHeaders: true,
			/*
			store: Ext.create('Ext.data.Store',{
				fields: [{name:'enabled',type:'boolean',defaultvalue:false},{name:'name',type:'string'}],
				data: [{
					name: 'HardDisk'
				},{
					name: 'Network'
				},{
					name: 'Floppy'
				},{
					name: 'DVD'
				}]
			}),
			*/
			columns: [{
				dataIndex: 'enabled',
				xtype: 'checkcolumn'
			},{
				dataIndex: 'name',
				renderer: function(val) {
					var icon = '';
					switch(val) {
						case 'HardDisk': icon = 'hd'; break;
						case 'DVD': icon = 'cd'; break;
						case 'Floppy': icon = 'fd'; break;
						case 'Network': icon = 'nw'; break;
					}
					return '<div class="categoryColumn" style="background: url(../images/vbox/'+icon+'_16x.png)" />' + val;
				}
			}]
    	},{
    		/*
    		layout: 'vbox',
    		items: [{
    			xtype: 'button',
    			icon: 'images/vbox/list_moveup_16px.png'
    		},{
    			xtype: 'button',
    			icon: 'images/vbox/list_movedown_16px.png'    			
    		}]
    		*/
    		html: 'buttons'
    	}];
    	
	    
	    this.callParent(arguments);

    }
});