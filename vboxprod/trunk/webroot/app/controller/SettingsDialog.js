/*
 * Main Panel Controller
 */
Ext.define('vcube.controller.SettingsDialog', {
    extend: 'Ext.app.Controller',
    
    init: function() {
    	
    	this.control({
    		'SettingsDialog' : {
    			show: function(dlg) {
    				dlg.down('#linklist').items.items[0].toggle(true);
    			},
    			beforerender: this.addSections
    		},
    		'SettingsDialog #cancel' : {
    			click: function(btn) {
    				btn.up('.window').close();
    			}
    		},
    		'SettingsDialog #save' : {
    			click: this.saveSettings
    		},
    		'SettingsDialog #linklist > button' : {
    			toggle: this.buttonToggle
    		}
    	});
    	
    },
    
    /* Add sections to settings dialog */
    addSections: function(dlg) {
    	
    	var buttons = [];
    	var panels = [];
    	
    	var linkList = dlg.down('#linklist');
    	var settingsPane = dlg.down('#settingsPane');
    	
    	for(var i = 0; i < dlg.sections.length; i++) {
    		
    		
    		linkList.add({
    			text: dlg.sections[i].label,
    			icon: 'images/vbox/' + dlg.sections[i].image + '_16px.png',
    			itemId : dlg.sections[i].name
    		});
    		
    		dlg.sections[i].title = dlg.sections[i].label,
    		dlg.sections[i].itemId = dlg.sections[i].name;
    		settingsPane.add(dlg.sections[i]);
    	}
    	
    	console.log(dlg.items.items);
    },
    
    /* save settings button click */
    saveSettings: function(btn) {
    	
    	var dlg = btn.up('.SettingsDialog');
    	
    	var vals = dlg.down('.form').getForm().getValues();
    	
    	console.log(vals);
    	
    	Ext.each(dlg.down('#settingsPane').items.items, function(pane) {
    		pane.fireEvent('saveSettings');
    	});
    	
    	dlg.fireEvent('saveSettings', dlg);
    	
    },
    
    /* Settings pane button toggled (clicked) */
    buttonToggle: function(btn, state) {
    	
		// Do not untoggle this button if no other
		// button is pressed
		if(state == false) {
			var oneToggled = false;
			Ext.each(btn.ownerCt.items.items, function(obtn) {
				if(obtn.pressed) {
					oneToggled = true;
					return false;
				}
			});    			
			if(!oneToggled) {
				btn.toggle(true, true);
				return;
			}
			
		} else {
			
			var settingsPane = btn.up('.SettingsDialog').down('#settingsPane');
			
			Ext.each(settingsPane.items.items, function(c) { c.hide(); });
			
			settingsPane.down('#'+btn.getItemId()).show();
		}

    }

});
