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
import subprocess

class AnsiblePlaybookGenerator:
    def __init__(self, output_dir="/home/sarra/ansible/generated_playbooks"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    def generate_vlan_playbook(self, switch_ip, vlan_id, vlan_name, interfaces=None):
        """Generate a playbook for VLAN creation using ios_command for NM-16ESW/old-style devices"""
        playbook = {
            'name': f'Create VLAN {vlan_id} - {vlan_name}',
            'hosts': 'all',
            'gather_facts': False,
            'vars': {
                'ansible_network_os': 'ios',
                'ansible_connection': 'network_cli',
                'vlan_id': int(vlan_id),
                'vlan_name': vlan_name,
                'interfaces': interfaces or []
            },
            'tasks': [
                {
                    'name': f'Ensure VLAN {vlan_id} exists (old-style NM-16ESW)',
                    'ios_command': {
                        'commands': [
                            'vlan database',
                            f'vlan {vlan_id} name {vlan_name}',
                            'exit'
                        ]
                    }
                }
            ]
        }
        
        # Add interface configuration if provided (still use ios_config for this part)
        if interfaces:
            for interface in interfaces:
                playbook['tasks'].append({
                    'name': f'Configure {interface} as access port for VLAN {vlan_id}',
                    'ios_config': {
                        'lines': [
                            f'interface {interface}',
                            f'switchport access vlan {vlan_id}',
                            'exit'
                        ]
                    }
                })
        
        return self._save_playbook(playbook, f"vlan_{vlan_id}_{vlan_name}")
    
    def generate_ssh_playbook(self, switch_ip, ssh_enabled=True, ssh_port=22, allowed_ips=None):
        """Generate a playbook for SSH configuration"""
        playbook = {
            'name': 'Configure SSH Access',
            'hosts': 'all',
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
                        ]
                    }
                }
            ]
        }
        
        if allowed_ips:
            for ip in allowed_ips:
                playbook['tasks'].append({
                    'name': f'Allow SSH access from {ip}',
                    'ios_config': {
                        'lines': [f'ip ssh server access-list {ip}']
                    }
                })
        
        return self._save_playbook(playbook, "ssh_configuration")
    
    def generate_dhcp_playbook(self, switch_ip, pool_name, network_address, subnet_mask, default_gateway, dns_server, start_ip, end_ip, lease_time, enabled=True):
        """Generate a playbook for DHCP configuration"""
        playbook = {
            'name': f'Configure DHCP Pool {pool_name}',
            'hosts': 'all',
            'gather_facts': False,
            'vars': {
                'ansible_network_os': 'ios',
                'ansible_connection': 'network_cli',
                'enabled': enabled
            },
            'tasks': []
        }
        
        if enabled:
            # Configure DHCP pool
            playbook['tasks'].append({
                'name': f'Configure DHCP pool {pool_name}',
                'ios_config': {
                    'lines': [
                        f'ip dhcp pool {pool_name}',
                        f'network {network_address} {subnet_mask}',
                        f'default-router {default_gateway}',
                        f'dns-server {dns_server if dns_server else "8.8.8.8"}',
                        f'lease {lease_time}',
                        'exit'
                    ]
                }
            })
            
            # Configure DHCP excluded addresses (reserved range)
            playbook['tasks'].append({
                'name': f'Configure DHCP excluded addresses {start_ip} to {end_ip}',
                'ios_config': {
                    'lines': [
                        f'ip dhcp excluded-address {start_ip} {end_ip}'
                    ]
                }
            })
            
            # Enable DHCP service
            playbook['tasks'].append({
                'name': 'Enable DHCP service',
                'ios_config': {
                    'lines': [
                        'service dhcp'
                    ]
                }
            })
        
        return self._save_playbook(playbook, f"dhcp_{pool_name}")
    
    def generate_nat_playbook(self, switch_ip, nat_rules=None, enabled=True):
        """Generate a playbook for NAT configuration"""
        playbook = {
            'name': 'Configure NAT',
            'hosts': 'all',
            'gather_facts': False,
            'vars': {
                'ansible_network_os': 'ios',
                'ansible_connection': 'network_cli',
                'nat_rules': nat_rules or [],
                'enabled': enabled
            },
            'tasks': []
        }
        
        if enabled and nat_rules:
            for rule in nat_rules:
                playbook['tasks'].append({
                    'name': f'Configure NAT rule: {rule.get("name", "default")}',
                    'ios_config': {
                        'lines': [
                            f'ip nat inside source list {rule.get("acl", "1")} interface {rule.get("outside_interface", "GigabitEthernet0/0")} overload'
                        ]
                    }
                })
        
        return self._save_playbook(playbook, "nat_configuration")
    
    def generate_stp_playbook(self, switch_ip, enabled=True, mode='pvst', port_configs=None):
        """Generate a playbook for STP configuration"""
        playbook = {
            'name': 'Configure Spanning Tree Protocol',
            'hosts': 'all',
            'gather_facts': False,
            'vars': {
                'ansible_network_os': 'ios',
                'ansible_connection': 'network_cli',
                'enabled': enabled,
                'mode': mode,
                'port_configs': port_configs or []
            },
            'tasks': [
                {
                    'name': f'Configure STP mode: {mode}',
                    'ios_config': {
                        'lines': [f'spanning-tree mode {mode}']
                    }
                }
            ]
        }
        
        if port_configs:
            for port_config in port_configs:
                playbook['tasks'].append({
                    'name': f'Configure STP for port {port_config.get("interface")}',
                    'ios_config': {
                        'lines': [
                            f'interface {port_config.get("interface")}',
                            f'spanning-tree portfast {port_config.get("portfast", "disable")}',
                            f'spanning-tree cost {port_config.get("cost", "100")}',
                            'exit'
                        ]
                    }
                })
        
        return self._save_playbook(playbook, "stp_configuration")
    
    def generate_etherchannel_playbook(self, switch_ip, enabled=True, groups=None):
        """Generate a playbook for EtherChannel configuration"""
        playbook = {
            'name': 'Configure EtherChannel',
            'hosts': 'all',
            'gather_facts': False,
            'vars': {
                'ansible_network_os': 'ios',
                'ansible_connection': 'network_cli',
                'enabled': enabled,
                'groups': groups or []
            },
            'tasks': []
        }
        
        if enabled and groups:
            for group in groups:
                playbook['tasks'].append({
                    'name': f'Configure EtherChannel group {group.get("group_id")}',
                    'ios_config': {
                        'lines': [
                            f'interface Port-channel {group.get("group_id")}',
                            f'channel-protocol {group.get("protocol", "lacp")}',
                            'exit'
                        ]
                    }
                })
                
                for interface in group.get('interfaces', []):
                    playbook['tasks'].append({
                        'name': f'Add {interface} to EtherChannel group {group.get("group_id")}',
                        'ios_config': {
                            'lines': [
                                f'interface {interface}',
                                f'channel-group {group.get("group_id")} mode {group.get("mode", "active")}',
                                'exit'
                            ]
                        }
                    })
        
        return self._save_playbook(playbook, "etherchannel_configuration")
    
    def generate_routing_playbook(self, switch_ip, static_routes=None, dynamic_routing=False):
        """Generate a playbook for routing configuration"""
        playbook = {
            'name': 'Configure Routing',
            'hosts': 'all',
            'gather_facts': False,
            'vars': {
                'ansible_network_os': 'ios',
                'ansible_connection': 'network_cli',
                'static_routes': static_routes or [],
                'dynamic_routing': dynamic_routing
            },
            'tasks': []
        }
        
        if static_routes:
            for route in static_routes:
                playbook['tasks'].append({
                    'name': f'Configure static route: {route.get("network")} via {route.get("next_hop")}',
                    'ios_config': {
                        'lines': [
                            f'ip route {route.get("network")} {route.get("subnet")} {route.get("next_hop")}'
                        ]
                    }
                })
        
        if dynamic_routing:
            playbook['tasks'].append({
                'name': 'Enable OSPF routing',
                'ios_config': {
                    'lines': [
                        'router ospf 1',
                        'network 0.0.0.0 255.255.255.255 area 0',
                        'exit'
                    ]
                }
            })
        
        return self._save_playbook(playbook, "routing_configuration")
    
    def generate_port_security_playbook(self, switch_ip, port_configs=None):
        """Generate a playbook for port security configuration"""
        playbook = {
            'name': 'Configure Port Security',
            'hosts': 'all',
            'gather_facts': False,
            'vars': {
                'ansible_network_os': 'ios',
                'ansible_connection': 'network_cli',
                'port_configs': port_configs or []
            },
            'tasks': []
        }
        
        if port_configs:
            for port_config in port_configs:
                playbook['tasks'].append({
                    'name': f'Configure port security for {port_config.get("interface")}',
                    'ios_config': {
                        'lines': [
                            f'interface {port_config.get("interface")}',
                            'switchport mode access',
                            'switchport port-security',
                            f'switchport port-security maximum {port_config.get("max_mac", "1")}',
                            f'switchport port-security violation {port_config.get("violation", "shutdown")}',
                            'exit'
                        ]
                    }
                })
        
        return self._save_playbook(playbook, "port_security_configuration")
    
    def generate_dhcp_snooping_playbook(self, switch_ip, enabled=True, trusted_ports=None):
        """Generate a playbook for DHCP snooping configuration"""
        playbook = {
            'name': 'Configure DHCP Snooping',
            'hosts': 'all',
            'gather_facts': False,
            'vars': {
                'ansible_network_os': 'ios',
                'ansible_connection': 'network_cli',
                'enabled': enabled,
                'trusted_ports': trusted_ports or []
            },
            'tasks': [
                {
                    'name': 'Enable DHCP snooping globally',
                    'ios_config': {
                        'lines': ['ip dhcp snooping']
                    }
                }
            ]
        }
        
        if trusted_ports:
            for port in trusted_ports:
                playbook['tasks'].append({
                    'name': f'Configure {port} as trusted port',
                    'ios_config': {
                        'lines': [
                            f'interface {port}',
                            'ip dhcp snooping trust',
                            'exit'
                        ]
                    }
                })
        
        return self._save_playbook(playbook, "dhcp_snooping_configuration")
    
    def generate_hostname_playbook(self, switch_ip, hostname, management_ip=None):
        """Generate a playbook for hostname and management IP configuration"""
        playbook = {
            'name': 'Configure Hostname and Management IP',
            'hosts': 'all',
            'gather_facts': False,
            'vars': {
                'ansible_network_os': 'ios',
                'ansible_connection': 'network_cli',
                'hostname': hostname,
                'management_ip': management_ip
            },
            'tasks': [
                {
                    'name': f'Set hostname to {hostname}',
                    'ios_config': {
                        'lines': [f'hostname {hostname}']
                    }
                }
            ]
        }
        
        if management_ip:
            playbook['tasks'].append({
                'name': f'Configure management IP {management_ip}',
                'ios_config': {
                    'lines': [
                        'interface Vlan1',
                        f'ip address {management_ip} 255.255.255.0',
                        'no shutdown',
                        'exit'
                    ]
                }
            })
        
        return self._save_playbook(playbook, "hostname_configuration")
    
    def _save_playbook(self, playbook, name):
        """Save the playbook to a YAML file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{name}_{timestamp}.yml"
        filepath = self.output_dir / filename
        
        with open(filepath, 'w') as f:
            yaml.dump([playbook], f, default_flow_style=False, sort_keys=False)
        
        return str(filepath)
    
    def generate_inventory(self, target_ip, username="sarra", password="sarra"):
        """Generate an inventory file for the target device"""
        inventory = {
            'all': {
                'hosts': {
                    'switch1': {
                        'ansible_host': target_ip,
                        'ansible_user': username,
                        'ansible_password': password,
                        'ansible_connection': 'ansible.netcommon.network_cli',
                        'ansible_network_os': 'cisco.ios.ios',
                        'ansible_become': True,
                        'ansible_become_method': 'enable'
                    }
                }
            }
        }
        
        inventory_path = self.output_dir / "inventory.yml"
        with open(inventory_path, 'w') as f:
            yaml.dump(inventory, f, default_flow_style=False)
        
        return str(inventory_path)

    @staticmethod
    def generate_acl_playbook(filename, acl_number, permit_subnet, permit_wildcard):
        playbook = f"""---
