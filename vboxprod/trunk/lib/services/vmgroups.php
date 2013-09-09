<?php
/**
 * 
 * @author ian_moore
 *
 */

class service_vmgroups extends service {
	
	function remote_getGroupsList() {
		return app::getStorage()->query("select id, name, parent_id from vmgroups order by `order` asc");
	}
	
}
