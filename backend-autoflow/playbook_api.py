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
            ['ansible-playbook', '-i', inventory_path, playbook_path],
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
        # First generate the playbook
        generate_response = generate_playbook()
        
        if generate_response.status_code != 200:
            return generate_response
        
        generate_data = generate_response.get_json()
        
        # Then execute the playbook
        execute_data = {
            'playbook_path': generate_data['playbook_path'],
            'inventory_path': generate_data['inventory_path']
        }
        
        execute_response = execute_playbook()
        
        if execute_response.status_code != 200:
            return execute_response
        
        execute_data = execute_response.get_json()
        
        return jsonify({
            'success': True,
            'message': 'Playbook generated and executed successfully',
            'playbook_path': generate_data['playbook_path'],
            'inventory_path': generate_data['inventory_path'],
            'execution_output': execute_data.get('output', ''),
            'execution_stderr': execute_data.get('stderr', '')
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Ansible Playbook Generator API',
        'version': '1.0.0'
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
