Ext.define('vcube.controller.vmdatamediator', {
	
    extend: 'Ext.app.Controller',

    stores: ['NavTreeVM','NavTreeGroup'],
    
    init: function() {
    	console.log("Datamediator initialized...");
    	
    }

});