<?php
/**
 * Service parent class
 */

class service {
	
	/**
	 * Array of request data that should be passed back to
	 * this function again
	 * @var Array | null
	 */
	var $persistentRequest = null;
	
	/**
	 * Array of exceptions caught during method execution
	 * @var Array
	 */
	var $errors = Array();
	
	/**
	 * Array of debug messages to be displayed in the browser's
	 * console
	 * @var Array
	 */
	var $messages = Array();
	
	/**
	 * Call overloader.
	 * Returns result of method call. Here is where python's decorators would come in handy.
	 *
	 * @param string $fn method to call
	 * @param array $args arguments for method
	 * @throws Exception
	 * @return array
	 */
	function __call($fn,$args) {
	
		$req = &$args[0];

		# Access to undefined methods prefixed with remote_
		if(method_exists($this,'remote_'.$fn)) {
	
			$this->calledMethod = $fn;
			$args[1][0]['data']['responseData'] = $this->{'remote_'.$fn}($req);
			$args[1][0]['data']['success'] = 1;
				
		// Not found
		} else {
	
			throw new Exception('Undefined method: ' . $fn ." - Try clearing your web browser's cache.");
	
		}
	
		return $response;
	}
	
}