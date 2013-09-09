<?php
/**
 * Main ajax interface between JavaScript ajax calls and PHP functions.
 * Accepts JSON or simple GET requests, and returns JSON data.
 * 
 * @author Ian Moore (imoore76 at yahoo dot com)
 * @copyright Copyright (C) 2010-2013 Ian Moore (imoore76 at yahoo dot com)
 * @version $Id: ajax.php 531 2013-07-29 18:41:18Z imoore76 $
 * 
*/

/* Error reporting and exceptions */
function exception_error_handler($errno, $errstr, $errfile, $errline ) {
	if($errno & (E_NOTICE | E_STRICT | E_WARNING)) return;
	throw new ErrorException($errstr, $errno, 0, $errfile, $errline);
}
set_error_handler("exception_error_handler");


//Set no caching
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-store, no-cache, must-revalidate, post-check=0, pre-check=0");
header("Pragma: no-cache");

require_once(dirname(__FILE__).'/lib/app.php');
require_once(dirname(__FILE__).'/lib/utils.php');

/*
 * Clean request
 */
$cleanRequest = clean_request();

global $response;
$response = array('data'=>array('responseData'=>array()),'errors'=>array(),'persist'=>array(),'messages'=>array());

/**
 * Main try / catch. Logic dictated by incoming 'fn' request
 * parameter.
 */
try {
	
	/* Check for PHP version */
	if (!version_compare(PHP_VERSION, '5.2.0', '>=')) {
		throw new Exception('This application requires PHP >= 5.2.0, but this server is running version '. PHP_VERSION .'. Please upgrade PHP.');
	}

	/*
	 * Get service instance
	 */
	$service = app::getInstance()->getService($cleanRequest['service']);
	
	/*
	 *  Persistent request data
	*/
	if(is_array($cleanRequest['persist'])) {
		$service->persistentRequest = $cleanRequest['persist'];
	}
		
		
	/*
	 * Call to service
	*/
	if($cleanRequest['requestData']) {
		$rdata = $cleanRequest['requestData'];
	} else {
		$rdata = json_decode(file_get_contents('php://input'), true);
	}
	$service->$cleanRequest['fn']($rdata,array(&$response));
		
	/*
	 * Send back persistent request in response
	*/
	if(is_array($service->persistentRequest) && count($service->persistentRequest)) {
		$response['data']['persist'] = $service->persistentRequest;
	}
	

/*
 * Catch all exceptions and populate errors in the
 * JSON response data.
 */
} catch (Exception $e) {

	// Just append to $vbox->errors and let it get
	// taken care of below
	if(empty($service)) $service = new stdClass();
	if(empty($service->errors)) {
		$service->errors = array();
	}
	$service->errors[] = $e;
}


// Add any messages
if($service && !empty($service->messages) && count($service->messages)) {
	foreach($service->messages as $m)
		$response['messages'][] = $serviceName.'('.$cleanRequest['fn'] .'): ' . $m;
}
// Add other error info
if($service && $service->errors) {
	
	foreach($service->errors as $e) { /* @var $e Exception */ 
		
		ob_start();
		print_r($e);
		$d = ob_get_contents();
		ob_end_clean();
		
		$response['messages'][] = htmlentities($e->getMessage()).' ' . htmlentities($d);
		
		$response['errors'][] = array(
			/*'error'=>htmlentities($e->getMessage()),
			'details'=>htmlentities($d),*/
			'error'=>$e->getMessage(),
			'details'=>$d,
			'errno'=>$e->getCode(),
			// Fatal errors halt all processing
			'fatal'=>($e->getCode()==app::ERRNO_FATAL),
			// Connection errors display alternate servers options
			'connection'=>($e->getCode()==app::ERRNO_CONNECT)
		);
	}
}

/*
 * Return response as JSON encoded data or use PHP's
 * print_r to dump data to browser.
 */
if(isset($cleanRequest['printr'])) print_r($response);
else echo(json_encode($response));

