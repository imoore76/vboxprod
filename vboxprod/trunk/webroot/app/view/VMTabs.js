/**
 * Virtual Machine tabs
 * 
 */

Ext.define('vcube.view.VMTabs', {
    
	extend: 'Ext.tab.Panel',
    
	alias: 'widget.VMTabs',
	
	vmData : {},
	
	requires: [
               'vcube.view.VMTabSummary',
               'vcube.view.VMTabDetails',
               'vcube.view.VMTabSnapshots',
               'vcube.view.VMTabConsole'
             ],
	
	statics: {
	
		/*
		 * Creates and returns a section table
		 */
		sectionTable: function(sectionCfg, data, name) {
		
			return Ext.create('Ext.panel.Panel', Ext.apply({
			    title: sectionCfg.title,
			    icon: 'images/vbox/' + sectionCfg.icon,
			    cls: 'vboxDetailsTablePanel',
			    itemId : name,
			    layout: {
			    	type: 'table',
			    	columns: 2
			    },
			    defaults: {
			    	bodyCls: 'vboxDetailsTable'
			    },
			    items: vcube.view.VMTabs.sectionTableRows(sectionCfg.rows, data)
			}, (sectionCfg.tableCfg ? sectionCfg.tableCfg : {})));

		},
		
		/*
		 * Return section table items
		 */
		sectionTableRows: function(rows, data) {
			
			// Is rows a function?
			if(typeof(rows) == 'function') rows = rows(data);
			
			var tableItems = [];
			for(var i = 0; i < rows.length; i++) {
				
				// Check if row has condition
				if(rows[i].condition && !rows[i].condition(data)) continue;
				
				// hold row data
				var rowData = '';
				
				// Check for row attribute
				if(rows[i].attrib) {
					
					if(!data[rows[i].attrib]) continue;
					rowData = data[rows[i].attrib];
				
				// Check for row renderer
				} else if(rows[i].renderer) {
					rowData = rows[i].renderer(data);

				// Static data
				} else {
					rowData = rows[i].data;
				}

				
				if(rows[i].title && !rowData) {
					tableItems.push({'html':rows[i].title, 'cls': 'vboxDetailsTableData', colspan: 2 , 'width': '100%'});
				} else {
					
					tableItems.push({'html':rows[i].title + (rows[i].title ? ':' : ''), 'cls': 'vboxDetailsTableHeader'});
					tableItems.push({'html':rowData, 'cls': 'vboxDetailsTableData' + (rows[i].indented ? ' vboxDetailsIndented' : ''), 'width': '100%'});
				}
				
				
			}
			return tableItems;

		}
	},
    defaults: {
    	border: false,
    	padding: 5
    },    
    items: [{
    	xtype: 'VMTabSummary'
    },{
    	xtype: 'VMTabDetails'
    },{
    	xtype: 'VMTabSnapshots'
    },{
    	xtype: 'EventsAndTasks',
    	title: 'Events and Tasks'
    },{
    	xtype: 'VMTabConsole'
    }]
});