<?php
/**
 * Interface for account modules
 *
 * @author Ian Moore (imoore76 at yahoo dot com)
 * @copyright Copyright (C) 2010-2013 Ian Moore (imoore76 at yahoo dot com)
 * @version $Id: authinterface.php 531 2013-07-29 18:41:18Z imoore76 $
 * @package phpVirtualBox
 * 
 */
interface accountsinterface {

	/**
	*
	* Authenticate user
	* @param string $username user name
	* @param string $password password
	* @return array of user info
	*/
	function authenticate($username, $password);
	
	/**
	*
	* Return a list of users
	* @return array list of users
	*/
	function getUsers();

	/**
	 * Add a group
	 * @param array $gorupInfo
	 */
	function addGroup($gorupInfo);
	
	/**
	 * Get user from userid
	 * @param string $userid
	 */
	function getUser($userid);
	
	/**
	 * Remove a group
	 * @param int $groupId
	 */
	function deleteGroup($groupId);
	
	/**
	 * Update a group with new group info
	 * @param array $groupInfo
	 */
	function updateGroup($groupInfo);
	
	/**
	 * Get all groups
	 */
	function getGroups();
	
	/**
	*
	* Update user information such as password and admin status
	* @param array $userInfo - new user information
	*/
	function updateUser($userInfo);
	
	/**
	 *
	 * Update user information such as password and admin status
	 * @param array $userInfo - new user information
	 */
	function addUser($userInfo);
	
	/**
	*
	* Remove the user $user
	* @param string $user Username to remove
	*/
	function deleteUser($user);
	
	
	
}