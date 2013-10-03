/**
 * @class Ext.ux.Deferred
 * @author Vincenzo Ferrari <wilk3ert@gmail.com>
 *
 * Deferred (promises) for ExtJS and Sencha Touch
 * 
 * Heavily modified by Ian Moore <imoore76@yahoo.com> for
 * vcube to behave more like jQuery's $.Deferred() and $.when()
 *
 */
Ext.define ('Ext.ux.Deferred', {
	statics: {
		/**
		 * @method when
		 * It encapsulates the given promises in a new one and it returns.
		 * When the new promise is executed, the listeners attached will be notified.
		 * @param {Ext.ux.Deferred/Ext.ux.Deferred[]/Function/Function[]} args One or more Ext.ux.Deferred or Function. If Function is given, it has to return an Ext.ux.Deferred or an error would be raised.
		 * The returned promise will be solved or rejected after each given promise have finished
		 * @return {Ext.ux.Deferred} The promise
		 * @static
		 */
		when: function () {
			var promises = arguments ,
				dfd = Ext.create ('Ext.ux.Deferred') , // Master deferred object
				counter = promises.length ,
				results = [] ,
				errors = [];

			for (var i = 0; i < promises.length; i++) {
				(function (i) {
					var promise = promises[i];
					
					if (typeof promise === 'function') {
						promise = promise();
					}
				
					// If promise is not a deferred object, create one
					// and resolve it
					if(!(promise instanceof Ext.ux.Deferred)) {
						var pdata = promise;
						promise = Ext.create('Ext.ux.Deferred');
						promise.resolve(pdata);
					}
			
					promise
						.done.call(promise, function (data) {
							counter--;
							results[i] = data;
					
							if (counter == 0) {
						
								if (errors.length > 0) dfd.reject.apply(dfd, errors);
								else dfd.resolve.apply(dfd, results);
							}
						})
						.fail.call(promise, function (data) {
							counter--;
							errors[i] = data;
							
							if (counter == 0) {
								dfd.reject.apply (dfd, errors);
							}
						});
					
				})(i);
			}
		
			return dfd;
		}
	} ,
	
	state : "inprogress",
	stateData : null,
	
	/**
	 * @property {Function} onDone Function called when the promise is done. Never use directly
	 * @private
	 */
	onDone: [],
	
	/**
	 * @property {Function} onFail Function called when the promise is failed. Never use directly
	 * @private
	 */
	onFail: [],
	
	/**
	 * @method done
	 * The given function will be executed when the promise is solved
	 * @param {Function} onDone Function that has to be called on 'resolve' situation
	 * @return {Ext.ux.Deferred} this
	 */
	done: function (onDone) {

		if(typeof(onDone) != 'function') return this;

		if(this.state == 'resolved') {
			onDone.apply(this, this.stateData);
		} else {
			this.onDone.push(onDone);
		}
		
		return this;
	} ,
	
	/**
	 * @method fail
	 * The given function will be executed when the promise is rejected
	 * @param {Function} onFail Function that has to be called on 'reject' situation
	 * @return {Ext.ux.Deferred} this
	 */
	fail: function (onFail) {

		if(typeof(onDone) != 'function') return this;
		
		if(this.state == 'rejected') {
			onFail.apply(this, this.stateData);
		} else {
			this.onFail.push(onFail);
		}
		return this;
	} ,
	
	/**
	 * @method always
	 * Invoked in any case
	 * @param {Function} onAlways Function that has to be called in any case
	 * @return {Ext.ux.Deferred} this
	 */
	always: function (onAlways) {
		return this.done(onAlways).fail(onAlways);
	} ,
	
	/**
	 * @method reject
	 * Reject the promise. The function attached with fail or always or then method is called. 
	 * The given data is passed to the attached function
	 * @param {Object} args Data to pass to the attached function
	 * @return {Ext.ux.Deferred} this
	 */
	reject: function () {
		
		var me = this;
		this.stateData = arguments;
		this.state = 'rejected';

		Ext.each(this.onFail, function(fn) {
			fn.apply(null, me.stateData);
		})
		return me;
		
	} ,
	
	/**
	 * @method resolve
	 * Solve the promise. The function attached with done or always or then method is called.
	 * The given data is passed to the attached function
	 * @param {Object} args Data to pass to the attached function
	 * @return {Ext.ux.Deferred} this
	 */
	resolve: function () {
		
		this.stateData = arguments;
		this.state = 'resolved';
		
		var me = this;
		
		Ext.each(this.onDone, function(fn) {
			fn.apply(me, me.stateData);
		})
		return me;
	},
	
	/**
	 * ExtJS should take care of this on each object
	 * instance creation, but it doesn't. Bad EXTJS!!!!
	 */
	constructor: function() {
		this.onDone = this.onFail = [];
		this.state = this.stateData = null;
	},
	
	/**
	 * @method then
	 * Attach on done and/or on fail functions. The given functions will be called on 'resolve'/'reject' situation.
	 * A new promise is created to encapsulate the given functions and returned
	 * @param {Function} onDone Function that has to be called on 'resolve' situation
	 * @param {Function} onFail Function that has to be called on 'reject' situation
	 * @return {Ext.ux.Deferred} The new promise
	 */
	then: function (onDone, onFail) {
		
		return this.done(onDone).fail(onFail);
	}
})
