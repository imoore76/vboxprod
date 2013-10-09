Ext.define('vcube.grid.column',{});

/*
 * Event severity
 */
Ext.define('vcube.grid.column.EventSeverityColumn', {
    extend: 'Ext.grid.column.Column',
    alias: 'widget.eventseveritycolumn',
    header: 'Severity',
    dataIndex: 'severity',
	renderer: function(sev) {
		var name = 'Unknown';
		try {
			name = vcube.app.constants.SEVERITY_TEXT[sev];
		} catch(err) {
			name = 'Unknown';
		}
		return "<div class='severityColuumn severityColuumn" + sev + "'> </div>" + name;
	}
});

/*
 * Server column
 */
Ext.define('vcube.grid.column.ServerColumn', {
    extend: 'Ext.grid.column.Column',
    alias: 'widget.servercolumn',
    header: 'Server',
	dataIndex: 'connector',
	renderer: function(val) {
		try {
			return vcube.app.serverStore.findRecord('id',val).get('name');    					
		} catch (err) {
			return 'Unknown(' + val + ')';
		}
	},
	width: 150
});

/*
 * Task details with progress
 */
Ext.define('vcube.grid.column.TaskDetailsColumn', {
    extend: 'Ext.grid.column.Column',
    alias: 'widget.taskdetailscolumn',
    header: 'Details',
	dataIndex: 'details',
	renderer: function(val,m,record,ri,ci,store,view) {

		// Still in progress?
		if(record.raw.progress) {
			
			m.style = "padding: 0px;";
			
			var width = view.panel.columns[ci].el.dom.scrollWidth - 2;
			
			return '<div class="x-progress x-progress-default">'+
	        	'<div class="x-progress-text x-progress-text-back" style="width: ' + width + 'px;">'+
	        	record.raw.progress.operationDescription +
	        '</div>'+
	        '<div class="x-progress-bar x-progress-bar-default" style="width:'+record.raw.progress.percent+'%">'+
	            '<div class="x-progress-text" style="width: '+width+'px;">'+
	                '<div>'+
	                record.raw.progress.operationDescription + 
	                '</div>'+
	            '</div>'+
	        '</div>'+
	    '</div>';
		}
		m.style = "";
		var status = 'Unknown';
		try {
			status = vcube.app.constants.TASK_STATUS_TEXT[val];
		} catch(err) {
			status = 'Unknown';
		}
		return status;
	}
});

/*
 * Task status
 */
Ext.define('vcube.grid.column.TaskStatusColumn', {
    extend: 'Ext.grid.column.Column',
    alias: 'widget.taskstatuscolumn',
    header: 'Status',
	dataIndex: 'status',
	renderer: function(val,m,record) {
		var status = 'Unknown';
		try {
			status = vcube.app.constants.TASK_STATUS_TEXT[val];
		} catch(err) {
			status = 'Unknown';
		}
		return status;
	}
});


/*
 * Virtual Machine
 */
Ext.define('vcube.grid.column.MachineColumn', {
    extend: 'Ext.grid.column.Column',
    alias: 'widget.machinecolumn',
    header: 'Machine',
	dataIndex: 'machine',
	renderer: function(vmid) {
		if(vmid) {
			try {
				return vcube.vmdatamediator.getVMData(vmid).name;
			} catch(err) {
				return vmid;
			}
		}
	},
	width: 150
});

/*
 * Task name column
 * 
 */
Ext.define('vcube.grid.column.TaskNameColumn', {
    extend: 'Ext.grid.column.Column',
    alias: 'widget.tasknamecolumn',
	header: 'Task',
	dataIndex: 'name',
	renderer: function(v,m,record) {
		if(record.get('machine')) {
			cls = 'eventColumnMachine';
		} else if(record.get('connector')) {
			cls = 'eventColumnServer';
		} else {
			cls = 'eventColumnGeneral';
		}
		return '<div class="gridColumnIcon '+cls+'"> </div>' + v;
	},
	width: 300
});

/*
 * Event name
 */
Ext.define('vcube.grid.column.EventNameColumn', {
    extend: 'Ext.grid.column.Column',
    alias: 'widget.eventnamecolumn',
	header: 'Event',
	dataIndex: 'name',
	renderer: function(v,m,record) {
		if(record.get('machine')) {
			cls = 'eventColumnMachine';
		} else if(record.get('connector')) {
			cls = 'eventColumnServer';
		} else {
			cls = 'eventColumnGeneral';
		}
		return '<div class="gridColumnIcon '+cls+'"> </div>' + v;
	},
	width: 300
});

/*
 * Log category (for task and event log)
 */
Ext.define('vcube.grid.column.LogCategoryColumn', {
    extend: 'Ext.grid.column.Column',
    alias: 'widget.logcategorycolumn',
	header: 'Category',
	dataIndex: 'category',
	renderer: function(v,m,record) {
		var name = 'Unknown';
		try {
			name = vcube.app.constants.LOG_CATEGORY_TEXT[v];			
		} catch(err) {
			name = 'Unknown';
		}
		return "<div class='categoryColumn categoryColumn" + v + "'> </div>" + name;
	}
});


