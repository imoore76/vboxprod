Ext.define('vcube.form.field.slider', {
    extend: 'Ext.form.FieldContainer',
    mixins: {
        field: 'Ext.form.field.Field'
    },
    alias: 'widget.sliderfield',
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
    
    sliderTickTpl: new Ext.XTemplate('<div style="font-size: 7px; width: 100%;padding-left: 6px; padding-right: 6px;overflow: hidden;">'+
    		'{[this.genTicks(values.minValue, values.maxValue)]}'+
		'</div><div style="width: 100%; font-size: 11px; height: 14px;"><span style="float: left;">{minValue} {valueLabel}</span><span style="float: right">'+
		'{maxValue} {valueLabel}</span></div>',{
			genTicks: function(minValue, maxValue) {

				var diff = Math.min((maxValue - minValue),40);
				var tdw = Math.round(100 / diff);
				
				var divRow = [];
		
				for(var a = 0; a < (diff-1); a++){
					divRow.push('<div style="height: 4px; display: inline-block; float: left; width: '+ tdw + '%; border-left: 1px solid #000;"></div>');
				}
				divRow.push('<div style="height: 4px; display: inline-block; float: left; width: 1px; border-left: 1px solid #000;"></div>');
				divRow.push('<div style="height: 4px; display: inline-block; width: 1px; border-left: 1px solid #000; float: right"></div>');
				return divRow.join('');
			}
		}),
    
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
    
    getSubmitValue: function() {
    	return this.getValue();
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
    		submitValue: false,
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
    		submitValue: false,
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
    	
	    
	    this.callParent(arguments);

	    this.slider = this.down('slider');
	    this.spinner = this.down('spinnerfield');
	    this.valueBox = this.items.items[2];

    }
});