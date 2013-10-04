/**
 * app ajax proxy
 */
Ext.define('vcube.AjaxProxy', {
    extend: 'Ext.data.proxy.Ajax',
    alias: 'proxy.vcubeAjax',
    config: {
    	listeners: {
    		exception: function(proxy, response, operation) {
    			
    			vcube.utils.alert({'error':"Operation `" + operation.request.proxy.url + "` failed (" + response.status + "): " + response.statusText,
    				'details':response.responseText});
    		},
    	},
    	type: 'ajax',
    	reader: {
    		type: 'vcubeJsonReader'
    	}    	
    }
});
