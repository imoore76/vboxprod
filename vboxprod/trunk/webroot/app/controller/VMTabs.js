/*
 * VM Tabs Controller
 */
Ext.define('vcube.controller.VMTabs', {
    extend: 'Ext.app.Controller',
    
    models: ['Snapshot'],
    
    // Hold nav tree ref so that we only have to get this once
    refs : [{
    	selector: 'viewport > NavTree',
    	ref: 'NavTreeView'
    },{
    	selector: 'viewport > MainPanel > VMTabs',
    	ref: 'VMTabsView'
    }],
    
    /* Watch for events */
    init: function(){
    	
        /* Tree events */
        this.control({
        	'viewport > NavTree' : {
        		select: this.selectItem
        	}
        });
    },
    
    /* An item is selected */
    selectItem: function(row,record,index,eOpts) {

    	
    	// Only load if VM is selected
    	if(!record || !record.get('leaf'))
    		return;
    	
    	var tabPanel = this.getVMTabsView();
    	var summaryTab = tabPanel.getComponent('SummaryTab');
    	var detailsTab  = tabPanel.getComponent('DetailsTab');
    	
    	tabPanel.setLoading(true);
    	
    	//console.log('data...');
    	//console.log(record.raw.data);
    	
    	Ext.ux.Deferred.when(vcube.vmdatamediator.getVMDetails(record.raw.data.id)).done(function(data) {
    		
    		tabPanel.rawData = data;
    		
    		// Draw preview and resize panel
    		vboxDrawPreviewCanvas(document.getElementById('vboxPreviewBox'), null, 200, 150);
    		summaryTab.down('#PreviewPanel').doLayout();
    		
    		//summaryTab.getForm().setValues(data);
    		
    		summaryTab.down('#baseinfo').update(data);
    		//summaryTab.down('#state').update(record.raw);
    		
    		console.log("here...");
    		console.log(vcube.view.VMTabs.vboxVMDetailsSections);
    		for(var i in vcube.view.VMTabs.vboxVMDetailsSections) {
    			
    			if(typeof(i) != 'string') continue;
    			
    			var tableItems = [];
    			
    			// shortcuts
    			var section = vcube.view.VMTabs.vboxVMDetailsSections[i];
    			var rows = section.rows;

    			// Is rows a function?
    			if(typeof(rows) == 'function') rows = rows(data);


    			for(var i = 0; i < rows.length; i++) {
    				
    				// Check if row has condition
    				if(rows[i].condition && !rows[i].condition(data)) continue;
    				
    				// hold row data
    				var rowData = '';
    				
    				// Check for row attribute
    				if(rows[i].attrib) {
    					
    					if(!data[rows[i].attrib]) continue;
    					rowData = data[rows[i].attrib];
    				
    				// Check for row callback
    				} else if(rows[i].callback) {
    					rowData = rows[i].callback(data);

    				// Static data
    				} else {
    					rowData = rows[i].data;
    				}

    				tableItems.push({'html':rows[i].title});
    				tableItems.push({'html':rowData});
    				
					//$(table).append(__vboxDetailRow(rows[i].title, rowData, 'vboxDetailName' + (rows[i].indented ? ' vboxDetailNameIndent' : ''), rows[i].html));
    				
    			}

    			
    			
    			var sectionPanel = Ext.create('Ext.panel.Panel', {
    			    title: section.title,
    			    icon: 'images/vbox/' + section.icon,
    			    layout: {
    			    	type: 'table',
    			    	columns: 2
    			    },
    			    items: tableItems
    			});
    			detailsTab.add(sectionPanel);

    		}
    		
    		tabPanel.setLoading(false);
    	})

    	// Summary tab items


    	
    	

    }
    
 	
});