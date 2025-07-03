#!/usr/bin/env python3
"""
Ansible Playbook Generator
Automatically generates Ansible playbooks based on user inputs from the web application.
"""

import json
import sys
import os
import yaml
from datetime import datetime
from pathlib import Path

class AnsiblePlaybookGenerator:
    def __init__(self, output_dir="/home/sarra/ansible/generated_playbooks"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    def generate_vlan_playbook(self, switch_ip, vlan_id, vlan_name, interfaces=None):
        """Generate a playbook for VLAN creation"""
        playbook = {
            'name': f'Create VLAN {vlan_id} - {vlan_name}',
            'hosts': 'targets',
            'gather_facts': False,
            'vars': {
                'ansible_network_os': 'ios',
                'ansible_connection': 'network_cli',
                'vlan_id': vlan_id,
                'vlan_name': vlan_name,
                'interfaces': interfaces or []
            },
            'tasks': [
                {
                    'name': f'Create VLAN {vlan_id}',
                    'ios_vlans': {
                        'config': [
                            {
                                'vlan_id': vlan_id,
                                'name': vlan_name
                            }
                        ],
                        'state': 'merged'
                    }
                }
            ]
        }
        
        # Add interface configuration if provided
        if interfaces:
            for interface in interfaces:
                playbook['tasks'].append({
                    'name': f'Configure {interface} as access port for VLAN {vlan_id}',
                    'ios_interfaces': {
                        'config': [
                            {
                                'name': interface,
                                'access': {
                                    'vlan': vlan_id
                                }
                            }
                        ],
                        'state': 'merged'
                    }
                })
        
        return self._save_playbook(playbook, f"vlan_{vlan_id}_{vlan_name}")
    
    def generate_ssh_playbook(self, switch_ip, ssh_enabled=True, ssh_port=22, allowed_ips=None):
        """Generate a playbook for SSH configuration"""
        playbook = {
            'name': 'Configure SSH Access',
            'hosts': 'targets',
            'gather_facts': False,
            'vars': {
                'ansible_network_os': 'ios',
                'ansible_connection': 'network_cli',
                'ssh_enabled': ssh_enabled,
                'ssh_port': ssh_port,
                'allowed_ips': allowed_ips or []
            },
            'tasks': [
                {
                    'name': 'Configure SSH',
                    'ios_config': {
                        'lines': [
                            'ip domain-name local.domain',
                            'crypto key generate rsa modulus 2048',
                            f'ip ssh port {ssh_port}',
                            'ip ssh version 2'
                        ],
                        'state': 'present'
                    }
                }
            ]
        }
        
        if allowed_ips:
            for ip in allowed_ips:
                playbook['tasks'].append({
                    'name': f'Allow SSH access from {ip}',
                    'ios_config': {
                        'lines': [f'ip ssh server access-list {ip}'],
                        'state': 'present'
                    }
                })
        
        return self._save_playbook(playbook, "ssh_configuration")
    
    def _save_playbook(self, playbook, name):
        """Save the playbook to a YAML file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{name}_{timestamp}.yml"
        filepath = self.output_dir / filename
        
        with open(filepath, 'w') as f:
            yaml.dump([playbook], f, default_flow_style=False, sort_keys=False)
        
        return str(filepath)
    
    def generate_inventory(self, target_ip, username="cisco", password="cisco"):
        """Generate an inventory file for the target device"""
        inventory = {
            'targets': {
                'hosts': {
                    target_ip: {
                        'ansible_network_os': 'ios',
                        'ansible_connection': 'network_cli',
                        'ansible_user': username,
                        'ansible_password': password,
                        'ansible_become': True,
                        'ansible_become_method': 'enable',
                        'ansible_become_password': password
                    }
                }
            }
        }
        
        inventory_path = self.output_dir / "inventory.yml"
        with open(inventory_path, 'w') as f:
            yaml.dump(inventory, f, default_flow_style=False)
        
        return str(inventory_path)

def main():
    """Main function to handle command line usage"""
    if len(sys.argv) < 3:
        print("Usage: python3 playbook_generator.py <action> <target_ip> [options...]")
        print("Actions: vlan, ssh")
        sys.exit(1)
    
    action = sys.argv[1]
    target_ip = sys.argv[2]
    
    generator = AnsiblePlaybookGenerator()
    
    try:
        if action == "vlan":
            if len(sys.argv) < 5:
                print("Usage: python3 playbook_generator.py vlan <target_ip> <vlan_id> <vlan_name> [interfaces...]")
                sys.exit(1)
            
            vlan_id = sys.argv[3]
            vlan_name = sys.argv[4]
            interfaces = sys.argv[5:] if len(sys.argv) > 5 else None
            
            playbook_path = generator.generate_vlan_playbook(target_ip, vlan_id, vlan_name, interfaces)
            inventory_path = generator.generate_inventory(target_ip)
            
            print(f"Generated playbook: {playbook_path}")
            print(f"Generated inventory: {inventory_path}")
            
        elif action == "ssh":
            ssh_enabled = len(sys.argv) > 3 and sys.argv[3].lower() == "true"
            ssh_port = int(sys.argv[4]) if len(sys.argv) > 4 else 22
            allowed_ips = sys.argv[5:] if len(sys.argv) > 5 else None
            
            playbook_path = generator.generate_ssh_playbook(target_ip, ssh_enabled, ssh_port, allowed_ips)
            inventory_path = generator.generate_inventory(target_ip)
            
            print(f"Generated playbook: {playbook_path}")
            print(f"Generated inventory: {inventory_path}")
            
        else:
            print(f"Action '{action}' not implemented yet")
            sys.exit(1)
            
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
