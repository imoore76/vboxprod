/*
 * Form that allows multi-dimensional setting / getting
 * via prop.prop.prop..etc ..
 */
Ext.define('vcube.form.Basic', {
    extend: 'Ext.form.Basic',
    
    alias: 'widget.vcube.form.Basic',
    
    setValues: function(values) {
    	
    	console.log(values);
    	
        var me = this;

        function setVal(fieldId, val) {
        	/*
        	console.log("Setting " + fieldId + " to ");
        	console.log(val);
        	*/
        	
        	// Special case for multi-dimensional fields
        	if(Ext.isObject(val)) {
        		
        		Ext.iterate(val, function(fid, v) {
        			setVal(fieldId + '.' + fid, v);
        		});
        		return;
        	}
            var field = me.findField(fieldId);
            if (field) {
                field.setValue(val);
                if (me.trackResetOnLoad) {
                    field.resetOriginalValue();
                }
            }
        }

        if (Ext.isArray(values)) {
            // array of objects
            Ext.each(values, function(val) {
                setVal(val.id, val.value);
            });
        } else {
            // object hash
            Ext.iterate(values, setVal);
        }
        return this;
    }

});
