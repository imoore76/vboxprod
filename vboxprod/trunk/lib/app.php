<?php
/**
 * Main application class
 * @author ian_moore
 *
 */

// Use session object
require_once(dirname(__FILE__).'/session.php');
require_once(dirname(__FILE__).'/service.php');
require_once(dirname(__FILE__).'/modulefactory.php');

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
	 * Default configuration items
	 */
	private static $configDefaults = array(
		'dbType' => 'mysql',
		'accountsModule' => 'Builtin'
	);
	
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
	 * Return a configuration item or its default
	 */
	static function getConfigItem($item) {
		$config = self::getConfig();
		return (!empty($config[$item]) ? $config[$item] : (!empty(self::$configDefaults[$item]) ? self::$configDefaults[$item] : null));
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
	
		self::$storage = new modulefactory('storage',self::getConfigItem('dbType'));
		
		return self::$storage;
	
	}
	
	
	/**
	 * Get a service object
	 */
	function getService($service) {
		
		return service::getService($service);
	}
	
	/**
	 * Get current user
	 */
	function getUser() {
		$a = new modulefactory('accounts', self::getConfigItem('accountsModule'));
		return $a->getUser($_SESSION['userid']);
	}
	
	/**
	 * Log in to the application and return a session object
	 */
	function login($username, $password) {
		
		$a = new modulefactory('accounts', self::getConfigItem('accountsModule'));
		$user = $a->authenticate($username, $password);
		
		if(!empty($user['id'])) {
			$_SESSION['id'] = $user['id'];
			$_SESSION['userid'] = $user['userid'];
			$_SESSION['name'] = $user['name'];
			$_SESSION['group_id'] = $user['group_id'];
			return $_SESSION;
		} else {
			return array('id'=>0);
		}
	}
	
}