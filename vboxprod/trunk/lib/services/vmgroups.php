<?php
/**
 * 
 * @author ian_moore
 *
 */

class service_vmgroups extends service {
	
	function remote_getGroupsList($args) {
		return app::getStorage()->query("select id, name, parent_id from vmgroups where server_id = ".
				int($args['server_id']) ." order by `order` asc");
	}
	
}
