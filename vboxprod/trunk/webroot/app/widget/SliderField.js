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
    
    minValue: 2,
    maxValue: 50,
    valueLabel: 'GB',
    
    slider: null,
    spinner: null,
    valueBox: null,
    
    hideValueBox: false,
    
    sliderTickTpl: new Ext.XTemplate('<div style="font-size: 7px; width: 100%; overflow: hidden; white-space: nowrap"> |<span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span>| <span class="sliderTickSpacer"> </span> </div>' +
		'<div style="width: 100%; font-size: 11px;"><span style="float: left">{minValue} {valueLabel}</span><span style="float: right">'+
		'{maxValue} {valueLabel}</span></div>'),
    
    items: [],
    
    reconfigure: function(min,max,label) {
    
    	this.setMaxValue(max);
    	this.setMinValue(min);
    	this.valueLabel = label;
    	
    	this.valueBox.update(valueLabel);
    	
    	
    },
    
    setMaxValue: function(val) {
    	this.slider.setMaxValue(vcube.utils.toInt(val));
    	this.spinner.setMaxValue(vcube.utils.toInt(val));
    },
    
    setMinValue: function(val) {
    	this.slider.setMinValue(vcube.utils.toInt(val));
    	this.spinner.setMinValue(vcube.utils.toInt(val));    	
    },
    
    getValue: function() {
    	return this.slider.getValue();
    },
    
    setValue: function(val) {
    	this.slider.setValue(vcube.utils.toInt(val));
    	this.spinner.setValue(vcube.utils.toInt(val));
    },
    
    initComponent: function(options) {
    	
    	Ext.apply(this, options);
    	
    	this.items = [{
    		xtype: 'slider',
    		flex: 1,
    		maxValue: this.maxValue,
    		minValue: this.minValue,
    		value: this.value,
    		afterSubTpl: '<div id="' + this.getId() + '-sliderticks">' + this.sliderTickTpl.apply(this) + '</div>',
    		listeners: {
    			changecomplete: function(slider, newValue) {
    				slider.ownerCt.items.items[1].setValue(newValue);    			
    			}
    		}
    	},{
    		xtype: 'spinnerfield',
    		inputWidth: 60,
    		maxValue: this.maxValue,
    		minValue: this.minValue,
    		margin: '0 0 0 8',
    		value: this.value,
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
    	},{
    		html: this.valueLabel,
    		bodyStyle: { background: 'transparent' },
    		border: false,
    		width: 40,
    		margin: '6 0 0 6',
    		hidden: this.hideValueBox,
    		textAlign: 'left'
    	}];
    	
	    this.slider = this.items[0];
	    this.spinner = this.items[1];
	    this.valueBox = this.items[2];
	    
	    this.callParent(arguments);

    }
});