Ext.define('vcube.AppJsonReader', {
    extend: 'Ext.data.reader.Json',
    alias: 'reader.AppJsonReader',
    responseData: null,
    /*
    read: function (object) {
    	//console.log(this);
        //return {};
        //object.Results = Ext.decode(object.responseText);
        console.log(object.responseText);
        //console.log(this.getResponseData(object));
        var d =  this.callParent(object);
        console.log(d);
        return d;
    },*/
    
    getResponseData: function(response) {
        var data, error;
 
        try {
            data = Ext.decode(response.responseText).data.responseData;
            this.responseData = data;
            if(this.initialRoot) {
            	data = data[this.initialRoot];
            }
            
            if(this.asChildren) {

            	if(data.toString() != "[object Array]")
            		data = new Array(data);
            	
            	data = {'text':'.','children':data,'expanded':true};
            	
            }
            return this.readRecords(data);

        } catch (ex) {
            error = new Ext.data.ResultSet({
                total  : 0,
                count  : 0,
                records: [],
                success: false,
                message: ex.message
            });

            this.fireEvent('exception', this, response, error);

            Ext.Logger.warn('Unable to parse the JSON returned by the server');

            return error;
        }
    }
});