<?php
/**
 * Pluggable application classes
 * @author ian_moore
 *
 */
class modulefactory {
	
	/**
	 * Module object instance implementing interface
	 * @var Object
	 */
	var $module = null;
	
	/**
	 * Load interface and module files and instantiate class
	 * 
	 * @param string $interface
	 * @param string $module
	 */
	function __construct($interface, $module) {
		
		// include interface
		require_once(dirname(__FILE__).'/interfaces/'.basename($interface).'.php');
		
		// include module
		require_once(dirname(__FILE__).'/'.basename($interface).'/'.basename($module).'.php');
		$className = $interface.'_'.$module;
		$this->module = new $className();
		
	}
	
	/**
	 * Pass any method calls on to module
	 * 
	 * @param string $fn
	 * @param string $args
	 * @return mixed
	 */
	function __call($fn, $args) {
		return call_user_func_array(array($this->module,$fn), $args);
	}
	
	
}