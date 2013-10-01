Ext.define('vcube.JsonReader', {
    extend: 'Ext.data.reader.Json',
    alias: 'reader.vcubeJsonReader',

    getResponseData: function(response) {
        var data, error;
         
        try {
            data = Ext.decode(response.responseText).data;
            
            // Handle errors and messages
            vcube.utils.handleResponseMetaData(data);
            
            // Root will be responseData
            data = data.responseData;
            
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