Ext.define('vcube.store.VirtualMachines',{
	extend: 'Ext.data.Store',
	autoload: false,
	remoteSort: false,
	remoteFilter: false,
	fields : [
	      {name: 'id', type: 'string'},
	      {name: 'name', type: 'string'},
	      {name: 'description', type: 'string'},
	      {name: 'state', type: 'string'},
	      {name: 'sessionState', type: 'string'},
	      {name: 'OSTypeDesc', type: 'string'},
	      {name: 'OSTypeId', type: 'string'},
	      {name: 'lastStateChange', type: 'int'},
	      {name: 'connector_id', type: 'int'},
	      {name: 'icon', type: 'string'},
	      {name: 'group_id', type: 'int'},
	      {name: 'CPUCount', type: 'int'},
	      {name: 'memorySize', type: 'int'}
	]
});

