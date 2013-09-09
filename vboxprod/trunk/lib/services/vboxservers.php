<?php
/**
 * Wrapper for remote application level functions
 * @author ian_moore
 *
 */
require_once(dirname(dirname(__FILE__)).'/service.php');

class service_vboxservers extends service {
	
	function remote_getServerList() {
		$fields = 'id, name';
		//if(app::getUser()->isAdmin())
			$fields = '*';
		return app::getStorage()->query("select * from vboxservers");
	}	
}
