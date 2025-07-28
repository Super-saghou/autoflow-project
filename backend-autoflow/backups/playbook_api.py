#!/usr/bin/env python3
"""
Flask API for Ansible Playbook Generation
Handles requests from the frontend to generate and execute Ansible playbooks.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import json
import os
import sys
from pathlib import Path
from playbook_generator import AnsiblePlaybookGenerator
from netmiko import ConnectHandler
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize the playbook generator
generator = AnsiblePlaybookGenerator()

@app.route('/api/generate-playbook', methods=['POST'])
def generate_playbook():
    """Generate an Ansible playbook based on the request data"""
    try:
        data = request.get_json()
        action = data.get('action')
        target_ip = data.get('target_ip')
        
        if not action or not target_ip:
            return jsonify({'error': 'Action and target_ip are required'}), 400
        
        # Generate inventory file
        inventory_path = generator.generate_inventory(target_ip)
        
        if action == 'vlan':
            vlan_id = data.get('vlan_id')
            vlan_name = data.get('vlan_name')
            interfaces = data.get('interfaces', [])
            
            if not vlan_id or not vlan_name:
                return jsonify({'error': 'VLAN ID and VLAN name are required'}), 400
            
            playbook_path = generator.generate_vlan_playbook(target_ip, vlan_id, vlan_name, interfaces)
            
        elif action == 'ssh':
            ssh_enabled = data.get('ssh_enabled', True)
            ssh_port = data.get('ssh_port', 22)
            allowed_ips = data.get('allowed_ips', [])
            
            playbook_path = generator.generate_ssh_playbook(target_ip, ssh_enabled, ssh_port, allowed_ips)
            
        elif action == 'dhcp':
            dhcp_pools = data.get('dhcp_pools', [])
            enabled = data.get('enabled', True)
            
            playbook_path = generator.generate_dhcp_playbook(target_ip, dhcp_pools, enabled)
            
        elif action == 'nat':
            nat_rules = data.get('nat_rules', [])
            enabled = data.get('enabled', True)
            
            playbook_path = generator.generate_nat_playbook(target_ip, nat_rules, enabled)
            
        elif action == 'stp':
            enabled = data.get('enabled', True)
            mode = data.get('mode', 'pvst')
            port_configs = data.get('port_configs', [])
            
            playbook_path = generator.generate_stp_playbook(target_ip, enabled, mode, port_configs)
            
        elif action == 'etherchannel':
            enabled = data.get('enabled', True)
            groups = data.get('groups', [])
            
            playbook_path = generator.generate_etherchannel_playbook(target_ip, enabled, groups)
            
        elif action == 'routing':
            static_routes = data.get('static_routes', [])
            dynamic_routing = data.get('dynamic_routing', False)
            
            playbook_path = generator.generate_routing_playbook(target_ip, static_routes, dynamic_routing)
            
        elif action == 'port_security':
            port_configs = data.get('port_configs', [])
            
            playbook_path = generator.generate_port_security_playbook(target_ip, port_configs)
            
        elif action == 'dhcp_snooping':
            enabled = data.get('enabled', True)
            trusted_ports = data.get('trusted_ports', [])
            
            playbook_path = generator.generate_dhcp_snooping_playbook(target_ip, enabled, trusted_ports)
            
        elif action == 'hostname':
            hostname = data.get('hostname')
            management_ip = data.get('management_ip')
            
            if not hostname:
                return jsonify({'error': 'Hostname is required'}), 400
            
            playbook_path = generator.generate_hostname_playbook(target_ip, hostname, management_ip)
            
        else:
            return jsonify({'error': f'Unknown action: {action}'}), 400
        
        return jsonify({
            'success': True,
            'playbook_path': playbook_path,
            'inventory_path': inventory_path,
            'message': f'Playbook generated successfully for {action}'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/execute-playbook', methods=['POST'])
def execute_playbook():
    """Execute a generated Ansible playbook"""
    try:
        data = request.get_json()
        playbook_path = data.get('playbook_path')
        inventory_path = data.get('inventory_path')
        
        if not playbook_path or not inventory_path:
            return jsonify({'error': 'Playbook path and inventory path are required'}), 400
        
        # Check if files exist
        if not os.path.exists(playbook_path):
            return jsonify({'error': f'Playbook file not found: {playbook_path}'}), 404
        
        if not os.path.exists(inventory_path):
            return jsonify({'error': f'Inventory file not found: {inventory_path}'}), 404
        
        # Execute the playbook
        result = subprocess.run(
            ['ansible-playbook', '-i', inventory_path, playbook_path, '-v'],
            capture_output=True,
            text=True,
            cwd='/home/sarra/ansible'
        )
        
        if result.returncode == 0:
            return jsonify({
                'success': True,
                'message': 'Playbook executed successfully',
                'output': result.stdout,
                'stderr': result.stderr
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Playbook execution failed',
                'output': result.stdout,
                'stderr': result.stderr,
                'return_code': result.returncode
            }), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-and-execute', methods=['POST'])
def generate_and_execute():
    """Generate and execute a playbook in one request"""
    try:
        data = request.get_json()
        action = data.get('action')
        target_ip = data.get('target_ip')
        
        if not action or not target_ip:
            return jsonify({'error': 'Action and target_ip are required'}), 400
        
        # Generate inventory file
        inventory_path = generator.generate_inventory(target_ip)
        playbook_path = None
        
        # Generate the appropriate playbook based on action
        if action == 'vlan':
            vlan_id = data.get('vlan_id')
            vlan_name = data.get('vlan_name')
            interfaces = data.get('interfaces', [])
            
            if not vlan_id or not vlan_name:
                return jsonify({'error': 'VLAN ID and VLAN name are required'}), 400
            
            playbook_path = generator.generate_vlan_playbook(target_ip, vlan_id, vlan_name, interfaces)
            
        elif action == 'ssh':
            ssh_enabled = data.get('ssh_enabled', True)
            ssh_port = data.get('ssh_port', 22)
            allowed_ips = data.get('allowed_ips', [])
            
            playbook_path = generator.generate_ssh_playbook(target_ip, ssh_enabled, ssh_port, allowed_ips)
            
        elif action == 'dhcp':
            dhcp_pools = data.get('dhcp_pools', [])
            enabled = data.get('enabled', True)
            
            playbook_path = generator.generate_dhcp_playbook(target_ip, dhcp_pools, enabled)
            
        elif action == 'nat':
            nat_rules = data.get('nat_rules', [])
            enabled = data.get('enabled', True)
            
            playbook_path = generator.generate_nat_playbook(target_ip, nat_rules, enabled)
            
        elif action == 'stp':
            enabled = data.get('enabled', True)
            mode = data.get('mode', 'pvst')
            port_configs = data.get('port_configs', [])
            
            playbook_path = generator.generate_stp_playbook(target_ip, enabled, mode, port_configs)
            
        elif action == 'etherchannel':
            enabled = data.get('enabled', True)
            groups = data.get('groups', [])
            
            playbook_path = generator.generate_etherchannel_playbook(target_ip, enabled, groups)
            
        elif action == 'routing':
            static_routes = data.get('static_routes', [])
            dynamic_routing = data.get('dynamic_routing', False)
            
            playbook_path = generator.generate_routing_playbook(target_ip, static_routes, dynamic_routing)
            
        elif action == 'port_security':
            port_configs = data.get('port_configs', [])
            
            playbook_path = generator.generate_port_security_playbook(target_ip, port_configs)
            
        elif action == 'dhcp_snooping':
            enabled = data.get('enabled', True)
            trusted_ports = data.get('trusted_ports', [])
            
            playbook_path = generator.generate_dhcp_snooping_playbook(target_ip, enabled, trusted_ports)
            
        elif action == 'hostname':
            hostname = data.get('hostname')
            management_ip = data.get('management_ip')
            
            if not hostname:
                return jsonify({'error': 'Hostname is required'}), 400
            
            playbook_path = generator.generate_hostname_playbook(target_ip, hostname, management_ip)
            
        else:
            return jsonify({'error': f'Unknown action: {action}'}), 400
        
        # Execute the playbook
        if not os.path.exists(playbook_path):
            return jsonify({'error': f'Generated playbook file not found: {playbook_path}'}), 404
        
        if not os.path.exists(inventory_path):
            return jsonify({'error': f'Generated inventory file not found: {inventory_path}'}), 404
        
        # Execute the playbook
        result = subprocess.run(
            ['ansible-playbook', '-i', inventory_path, playbook_path, '-v'],
            capture_output=True,
            text=True,
            cwd='/home/sarra/ansible'
        )
        
        if result.returncode == 0:
            return jsonify({
                'success': True,
                'message': f'{action} configuration applied successfully',
                'playbook_path': playbook_path,
                'inventory_path': inventory_path,
                'output': result.stdout,
                'stderr': result.stderr
            })
        else:
            return jsonify({
                'success': False,
                'message': f'{action} configuration failed',
                'playbook_path': playbook_path,
                'inventory_path': inventory_path,
                'output': result.stdout,
                'stderr': result.stderr,
                'return_code': result.returncode
            }), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/create-dhcp', methods=['POST'])
def create_dhcp():
    """Create a DHCP pool on the target switch"""
    try:
        data = request.get_json()
        pool_name = data.get('poolName')
        network_address = data.get('networkAddress')
        subnet_mask = data.get('subnetMask')
        default_gateway = data.get('defaultGateway')
        dns_server = data.get('dnsServer')
        start_ip = data.get('startIp')
        end_ip = data.get('endIp')
        lease_time = data.get('leaseTime', '24')
        switch_ip = data.get('switchIp', '192.168.111.198')
        
        print(f"Creating DHCP pool {pool_name} on {switch_ip}")
        print(f"Network: {network_address}/{subnet_mask}")
        print(f"Gateway: {default_gateway}, DNS: {dns_server}")
        print(f"Range: {start_ip} - {end_ip}, Lease: {lease_time} hours")
        
        # Generate inventory file
        inventory_path = generator.generate_inventory(switch_ip)
        
        # Generate playbook
        playbook_path = generator.generate_dhcp_playbook(
            switch_ip, pool_name, network_address, subnet_mask, 
            default_gateway, dns_server, start_ip, end_ip, lease_time
        )
        
        # Execute the playbook
        if not os.path.exists(playbook_path):
            return jsonify({'error': f'Generated playbook file not found: {playbook_path}'}), 404
        
        if not os.path.exists(inventory_path):
            return jsonify({'error': f'Generated inventory file not found: {inventory_path}'}), 404
        
        # Execute the playbook
        result = subprocess.run(
            ['ansible-playbook', '-i', inventory_path, playbook_path, '-v'],
            capture_output=True,
            text=True,
            cwd='/home/sarra/ansible'
        )
        
        if result.returncode == 0:
            return jsonify({
                'success': True,
                'message': f'DHCP pool {pool_name} created successfully',
                'playbook_path': playbook_path,
                'inventory_path': inventory_path,
                'output': result.stdout,
                'stderr': result.stderr
            })
        else:
            return jsonify({
                'success': False,
                'message': f'DHCP pool creation failed',
                'playbook_path': playbook_path,
                'inventory_path': inventory_path,
                'output': result.stdout,
                'stderr': result.stderr,
                'return_code': result.returncode
            }), 500
        
    except Exception as e:
        print(f"Error creating DHCP pool: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/list-vlans', methods=['POST'])
def list_vlans():
    data = request.get_json()
    switch_ip = data.get('switch_ip')
    if not switch_ip:
        return jsonify({'success': False, 'error': 'No switch IP provided'}), 400

    # Hardcoded credentials for debugging
    device = {
        'device_type': 'cisco_ios',
        'host': switch_ip,
        'username': 'sarra',
        'password': 'sarra',
        'secret': 'sarra',
    }
    print("Device settings:", device)
    try:
        net_connect = ConnectHandler(**device)
        if device['secret']:
            net_connect.enable()
        output = net_connect.send_command('show vlan-switch brief')
        vlans = []
        for line in output.splitlines():
            if line.strip() and line[0].isdigit():
                parts = line.split()
                if len(parts) >= 2:
                    vlans.append({'vlan_id': parts[0], 'vlan_name': parts[1]})
        return jsonify({'success': True, 'vlans': vlans})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/delete-vlan', methods=['POST'])
def delete_vlan():
    import traceback
    data = request.get_json()
    switch_ip = data.get('switch_ip')
    vlan_id = data.get('vlan_id')
    if not switch_ip or not vlan_id:
        return jsonify({'success': False, 'error': 'Missing switch_ip or vlan_id'}), 400

    device = {
        'device_type': 'cisco_ios',
        'host': switch_ip,
        'username': 'sarra',
        'password': 'sarra',
        'secret': 'sarra',
    }
    try:
        net_connect = ConnectHandler(**device)
        net_connect.enable()
        commands = [
            f'no vlan {vlan_id}',
            'write memory'
        ]
        output = net_connect.send_config_set(commands)
        return jsonify({'success': True, 'output': output})
    except Exception as e:
        print("Error deleting VLAN:", traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Ansible Playbook Generator API',
        'version': '1.0.0',
        'supported_actions': [
            'vlan', 'ssh', 'dhcp', 'nat', 'stp', 'etherchannel', 
            'routing', 'port_security', 'dhcp_snooping', 'hostname'
        ]
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
 