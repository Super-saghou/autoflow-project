import sys
import json
import warnings
from netmiko import ConnectHandler

# Suppress deprecation warnings
warnings.filterwarnings("ignore", category=DeprecationWarning, module="cryptography")
warnings.filterwarnings("ignore", category=DeprecationWarning, module="paramiko")

def main():
    data = json.load(sys.stdin)
    switch_ip = data['switchIp']
    acl_number = data['aclNumber']
    rules = data['rules']

    device = {
        'device_type': 'cisco_ios',
        'ip': switch_ip,
        'username': 'sarra',
        'password': 'sarra',
    }

    commands = [f'access-list {acl_number} {rule}' for rule in rules]

    try:
        with ConnectHandler(**device) as net_connect:
            output = net_connect.send_config_set(commands)
            print(json.dumps({'success': True, 'output': output}))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))

if __name__ == '__main__':
    main() 