<?php

require_once(dirname(__FILE__).'/vboxconnector.php');

class vboxprodconnector extends vboxconnector {
	
	
	/**
	 * Return a list of virtual machines along with their states and other basic info
	 *
	 * @param array $args array of arguments. See function body for details.
	 * @return array list of machines
	 */
	public function remote_vboxGetMachines($args) {
	
		// Connect to vboxwebsrv
		$this->connect();
	
		$vmlist = array();
	
		// Look for a request for a single vm
		if($args['vm']) {
				
			$machines = array($this->vbox->findMachine($args['vm']));
	
			// Full list
		} else {
			//Get a list of registered machines
			$machines = $this->vbox->machines;
				
		}
	
	
	
		foreach ($machines as $machine) { /* @var $machine IMachine */
	
	
			try {
	
				$vmlist[] = array(
						'name' => @$this->settings->enforceVMOwnership ? preg_replace('/^' . preg_quote($_SESSION['user']) . '_/', '', $machine->name) : $machine->name,
						'state' => (string)$machine->state,
						'OSTypeId' => $machine->getOSTypeId(),
						'owner' => (@$this->settings->enforceVMOwnership ? $machine->getExtraData("phpvb/sso/owner") : ''),
						'group_id' => $groups,
						'lastStateChange' => (string)($machine->lastStateChange/1000),
						'id' => $machine->id,
						'currentStateModified' => $machine->currentStateModified,
						'sessionState' => (string)$machine->sessionState,
						'currentSnapshotName' => ($machine->currentSnapshot->handle ? $machine->currentSnapshot->name : ''),
						'customIcon' => (@$this->settings->enableCustomIcons ? $machine->getExtraData('phpvb/icon') : '')
				);
				if($machine->currentSnapshot->handle) $machine->currentSnapshot->releaseRemote();
	
	
			} catch (Exception $e) {
	
				if($machine) {
	
					$response['data']['vmlist'][] = array(
							'name' => $machine->id,
							'state' => 'Inaccessible',
							'OSTypeId' => 'Other',
							'id' => $machine->id,
							'sessionState' => 'Inaccessible',
							'lastStateChange' => 0,
							'currentSnapshot' => ''
					);
	
				} else {
					$this->errors[] = $e;
				}
			}
	
			try {
				$machine->releaseRemote();
			} catch (Exception $e) { }
		}
	
		return $vmlist;
	
	}
	
}