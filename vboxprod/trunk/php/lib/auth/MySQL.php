<?php
/**
 * 
 * Built-in authentication module. Uses VirtualBox's set/getExtraData capability
 * to store / retrieve user credentials. Called from ajax.php when authentication
 * functions are requested.
 * 
 * @author Ian Moore (imoore76 at yahoo dot com)
 * @copyright Copyright (C) 2010-2013 Ian Moore (imoore76 at yahoo dot com)
 * @version $Id: MySQL.php 531 2013-07-29 18:41:18Z imoore76 $
 * @package phpVirtualBox
 * @see vboxconnector
 * @see ajax.php
 * 
 */
require_once(dirname(dirname(__FILE__)).'/mysqlconnector.php');

class phpvbAuthMySQL implements phpvbAuth {
	
	/**
	 * 
	 * A list of capabilities describing this authentication module.
	 * @var array capability values:
	 * 		@var boolean canChangePassword
	 * 		@var boolean canModifyUsers
	 * 		@var boolean canLogout
	 * 		
	 */
	var $capabilities = array(
			'canChangePassword' => true,
			'canModifyUsers' => true,
			'canLogout' => true
		);
	
	/**
	 * 
	 * Log in function. Populates $_SESSION
	 * @param string $username user name
	 * @param string $password password
	 */
	function login($username, $password)
	{
		global $_SESSION;
		
		$sql = new mysqlconnector();

		$u = $sql->get("select * from auth_users where username = '" . $sql->escape($username) ."' and password = '" . md5($password) ."'");
		

		if(!$u['id']) {
			$_SESSION['valid'] = true;
			$_SESSION['user'] = $username;
			$_SESSION['admin'] = intval($u['admin']);
			$_SESSION['authCheckHeartbeat'] = time();			
		}
		
	}
	
	/**
	 * 
	 * Change password function.
	 * @param string $old old password
	 * @param string $new new password
	 * @return boolean true on success
	 */
	function changePassword($old, $new)
	{
		global $_SESSION;
		
		$sql = new mysqlconnector();

		return $sql->set("update auth_users set password = '" . md5($new) ."' where username = '" . $sql->escape($_SESSION['user']) ."' and password = '" . md5($old) ."'");
				
	}
	
	/**
	 * 
	 * Revalidate login info and set authCheckHeartbeat session variable.
	 * @param vboxconnector $vbox vboxconnector object instance
	 */
	function heartbeat($vbox)
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
	function logout(&$response)
	{
		global $_SESSION;
		if(function_exists('session_destroy')) session_destroy();
		else unset($_SESSION['valid']);
		$response['data']['result'] = 1;
	}
	
	/**
	 * 
	 * Return a list of users
	 * @return array list of users
	 */
	function listUsers()
	{
		$response = array();
		

		$sql = new mysqlconnector();
		
		return $sql->query("select id, username, name, admin from auth_users", true);
		
	}
	
	/**
	 * 
	 * Update user information such as password and admin status
	 * @param array $vboxRequest request passed from ajax.php representing the ajax request. Contains user, password and administration level.
	 * @param boolean $skipExistCheck Do not check that the user exists first. Essentially, if this is set and the user does not exist, it is added.
	 */
	function updateUser($vboxRequest, $skipExistCheck)
	{
		global $_SESSION;
		
		// Must be an admin
		if(!$_SESSION['admin']) break;
		
		$sql = new mysqlconnector();

		// See if it exists
		if(!$skipExistCheck && count($sql->query("select id from auth_users where username = '" . $sql->escape($vboxRequest['u']) ."'")) == 0)
			break;
		
		$q = 'set admin = ' . ($vboxRequest['a'] ? '1' : '0');
		
		if($vboxRequest['p'])
			$q .= ", password = '". md5($vboxRequest['p']) ."'";
		
		return $sql->set("update auth_users {$q} where userame = '" . $sql->escape($vboxRequest['u']) ."'");
	}
	
	/**
	 * 
	 * Remove the user $user
	 * @param string $user Username to remove
	 */
	function deleteUser($user) {

		$sql = new mysqlconnector();
		$sql->query("delete from auth_users where username = '" . $sql->escape($user) ."'");
	}
}
