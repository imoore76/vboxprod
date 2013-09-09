<?php
/**
 * MySQL connection
 * @author ian_moore
 *
 */

class storage_mysql implements storageinterface {

	/**
	 * true if connected to server
	 * @var boolean
	 */
	private static $connected = false;
	
	/**
	 * Connection
	 */
	private static $connection = null;
	
	/**
	 * Fatal error connecting or selecting DB
	 */
	private static $fatalerror = false;

	/**
	 * Connect to mysql server
	 * 
	 * @throws Exception
	 * @return void|boolean
	 */
	function connect() {
		
		if(self::$fatalerror) return false;
		if(self::$connection) return true;
		
		$settings = app::getConfig();
		
		self::$connection = mysql_connect($settings['sqlServer'], $settings['sqlUser'], $settings['sqlPass']);
		
		if(!self::$connection) {
			self::$fatalerror = true;
			throw new Exception("MySQL connection error. Verify your configuration.". mysql_error(), app::ERRNO_FATAL);
		}
		
		if(!mysql_select_db($settings['sqlDB'], self::$connection)) {
			self::$fatalerror = true;
			throw new Exception("Error selecting DB: " . mysql_error(self::$connection));
		}
		
		return true;
	}
	
	/**
	 * Query for data.
	 * 
	 * @param String $q - query to send
	 * @param String $keyField - optional field to use as a key in a associative array
	 * @throws Exception
	 * @return Array
	 */
	function query($q, $keyField=false) {
		
		if(!$this->connect()) return array();

		$rows = array();
		if(!($res = mysql_query($q, self::$connection)))
			throw new Exception("Invalid MySQL query: " . mysql_error(self::$connection));
		
		while(($row = mysql_fetch_assoc($res)) != false) {
			if($keyField) $rows[$row[$keyField]] = $row;
			else $rows[] = $row;
		}
		return $rows;
	}
	
	/**
	 * Execute a query returning number of affected rows
	 * 
	 * @param string $q - query
	 * @return int
	 */
	function execute($q) {
		
		if(!$this->connect()) return array();
		
		mysql_query($q, self::$connection);
		return mysql_affected_rows(self::$connection);
	}
	
	/**
	 * Return a single row of data
	 * 
	 * @param query $q
	 * @return Array
	 */
	function get($q) {
		if(!$this->connect()) return array();
		$rows = $this->query($q);
		if(count($rows) > 0) return $rows[0];
		return array();	
	}
	
	/**
	 * Escape a string
	 * 
	 * @param string $s
	 * @return string
	 */
	function escape($s) {
		if(self::$fatalerror) return $s;
		return  mysql_real_escape_string($s);
	}
}