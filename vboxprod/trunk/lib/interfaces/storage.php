<?php
/**
 * DB Storage interface
 * @author ian_moore
 *
 */

interface storageinterface {

	/**
	 * Connect to DB server
	 * 
	 * @throws Exception
	 * @return void|boolean
	 */
	function connect();
	
	/**
	 * Query for data.
	 * 
	 * @param String $q - query to send
	 * @param String $keyField - optional field to use as a key in a associative array
	 * @throws Exception
	 * @return Array
	 */
	function query($q, $keyField=false);
		
	/**
	 * Execute a query returning number of affected rows
	 * 
	 * @param string $q - query
	 * @return int
	 */
	function execute($q);
	
	/**
	 * Return a single row of data
	 * 
	 * @param query $q
	 * @return Array
	 */
	function get($q);
	
	/**
	 * Escape a string
	 * 
	 * @param string $s
	 * @return string
	 */
	function escape($s);
	
}