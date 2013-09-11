Ext.define('vboxprod.model.VboxServer', {
    extend: 'Ext.data.Model',
	fields: [
	   {name:'id', type:'int'},
	   {name:'location',type:'string'},
	   {name:'name',type:'string'},
	   {name:'username',type:'string'},
	   {name:'password',type:'string'}
	],
    init: function(){
    	//console.log("init NavTreeGroup model");
    }
});