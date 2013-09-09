<?php
/**
 * Wrapper for remote application level functions
 * @author ian_moore
 *
 */

class service_vboxservers extends service {
	
	function remote_getServerList() {
		$fields = 'id, name';
		//if(app::getUser()->isAdmin())
			$fields = '*';
		return app::getStorage()->query("select {$fields} from vboxservers");
	}	
}
