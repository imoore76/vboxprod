<?php
/**
 * Wrapper for remote application level functions
 * @author ian_moore
 *
 */
require_once(dirname(dirname(__FILE__)).'/service.php');

class service_app extends service {
	
	/**
	 * Get session object
	 */
	function remote_getSession() {
		
		return $_SESSION;
		
	}
	
	/*
	 * Pass login to authentication module.
	*/
	function remote_login() {
			
			
		// NOTE: Do not break. Fall through to 'getSession
		if(!$vboxRequest['u'] || !$vboxRequest['p']) {
			break;
		}
	
		// Session
		session_init(true);
			
		$settings = new app_configClass();
	
		// Try / catch here to hide login credentials
		try {
			$settings->auth->login($vboxRequest['u'], $vboxRequest['p']);
		} catch(Exception $e) {
			throw new Exception($e->getMessage(), $e->getCode());
		}
			
		// We're done writing to session
		if(function_exists('session_write_close'))
			@session_write_close();
			
	}
	
	/**
	 *
	 * Revalidate login info and set authCheckHeartbeat session variable.
	 * @param vboxconnector $vbox vboxconnector object instance
	 */
	function remote_heartbeat($vbox)
	{
		global $_SESSION;
	
		$sql = new mysqlconnector();
	
		$u = $sql->get("select id from auth_users where username = '" . $sql->escape($_SESSION['user']) ."'");
	
	
		if(!$u['id']) {
			if(function_exists('session_destroy')) session_destroy();
			unset($_SESSION['valid']);
		} else {
			$_SESSION['admin'] = intval($u['admin']);
			$_SESSION['authCheckHeartbeat'] = time();
		}
	
		if(!@$_SESSION['valid'])
			throw new Exception(trans('Not logged in.','UIUsers'), vboxconnector::PHPVB_ERRNO_FATAL);
	}
	
	/**
	 *
	 * Log out user present in $_SESSION
	 * @param array $response response passed byref by ajax.php and populated within function
	 */
	function remote_logout(&$response)
	{
		global $_SESSION;
		if(function_exists('session_destroy')) session_destroy();
		else unset($_SESSION['valid']);
		$response['data']['result'] = 1;
	}
	
}
