Ext.define('vcube.widget.MediaSelectButton',{
	
	alias: 'widget.MediaSelectButton',
	
	extend: 'Ext.button.Button',
	mediaType: 'cd', // One of cd / fd / hd
	
	margin: '2 0 0 4',
		
	callback: null,
	serverId: null,
	
	scope: null,
	
	browseMedia: function() {
		
	},
	
	setServer: function(serverId) {
		this.serverId = serverId;
		if(this.mediaType != 'hd') this.loadDrives();
	},
	
	updateMenu: function(media) {
		var empty = this.menu.down('#empty');
		if(!empty) return;
		empty.setDisabled(!media);
	},
	
	loadDrives: function() {
		
		var self = this;
		
		// Load host drives
		Ext.ux.Deferred.when(vcube.utils.ajaxRequest('vbox/hostGet'+(this.mediaType == 'fd' ? 'Floppy' : 'DVD') + 'Drives',{connector:this.serverId})).done(function(drives){
			self.menu.remove('hostdrives', true);
			console.log("Drives...");
			console.log(drives);
			Ext.each(drives, function(d) {
				self.menu.insert(1, {
					text: vcube.utils.vboxMedia.getName(d),
					_medium: d,
					handler: function(item) {
						self.callback.call(self.scope, item.initialConfig._medium);
						self.updateMenu(item.initialConfig._medium);
					},
					scope: self
				})
			});
		});
		
	},
	
	initComponent: function(config) {
		
		Ext.apply(this, config);
		
		switch(this.mediaType) {
		
			// Floppy media
			case 'fd':
				this.icon = 'images/vbox/fd_16px.png',
				this.menu = [{
					text: 'Choose a virtual floppy disk file...',
					icon: 'images/vbox/fd_16px.png'
				},{
					text: 'Loading host drives...',
					itemId: 'hostdrives'
				},
				'-',
				{
					text: 'Remove disk from virtual drive',
					itemId: 'empty',
					icon: 'images/vbox/fd_unmount_16px.png',
					handler: function() {
						this.callback.call(this.scope, null);
						this.updateMenu(null);
					},
					scope: this
				}];
				
				if(this.serverId) this.loadDrives();
				
				break;
				
			// CD/DVD media
			case 'cd':
				this.icon = 'images/vbox/cd_16px.png',
				this.menu = [{
					text: 'Choose a virtual CD/DVD disk file...',
					icon: 'images/vbox/cd_16px.png'
				},{
					text: 'Loading host drives...',
					itemId: 'hostdrives'
				},
				'-',
				{
					text: 'Remove disk from virtual drive',
					itemId: 'empty',
					icon: 'images/vbox/cd_unmount_16px.png',
					handler: function() {
						this.callback.call(this.scope, null);
						this.updateMenu(null);
					},
					scope: this
				}];
				
				if(this.serverId) this.loadDrives();
				break;
				
			// Hard disk
			default:
				this.icon = 'images/vbox/hd_16px.png',
				this.menu = [{
					text: 'Create a new hard disk...',
					icon: 'images/vbox/vdm_new_16px.png',
					handler: function() {
						
					},
					scope: this
				},{
					text: 'Choose a virtual hard disk file...',
					icon: 'images/vbox/hd_16px.png',
					handler: function() {
						
					},
					scope: this
				}]
		}
		
		this.callParent(arguments);
		
	}
});