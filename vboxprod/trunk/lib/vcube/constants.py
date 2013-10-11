"""
    Application constants
"""

__all__ = ['TASK_STATUS', 'TASK_STATUS_TEXT', 'CONNECTOR_STATES','CONNECTOR_STATES_TEXT','SEVERITY','SEVERITY_TEXT','LOG_CATEGORY','LOG_CATEGORY_TEXT']

TASK_STATUS = {
    'STARTED' : 0,
    'COMPLETED' : 1,
    'ERROR' : 2,
    'CANCELED' : 3,
    'INPROGRESS' : 4
}

TASK_STATUS_TEXT = {
    0 : 'Started',
    1 : 'Completed',
    2 : 'Error',
    3 : 'Canceled',
    4 : 'In progress'
}

CONNECTOR_STATES = {
    'DISABLED' : -1,
    'DISCONNECTED' : 0,
    'ERROR' : 20,
    'REGISTERING' : 30,
    'RUNNING' : 100
}

CONNECTOR_STATES_TEXT = {
    -1: 'Disabled',
    0 : 'Disconnected',
    20 : 'Error',
    30 : 'Registering',
    100 : 'Running'
}

SEVERITY = {
    'CRITICAL' : 10,
    'ERROR' : 8,
    'WARNING' : 6,
    'INFO' : 4
}

SEVERITY_TEXT = {
   10 : 'Critical',
   8 : 'Error',
   6 : 'Warning',
   4 : 'Info'
}

LOG_CATEGORY = {
   'VCUBE' : 0,
   'CONFIGURATION' : 5,
   'STATE_CHANGE' : 10,
   'SNAPSHOT' : 15,
   'MEDIA' : 20
}

LOG_CATEGORY_TEXT = {
   0 : 'vCube',
   5 : 'Configuration change',
   10 : 'State change',
   15 : 'Snapshot',
   20 : 'Media'
}

