<?php

class service_users {
	
	/*
	 * Change phpVirtualBox password. Passed to auth module's
	* changePassword method.
	*/
	function changePassword($old,$new) {
	
		$settings = new app_configClass();
		$settings->auth->changePassword($vboxRequest['old'], $vboxRequest['new']);
		
	}
	
	/*
	 * Get a list of phpVirtualBox users. Passed to auth module's
	* getUsers method.
	*/
	function getUsers() {
	
		// Session
		session_init();
			
		// Must be an admin
		if(!$_SESSION['admin']) break;
			
		$settings = new app_configClass();
		return $settings->auth->listUsers();
			
	}
	
	/*
	 * Remove a phpVirtualBox user. Passed to auth module's
	* deleteUser method.
	*/
	function delUser() {
	
		// Session
		session_init();
			
		// Must be an admin
		if(!$_SESSION['admin']) break;
	
		$settings = new app_configClass();
		$settings->auth->deleteUser($vboxRequest['u']);
				
	}
	
}
