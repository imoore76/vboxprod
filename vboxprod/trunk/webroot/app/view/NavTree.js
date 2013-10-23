 /* 
 * view/NavTree
 */
Ext.define('vcube.view.NavTree', {
    extend: 'Ext.tree.Panel',
    alias: 'widget.NavTree',
    
    statics: {
    	
    	/*
    	 * Generate VM tooltip
    	 */
    	vmTip: function(vm) {
    		
    	},
    	
    	/*
    	 * Generate server tooltip
    	 */
    	serverTip: function(server) {
    		
    	},
    	
    	/*
    	 * Generate group tooltip
    	 */
    	groupTip: function(group) {
    		
    	},
    	
    	/*
    	 * Generate VM node configuration
    	 */
    	vmNodeConfig: function(data) {
    		return {
    			cls : 'navTreeVM vmState'+ data.state+ ' vmSessionState' + data.sessionState
    					+ ' vmOSType' + data.OSTypeId,
    			text : data.name,
    			/*+ '<span class="navTreeVMState">'+
    				'<img src="images/vbox/'+vcube.utils.vboxMachineStateIcon(vm.state) +
    				'" height=16 width=16 valign=top style="margin-left: 24px"/></span>',*/
    			icon : (data.icon ? data.icon : 'images/vbox/' + vcube.utils.vboxGuestOSTypeIcon(vmData.OSTypeId)),
    			iconCls : 'navTreeIcon'
    		};
    	},
    	
    	/*
    	 * Generate VM group node configuration
    	 */
    	vmGroupNodeConfig: function(data) {
    		return {
    			iconCls : 'navTreeIcon',
    			text : Ext.String.htmlEncode(data.name)
    		};
    	},
    	
    	/*
    	 * Generate server node config
    	 */
    	serverNodeConfig: function(data) {
    		return {
    			iconCls : 'navTreeIcon',
    			icon : 'images/vbox/OSE/VirtualBox_cube_42px.png',
    			text : Ext.String.htmlEncode(data.name)
    					+ ' (<span class="navTreeServerStatus">'
    					+ vcube.app.constants.CONNECTOR_STATES_TEXT[data.state]
    					+ '</span>)'
    		}
    	},
    	
    	/*
    	 * Generate "Servers" node config
    	 */
    	serversNodeConfig: function() {
    		return {
    			cls : 'navTreeFolder',
    			text : 'Servers'    			
    		};
    	},
    	
    	/*
    	 * Generate "Virtual Machines" node config
    	 */
    	vmsNodeConfig: function() {
    		return {
    			cls : 'navTreeFolder',
    			text : 'Virtual Machines'		
    		}
    	},
    	
    	machineContextMenuItems: [
    	
    	    // settings
    		vcube.actionpool.getAction('machine','settings'),
    		// clone
    		vcube.actionpool.getAction('machine','clone'),
    		// remove
    		vcube.actionpool.getAction('machine','remove'),
    		'-',
    		// start
    		vcube.actionpool.getAction('machine','start'),
    		// pause
    		vcube.actionpool.getAction('machine','pause'),
    		// reset
    		vcube.actionpool.getAction('machine','reset'),
    		// stop
    		Ext.Object.merge({},vcube.actionpool.getActionsAsBase('machine',['stop'])[0],{
    			menu: vcube.actionpool.getActions('machine',['savestate','powerbutton','poweroff'])
    		}),
    		
    		'-',
    		// discard
    		vcube.actionpool.getAction('machine','discard'),
    		// show logs
    		vcube.actionpool.getAction('machine','logs'),
    		'-',
    		// refresh
    		vcube.actionpool.getAction('machine','refresh')
	]
    	
    	
    },
    
    width: 300,
    cls: 'vcubeNavTree',
    rootVisible: false,
    lines: false,
    useArrows: true,
    root: {
		allowDrag: false,
		allowDrop: false,
    	expanded: true
    },
    folderSort: true,
    viewConfig: {
    	markDirty:false,
    	plugins: {
	    	ptype: 'treeviewdragdrop',
	    	allowContainerDrop: false,
	    	allowParentInsert: false,
	    	ddGroup: 'navtreevms',
	    	appendOnly: true
    	}
	}
});
