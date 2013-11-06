Ext.define('vcube.widget.selectfolder',{
	
	extend: 'Ext.button.Button',
	height: 20,
	width: 20,
	margin: 2,
	icon: 'images/vbox/select_file_16px.png',

	requires: ['vcube.widget.fsbrowser'],
	
	alias: 'widget.selectfolder',
	
	serverId: null,
	
	
	constructor: function(options) {
		
		console.log("OPtions");
		console.log(arguments);
		
		options = options || {};
		
		var selectHandler = options.handler;
		options.handler = null;
		
		var dlgTitle = options.title;
		options.title = null;
		
		var pathTypeOpt = options.pathType;
		options.pathType = null;
		
		Ext.apply(this, options);
		
		var self = this;
		this.handler = function() {
			
			var browser = Ext.create('vcube.widget.fsbrowser',{
				browserType: 'folder',
				serverId: self.serverId,
				title: dlgTitle || 'Select a folder...',
				pathType: pathTypeOpt
			});
			
			Ext.ux.Deferred.when(browser.browse()).done(function(folder) {
				selectHandler.call(self.scope, self, folder);
			});
		};
		
		
		this.callParent(arguments);
	}

});