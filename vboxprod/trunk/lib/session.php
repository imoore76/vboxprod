<?php
/**
 * Session interface class
 * 
 * @author ian_moore
 *
 */

// Force the session to only use cookies, not URL variables.
//ini_set('session.use_only_cookies', 1);

class session {
	
	/**
	 * Storage object with DB backend
	 * @var Object
	 */
	var $storage = null;
	
	function __construct() {
		
		// Get storage object from app
		$this->storage = app::getStorage();
		
	}

	/** Dummy functions that are n/a  here **/
	function close() { return true; }
	function open() {  
		return true;
	}
	
	/**
	 * Read session data from table
	 * @param String $id
	 */
	function read($id) {
		$data = $this->storage->get("select id, data from sessions where id = '". $this->storage->escape($id) ."'");
		if(empty($data) || empty($data['id'])) {
			$this->new = true;
			$data = array('data'=>array());
		}
		return $data['data'];
	}
	
	/**
	 * Write data to 
	 * @param unknown_type $id
	 * @param unknown_type $data
	 * @return boolean
	 */
	function write($id, $data) {
		if($this->new) {
			$q = "insert into sessions (id, data, time) values ('". $id ."', '" . $data ."', ". time() .")";
		} else {
			$q = "update sessions set data = '" . $data ."', time = ". time() ." where id = '" . $id ."'";
		}
		return $this->storage->execute($q);
	}
	
	/**
	 * Destroy session data
	 * @param String $id
	 */
	function destroy($id) {
		$this->storage->execute("DELETE FROM sessions WHERE id = '".$id."'");
		return true;
	}
	
	/**
	 * Perform garbage collection
	 * @param unknown_type $max
	 * @return boolean
	 */
	function gc($max) {
		$this->storage->execute("DELETE FROM sessions WHERE time < " . (time() - $max));
		return true;
	}
	
	
}