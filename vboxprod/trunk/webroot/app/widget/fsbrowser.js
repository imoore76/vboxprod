Ext.define('vcube.widget.fsbrowser',{
	
	extend: 'Ext.window.Window',
	alias: 'widget.fsbrowser',
	
	browserType: 'cd',
	
	layout: 'fit',
    width:400,
    height: 480,
    closable: true,
    modal: true,
    resizable: true,
    plain: true,
    border: false,
    
    buttonAlign: 'center',

	
	cdFileTypes : {
		text: 'All virtual optical disk files (*.dmg,*.iso,*.cdr)',
		exts : ['dmg','iso','cdr']
	},
	
	hdFileTypes : {
		text: 'All virtual hard drive files (*.vmdk,*.vdi,*.vhd,*.hdd,*.qed,*.qcow,*.qcow2,*.vhdx)',
		exts: ['vmdk','vdi','vhd','hdd','qed','qcow','qcow2','vhdx']
	},
	
	fdFileTypes : {
		text: 'All virtual floppy disk files (*.img,*.ima,*.dsk,*.flp,*.vfd)',
		exts: ['img','ima','dsk','flp','vfd']
	},
	
	allFileTypes : {
		text: 'All files (*.*)',
		exts: ['*']
	},
	

	fsObjectChosen: Ext.create('Ext.ux.Deferred'),
	
	browse: function(path) {
		
		var self = this;

		this.show();
		
		var expandPath = []
		var dsep = '/';
		var currentPath = [];
		
		if(path) {
			dsep = (path.indexOf('\\') > -1 ? '\\' : '/');
			expandPath = path.replace(/\\/g, '/').replace(/\/\//g,'/').split('/');
		}

		this.tree.setLoading(true);

		var getNodeId = function(path) {
			if(/^[a-zA-Z]:$/.test(path)) return path + dsep;
			return path;
		}
		
		
		var expandNode = function(nodeId) {
			try {				
				console.log("Nodeid 1 " + nodeId);
				nodeId = getNodeId(nodeId);
				console.log("Nodeid 2 " + nodeId);
				
				var nextNode = self.tree.getStore().getNodeById(nodeId);
				
				if(!nextNode) {
					self.tree.setLoading(false);
					return;
				}
				
				if(nextNode.get('leaf')) {
					self.tree.getSelectionModel().select([nextNode]);
					self.tree.getView().focusNode(nextNode);
					self.tree.setLoading(false);
					return;
				}
				
				nextNode.expand(false, function(){
					if(expandPath.length) {
						currentPath.push(expandPath.shift());
						expandNode(currentPath.join(dsep));
					} else {
						self.tree.getSelectionModel().select([nextNode]);
						self.tree.getView().focusNode(nextNode);
						self.tree.setLoading(false);
					}
				})
			} catch (err) {
				self.tree.setLoading(false);
			}
		}
		
		
		this.tree.getRootNode().expand(false, function() {

			if(expandPath.length) {
				
				currentPath.push(expandPath.shift());
				expandNode(currentPath[0]);
				
			} else {
				self.tree.setLoading(false);
			}
		});
		
	},
	
	initComponent: function(options) {
		
		Ext.apply(this, options);
		
		fileTypesOptions = []
		
		switch(this.browserType) {
		
			/* CD / DVD */
			case 'cd':
				this.icon = this.icon || 'images/vbox/cd_16px.png';
				this.title = this.title || 'Choose a virtual CD/DVD disk file...',
				fileTypesOptions.push(this.cdFileTypes); 
				break;
				
			/* Floppy */
			case 'fd':
				this.icon = this.icon || 'images/vbox/fd_16px.png';
				this.title = this.title || 'Choose a virtual floppy disk file...',
				fileTypesOptions.push(this.fdFileTypes);
				break;
				
			/* Disk */
			case 'hd':
				this.icon = this.icon || 'images/vbox/fd_16px.png';
				this.title = this.title || 'Choose a virtual hard disk file...',
				fileTypesOptions.push(this.hdFileTypes);
				break;
				
			/* Folders */
			case 'folder':
				this.icon = this.icon || 'images/folder_open.png';
				break;
				
		}
		
		if(this.browserType != 'folder')
			fileTypesOptions.push(this.allFileTypes);
		
		this.tree = Ext.create('Ext.tree.Panel',{
			rootVisible: false,
			root: {
				expanded: false
			},
			listeners: {
				selectionchange: function(sm, selection) {
					this.down('#ok').setDisabled(!selection.length || !((this.browserType == 'folder' && !selection[0].get('leaf')) || (this.browserType != 'folder' && selection[0].get('leaf'))));
				},
				itemdblclick: function() {
					if(!this.down('#ok').disabled)
						this.down('#ok').fireEvent('click');
				},
				scope: this
			},
			store: Ext.create('Ext.data.TreeStore',{
				nodeParam: 'path',
				autoLoad: false,
				fields: [
				         {name: 'leaf', type: 'boolean'},
				         {name:'expanded', type: 'boolean'},
				         'text','icon','iconCls',
				         {name: 'id', type: 'string', mapping: 'fullPath'}],
		     	proxy: {
		    		type: 'vcubeAjax',
		    		url: 'vbox/fsbrowser',
		    		extraParams: {'connector': this.serverId, 'fileTypes': (fileTypesOptions.length ? fileTypesOptions[0].exts : null)},
		        	reader: {
		        		type: 'vcubeJsonReader'
		        	}
		    	}
	
			})
		});
		
		this.items = [this.tree];

		this.buttons = [{
			text: 'OK',
			itemId: 'ok',
			disabled: true,
			handler: function(btn) {
				btn.up('.window').close();
				this.fsObjectChosen.resolve(this.tree.getSelectionModel().getSelection()[0].get('fullPath'));
			},
			scope: this
		},{
			text: 'Cancel',
			handler: function(btn) {
				btn.up('.window').close();
				this.fsObjectChosen.reject();
			},
			scope: this
		}];
		
		this.callParent(arguments);
		
	}
	
});