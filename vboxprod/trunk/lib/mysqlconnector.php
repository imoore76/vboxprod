<?php

class mysqlconnector {

	/**
	 * Settings object
	 * @var phpVBoxConfigClass
	 * @see phpVBoxConfigClass
	 */
	var $settings = null;
	
	/**
	 * true if connected to vboxwebsrv
	 * @var boolean
	 */
	var $connected = false;
	
	/**
	 * Connection
	 */
	public static $_connection = null;
	
	/**
	 * Obtain configuration settings and set object vars
	 * @param boolean $useAuthMaster use the authentication master obtained from configuration class
	 * @see phpVBoxConfigClass
	 */
	public function __construct() {
	
		/* Set up.. .. settings */
	
		/** @var phpVBoxConfigClass */
		$this->settings = new phpVBoxConfigClass();
		

	}
	
	
	/**
	 * Connecto to MySQL
	 * var $sqlServer = '127.0.0.1';
var $sqlUser = 'root';
var $sqlPass = '';
var $sqlDB = 'vboxprod';

	 */
	function connect() {
		
		if(self::$_connection) $this->connected = true;
		
		if($this->connected) return;
		self::$_connection = mysql_connect($this->settings->sqlServer, $this->settings->sqlUser, $this->settings->sqlPass);
		mysql_select_db($this->settings->sqlDB, self::$_connection);
		return ($this->connected == true);
	}
	
	function query($q, $keyField) {
		$this->connect();

		$rows = array();
		$res = mysql_query($q, self::$_connection);
		while(($row = mysql_fetch_assoc($res)) !== false) {
			if($keyField) $rows[$row[$keyField]] = $row;
			else $rows[] = $row;
		}
		return $rows;
	}
	
	function set($q) {
		$this->connect();
		mysql_query($q, self::$_connection);
		return mysql_affected_rows(self::$_connection);
	}
	
	function get($q) {
		$rows = $this->query($q);
		if(count($rows) > 0) return $rows[0];
		return array();	
	}
	
	function escape($s) {
		return  mysql_real_escape_string($s);
	}
}