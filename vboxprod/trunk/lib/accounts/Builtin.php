<?php
/**
 * 
 * Built-in authentication module. Uses app storage
 * to store / retrieve user credentials.
 * 
 * @author Ian Moore (imoore76 at yahoo dot com)
 * @copyright Copyright (C) 2010-2013 Ian Moore (imoore76 at yahoo dot com)
 * @version $Id: MySQL.php 531 2013-07-29 18:41:18Z imoore76 $
 * 
 */


class accounts_Builtin implements accountsinterface {
	
	var $storage = null;
	
	/**
	 * Get ref to storage
	 */
	function __construct() {
		$this->storage = app::getStorage();
	}
	
	/**
	 * Get user by userid
	 * @see accountinterface::getUser()
	 */
	function getUser($userid) {
		return $this->storage->get("select id, userid, name, group_id from users where userid = '".
				$this->storage->escape($userid)."'");
	}
	
	/**
	*
	* Authenticate user
	* @param string $username user name
	* @param string $password password
	* @return bool
	*/
	function authenticate($username, $password) {
		return $this->storage->get("select id, userid, name, group_id from users where userid = '".
				$this->storage->escape($username) ."' and password = '" . hash("sha512", $password ,false) ."'");
	}
	
	/**
	*
	* Return a list of users
	* @return array list of users
	*/
	function getUsers() {
		return $this->storage->query("select id, userid, name, group_id from users");
	}

	/**
	 * Add a group
	 * @param array $gorupInfo
	 */
	function addGroup($gorupInfo) {
		
	}
	
	/**
	 * Remove a group
	 * @param int $groupId
	 */
	function deleteGroup($groupId) {
		
	}
	
	/**
	 * Update a group with new group info
	 * @param array $groupInfo
	 */
	function updateGroup($groupInfo) {
		
	}
	
	/**
	 * Get all groups
	 */
	function getGroups() {
		return $this->storage->query("select * from groups");
	}
	
	/**
	*
	* Update user information such as password and admin status
	* @param array $userInfo - new user information
	*/
	function updateUser($userInfo) {
		return $this->storage->execute("update users set ");
	}
	
	/**
	 *
	 * Update user information such as password and admin status
	 * @param array $userInfo - new user information
	 */
	function addUser($userInfo) {
		
		if(empty($userInfo['userid']) || empty($userInfo['password']))
			throw new Exception("Cannot add user: missing userid or password.");
		
		$userInfo['name'] = (empty($userInfo['name']) ? '' : $userInfo['name']);
		
		$userInfo['userid'] = $this->storage->escape($userInfo['userid']);
		$userInfo['name'] = $this->storage->escape($userInfo['name']);
		$userInfo['password'] = hash("sha512", $userInfo['password'] ,false);
		
		// Make sure user does not exist first
		if(count($this->storage->query("select id from users where userid = '{$userInfo['userid']}'")))
			throw new Exception("User already exists.");
		
		return $this->storage->execute("insert into users (userid, name, password) values (".
				"'".$userInfo['userid']."', '". $userInfo['name'] ."', '". $userInfo['password'] ."')");
	}
	
	/**
	*
	* Remove the user $user
	* @param string $user Username to remove
	*/
	function deleteUser($user) {
		$user = $this->storage->escape($user);
		return $this->storage->execute("delete from users where userid = '{$user}'");
		
	}
	
	
}
