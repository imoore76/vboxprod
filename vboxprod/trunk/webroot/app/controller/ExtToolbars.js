/*
 * Toolbar Controller to hide text if hideText is set to true
 */
Ext.define('vcube.controller.ExtToolbars', {
	
	extend : 'Ext.app.Controller',
	
	/* Watch for toolbar render events */
	init : function() {

        /* Tree events */
        this.control({
        	'toolbar' : {
        		afterrender: this.removeText
        	}
        });

	},
	
	/* Remove text from all buttons */
	removeText: function(tbar) {
		if(tbar.initialConfig.hideButtonText) {
			Ext.each(tbar.items.items,function(item) {
				if(item.text) {
					item.setTooltip(item.text + ' &nbsp; ');
					item.setText('');
				}
			})
		}
	}

});