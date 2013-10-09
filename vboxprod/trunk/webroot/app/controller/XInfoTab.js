/*
 * Information tab controller parent class
 */
Ext.define('vcube.controller.XInfoTab', {
    extend: 'Ext.app.Controller',

    /* selection model ref */
    navTreeSelectionModel: null,

    /* Try?? */
    constructor: function() {
    	
    	console.log("In constructor");
    	this.refs = [{
    		selector: 'viewport > NavTree',
    		ref: 'NavTreeView'
    	}];
    	
    	/* Does this tab need to be populated or redrawn? */
    	this.dirty = true;
    	
    	/* Currently selected item associated with this tab */
    	this.selectionItemId = null;
    	
    	/* Selection item type (vm|server|group) */
    	this.selectionItemType = null;
    	
    	/* selection node id */
    	this.selectionNodeId = null;
    	
    	/* Repopulate on Events*/
    	this.repopulateOn = [];
    	
    	/* Repopulate event attribute */
    	this.eventIdAttr = '-';
    	
    	/* Controlled Tab view instance */
    	this.controlledTabView = null;
    	
    	/* Point to section config */
    	this.sectionConfig = {};
    	
    	/* Get information population data */
    	this.populateData = function() {
    		return {}
    	};
    	
    	/* After new data is loaded */
    	this.
    	this.callParent(arguments);
    	
    },
    

    /* Watch for events */
    init: function(){
    	
    	console.log("In xinfotab init with");
    		console.log(this);
    	/* Non-primative types .. */
        this.control({
        	'viewport > NavTree' : {
        		select: this.onSelectItem
        	}
        });
        
        
    	/* Get redraw events from details sections */
		var redrawEvents = {};
		for(var i in this.sectionConfig) {
			
			if(typeof(i) != 'string') continue;
			
			var self = this;
			if(this.sectionConfig[i].redrawOnEvents) {
				Ext.each(this.sectionConfig[i].redrawOnEvents,function(event){
					redrawEvents[event] = self.onRedrawEvent;
				});
			}
			redrawEvents['scope'] = this;
		}		
		this.application.on(redrawEvents);
		
		/* Repopulate entire tab on these event */
		var repopulateEvents = {};
		for(var i = 0; i < this.repopulateOn.length; i++) {
			repopulateEvents[this.repopulateOn[i]] = this.onRepopulateEvent;
			repopulateEvents['scope'] = this;
		}

		this.application.on(repopulateEvents);
        
    },
    
    /* When this tab is rendered hold nav tree selection model */
    onTabRender: function(tab) {
    	this.controlledTabView = tab;
    	this.controlledTabView.on({'show':this.onTabShow,'scope':this});
    	this.navTreeSelectionModel = this.getNavTreeView().getSelectionModel();    	
    },
    
    /* When tab is shown */
    onTabShow: function() {
    	console.log("inshow");
    	
    	if(!this.dirty) return;
    	
    	this.populate(this.navTreeSelectionModel.getSelection()[0].raw.data);
    	
    },

    /* When item is selected */
    onSelectItem: function(row, record) {
    	
    	this.dirty = true;
    	
    	// Only load if Server is selected
    	if(!record || record.raw.data._type != this.selectionItemType)
    		return;

    	// Update node id
    	this.selectionNodeId = record.get('id');
    	
    	// Update selection item id
    	this.selectionItemId = record.raw.data.id;
    	
    	// Populate
    	this.populate(record.raw.data);
    },
    
    /* When a redraw event is encountered, a section is redrawn */
    onRedrawEvent: function(event) {

    	console.log("here1");
    	console.log(event);
    	// If this tab's item is no longer selected, nothing to do
    	if(event[this.eventIdAttr] != this.selectionItemId)
    		return;
    	
    	console.log("here2");
    	
    	// is this tab still visible?
    	if(!(this.controlledTabView && this.controlledTabView.isVisible())) {
    		this.dirty = true;
    		return;
    	}
    	
    	console.log("here3");

    	// Compose a list of sections that want to redraw
    	// on this type of event
    	var sections = [];
    	for(var i in this.sectionConfig) {
    		if(typeof(i) != 'string') continue;
			if(this.sectionConfig[i].redrawOnEvents && Ext.Array.contains(this.sectionConfig[i].redrawOnEvents, event.eventType)) {
				sections.push(i);
			}
    	}
    	
    	console.log("here4");
    	
    	var self = this;
    	
    	// Get fresh data
    	Ext.ux.Deferred.when(this.populateData(this.navTreeSelectionModel.getSelection()[0].raw.data)).done(function(data) {
			
    		console.log("here5");
    		// If this tab's item is no longer selected, nothing to do
        	if(data.id != self.selectionItemId)
        		return;
        	
        	console.log("here6");
        	// is this tab still visible?
        	if(!self.controlledTabView.isVisible()) {
        		self.dirty = true;
        		return;
        	}

        	console.log("here7");
	    	// Redraw each section that wants to be redrawn
	    	Ext.each(self.controlledTabView.items.items, function(section, idx) {
	    		
	    		if(!Ext.Array.contains(sections, section.itemId)) {
	    			return;
	    		}
	    		console.log("here8");
	    		
	    		self.getVMTabDetailsView().remove(section, true);
	    		
	    		self.getVMTabDetailsView().insert(idx, Ext.create('vcube.widget.SectionTable',{
	    			sectionCfg: self.sectionConfig[section.itemId],
	    			'data':data,
	    			'name':section.itemId}));
	    		
	    	});
	    	
	    	console.log("here9");
	    	self.controlledTabView.doLayout();
			
		});

    },
    
    /* When a repopulate event is encountered, the
     * entire tab is repopulated */
    onRepopulateEvent: function(event) {

    	console.log("Here in     onRepopulateEvent");
    	console.log(event);
    	
    	// If this tab's item is no longer selected, nothing to do
    	if(event[this.eventIdAttr] != this.selectionItemId)
    		return;
    	
    	// is this tab still visible?
    	if(!(this.controlledTabView && this.controlledTabView.isVisible())) {
    		this.dirty = true;
    		return;
    	}

    	this.populate(this.navTreeSelectionModel.getSelection()[0].raw.data);

    	
    },
    
    /* Get info table and cache result */
    _infoPane: false,
    getInfoPane: function() {
    	if(this._infoPane === false) {
    		this._infoPane = this.controlledTabView.down('#infopane')
    	}
    	return this._infoPane;
    },

    /* Get info sections and cache result */
    _sectionsPane: false,
    getSectionsPane: function() {
    	if(this._sectionsPane === false) {
    		if(this.controlledTabView.itemId == 'sectionspane') {
    			this._sectionsPane = this.controlledTabView; 
    		} else {
    			this._sectionsPane = this.controlledTabView.down('#sectionspane')
    		}
    	}
    	return this._sectionsPane;
    },

    /* Draw sections */
    drawSections: function(data) {

    	// Tab info table
    	var infoPane = this.getInfoPane();
    	if(infoPane) infoPane.update(data);
		
		// Tab section tables
		var sectionsPane = this.getSectionsPane();
		if(sectionsPane) {
			sectionsPane.removeAll(true);
			
			for(var i in this.sectionConfig) {
				
				if(typeof(i) != 'string') continue;
				
				if(this.sectionConfig[i].condition && !this.sectionConfig[i].condition(data)) continue;
				
				sectionsPane.add(Ext.create('vcube.widget.SectionTable',{
					sectionCfg: this.sectionConfig[i],
					'data': data,
					name: i}));
				
			}
		}

    },
    
    /* Populate tab */
    populate: function(data) {
    	
    	// Nothing to do if tab isn't visible
    	if(!(this.controlledTabView && this.controlledTabView.isVisible())) {
    		return;
    	}
    	
    	console.log("populating");
    	
    	// Data is no longer dirty?.. not sure about this
    	this.dirty = false;
    	
    	// Show loading mask
    	this.controlledTabView.setLoading(true);
    	
    	// Hold ref to self
    	var self = this;
    	
    	Ext.ux.Deferred.when(this.populateData(data)).done(function(pdata) {
    	
    		// Remove loading mask
    		self.controlledTabView.setLoading(false);
    		
    		if(!self.controlledTabView.isVisible()) return;

    		// Is this node still selected
        	if(self.navTreeSelectionModel.getSelection()[0].get('id') != self.selectionNodeId)
        		return;
    		
    		// batch of updates
    		Ext.suspendLayouts();
    		
    		// draw sections with data
    		self.drawSections.apply(self, [pdata]);

    		// batch of updates are over
    		Ext.resumeLayouts(true);


    	});
    }

});
    
    
    
    