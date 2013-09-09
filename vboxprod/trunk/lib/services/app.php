<?php
/**
 * Wrapper for remote application level functions
 * @author ian_moore
 *
 */

class service_app extends service {
	
	/**
	 * Get application configuration
	 */
	function remote_getConfig() {
		return array();	
	}
	
	/**
	 * Get session object
	 */
	function remote_getSession() {
		
		return $_SESSION;
		
	}
	
	/*
	 * Pass login to authentication module.
	*/
	function remote_login($args) {
		return app::getInstance()->login($args['u'], $args['p']);			
	}
	
	/**
	 *
	 * Revalidate login info and set authCheckHeartbeat session variable.
	 * @param vboxconnector $vbox vboxconnector object instance
	 */
	function remote_heartbeat($vbox) {
	}
	
	/**
	 *
	 * Log out user present in $_SESSION
	 * @param array $response response passed byref by ajax.php and populated within function
	 */
	function remote_logout() {
		return app::getInstance()->logout();
	}
	
}
