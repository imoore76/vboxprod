<?php

class service_users {
	
	/*
	 * Change phpVirtualBox password. Passed to auth module's
	* changePassword method.
	*/
	function changePassword($old,$new) {
	
		$settings = new phpVBoxConfigClass();
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
			
		$settings = new phpVBoxConfigClass();
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
	
		$settings = new phpVBoxConfigClass();
		$settings->auth->deleteUser($vboxRequest['u']);
				
	}
	
}
