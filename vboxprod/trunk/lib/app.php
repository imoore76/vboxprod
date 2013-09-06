<?php
/**
 * Main application class
 * @author ian_moore
 *
 */

// Use session object
require_once(dirname(__FILE__).'/session.php');

class app {
	
	/**
	 * Error number describing a fatal error
	 * @var integer
	 */
	const ERRNO_FATAL = 32;
	
	/**
	 * Error number describing a connection error
	 * @var integer
	 */
	const ERRNO_CONNECT = 64;
	
	/**
	 * Application instance
	 * @var Object
	 */
	private static $instance = null;
	
	/**
	 * Hold config information
	 * @var Array | null if not read
	 */
	private static $config = null;
	
	/**
	 * DB connection object
	 * @var Object
	 */
	private static $storage = null;
	
	/**
	 * Holds session data
	 * @var Array | null
	 */
	var $session = null;
	
	/**
	 * Initialize session handlers and data
	 * on connect
	 */
	function __construct() {
		
		$session = new session();
		
		// set our custom session functions.
		session_set_save_handler(array($session, 'open'), array($session, 'close'), array($session, 'read'), array($session, 'write'), array($session, 'destroy'), array($session, 'gc'));
		
		// This line prevents unexpected effects when using objects as save handlers.
		register_shutdown_function('session_write_close');
		
		session_start();
		
	}
	
	/**
	 * Return application instance
	 */
	static function getInstance() {
		if(!self::$instance) {
			self::$instance = new app();
		}
		return self::$instance;
	}
	
	/**
	 * Get configuration array
	 * @return multitype: configuration array
	 */
	static function getConfig() {

		if(!self::$config) {
			
			$configFile = dirname(dirname(__FILE__)) .'/config.php';
			
			if(!file_exists($configFile))
				throw new Exception('No configuration file found.');
			
			$config = include_once($configFile);
				
			if(!is_array($config))
				throw new Exception("config.php has an invalid format");
			
			self::$config = $config;
		}
			
		
		return self::$config;
	}
	
	/**
	 * Get storage object reference
	 * @return object
	 */
	static function getStorage() {
	
		// Return connection if it exists
		if(self::$storage) return self::$storage;
	
		// Get configuration
		$config = self::getConfig();
		
	
		if(empty($config['dbType'])) $config['dbType'] = 'mysql';
		$config['dbType'] = preg_replace('[^a-z]','',$config['dbType']);
	
		require_once(dirname(__FILE__).'/db/'.$config['dbType'].'connector.php');
	
		$sqlClass = $config['dbType'].'connector';
		self::$storage = new $sqlClass();
	
		return self::$storage;
	
	}
	
	
	/**
	 * Get a service object
	 */
	function getService($service) {
		
		/*
		 * Include service file
		*/
		$service = preg_replace('[^a-z]','',$service);
		$serviceFile = dirname(__FILE__).'/services/'.$service .'.php';
		if(!@file_exists($serviceFile)) {
			throw new Exception("Unknown service: " . $service);
		}
		include_once($serviceFile);
		
		
		/*
		 * Instantiate class
		*/
		$serviceClass = 'service_'.$service;
		return new $serviceClass();
				
	}
	
}