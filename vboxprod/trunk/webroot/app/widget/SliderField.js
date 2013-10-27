Ext.define('vcube.widget.SliderField', {
    extend: 'Ext.form.FieldContainer',
    mixins: {
        field: 'Ext.form.field.Field'
    },
    alias: 'widget.SliderField',
    layout: 'hbox',
    combineErrors: true,
    msgTarget: 'side',
    submitFormat: 'c',
    items: [{
    	xtype: 'slider',
    	flex: 1,
    	maxValue: 4096,
    	minValue: 4,
    	afterSubTpl: '<div style="font-size: 7px; width: 100%; overflow: hidden; white-space: nowrap"> |<span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span> </div>' +
    		'<div style="width: 100%; font-size: 11px;"><span style="float: left">4 MB</span><span style="float: right">4096 MB</span></div>',
    	listeners: {
    		changecomplete: function(slider, newValue) {
    			slider.ownerCt.items.items[1].setValue(newValue);    			
    		}
    	}
    },{
    	xtype: 'spinnerfield',
    	inputWidth: 60,
    	afterBodyEl: 'MB',
    	width: 90,
    	maxValue: 4096,
    	minValue: 4,
    	margin: '0 0 0 4',
    	listeners: {
    		spin: function(spinner, dir) {
    			var val = vcube.utils.toInt(spinner.getValue()) + (dir == 'up' ? 1 : -1);
    			spinner.setValue(val);
    			spinner.ownerCt.items.items[0].setValue(val);
    		},
    		blur: function(spinner) {
    			var val = vcube.utils.toInt(spinner.getValue());
    			spinner.setValue(val);
    			spinner.ownerCt.items.items[0].setValue(val);
    		}
    	}
    }]
});