- name: Configure ACL on switch1
  hosts: switch1
  gather_facts: no
  connection: network_cli
  tasks:
    - name: Configure ACL
      cisco.ios.ios_config:
        lines:
          - access-list {acl_number} permit {permit_subnet} {permit_wildcard}
          - access-list {acl_number} deny any
    - name: Show ACLs
      cisco.ios.ios_command:
        commands:
          - show access-lists
      register: acl_output
    - name: Print ACL output
      debug:
        var: acl_output.stdout_lines
"""
        with open(filename, "w") as f:
            f.write(playbook)

    @staticmethod
    def run_playbook(playbook_file, inventory_file="inventory"):
        result = subprocess.run(
            ["ansible-playbook", "-i", inventory_file, playbook_file],
            capture_output=True, text=True
        )
        return result.stdout

def main():
    """Main function to handle command line usage"""
    if len(sys.argv) < 3:
        print("Usage: python3 playbook_generator.py <action> <target_ip> [options...]")
        print("Actions: vlan, ssh, dhcp, nat, stp, etherchannel, routing, port_security, dhcp_snooping, hostname")
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
            
        elif action == "dhcp":
            dhcp_pools = json.loads(sys.argv[3]) if len(sys.argv) > 3 else None
            enabled = True
            
            playbook_path = generator.generate_dhcp_playbook(target_ip, dhcp_pools, enabled)
            inventory_path = generator.generate_inventory(target_ip)
            
            print(f"Generated playbook: {playbook_path}")
            print(f"Generated inventory: {inventory_path}")
            
        elif action == "nat":
            nat_rules = json.loads(sys.argv[3]) if len(sys.argv) > 3 else None
            enabled = True
            
            playbook_path = generator.generate_nat_playbook(target_ip, nat_rules, enabled)
            inventory_path = generator.generate_inventory(target_ip)
            
            print(f"Generated playbook: {playbook_path}")
            print(f"Generated inventory: {inventory_path}")
            
        elif action == "stp":
            enabled = len(sys.argv) > 3 and sys.argv[3].lower() == "true"
            mode = sys.argv[4] if len(sys.argv) > 4 else 'pvst'
            port_configs = json.loads(sys.argv[5]) if len(sys.argv) > 5 else None
            
            playbook_path = generator.generate_stp_playbook(target_ip, enabled, mode, port_configs)
            inventory_path = generator.generate_inventory(target_ip)
            
            print(f"Generated playbook: {playbook_path}")
            print(f"Generated inventory: {inventory_path}")
            
        elif action == "etherchannel":
            enabled = len(sys.argv) > 3 and sys.argv[3].lower() == "true"
            groups = json.loads(sys.argv[4]) if len(sys.argv) > 4 else None
            
            playbook_path = generator.generate_etherchannel_playbook(target_ip, enabled, groups)
            inventory_path = generator.generate_inventory(target_ip)
            
            print(f"Generated playbook: {playbook_path}")
            print(f"Generated inventory: {inventory_path}")
            
        elif action == "routing":
            static_routes = json.loads(sys.argv[3]) if len(sys.argv) > 3 else None
            dynamic_routing = len(sys.argv) > 4 and sys.argv[4].lower() == "true"
            
            playbook_path = generator.generate_routing_playbook(target_ip, static_routes, dynamic_routing)
            inventory_path = generator.generate_inventory(target_ip)
            
            print(f"Generated playbook: {playbook_path}")
            print(f"Generated inventory: {inventory_path}")
            
        elif action == "port_security":
            port_configs = json.loads(sys.argv[3]) if len(sys.argv) > 3 else None
            
            playbook_path = generator.generate_port_security_playbook(target_ip, port_configs)
            inventory_path = generator.generate_inventory(target_ip)
            
            print(f"Generated playbook: {playbook_path}")
            print(f"Generated inventory: {inventory_path}")
            
        elif action == "dhcp_snooping":
            enabled = len(sys.argv) > 3 and sys.argv[3].lower() == "true"
            trusted_ports = json.loads(sys.argv[4]) if len(sys.argv) > 4 else None
            
            playbook_path = generator.generate_dhcp_snooping_playbook(target_ip, enabled, trusted_ports)
            inventory_path = generator.generate_inventory(target_ip)
            
            print(f"Generated playbook: {playbook_path}")
            print(f"Generated inventory: {inventory_path}")
            
        elif action == "hostname":
            hostname = sys.argv[3]
            management_ip = sys.argv[4] if len(sys.argv) > 4 else None
            
            playbook_path = generator.generate_hostname_playbook(target_ip, hostname, management_ip)
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
 