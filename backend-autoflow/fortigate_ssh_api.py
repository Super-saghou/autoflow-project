#!/usr/bin/env python3
"""
FortiGate SSH API for AutoFlow Platform
Uses SSH instead of HTTPS API for more reliable connection
"""

import paramiko
import json
import time
from typing import Dict, List, Optional, Any

class FortiGateSSHAPI:
    """FortiGate SSH API client for managing firewall operations"""
    
    def __init__(self, host: str, username: str = "admin", password: str = "admin"):
        self.host = host
        self.username = username
        self.password = password
        self.client = paramiko.SSHClient()
        self.client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        self.connected = False
        
    def connect(self) -> bool:
        """Connect to FortiGate via SSH"""
        try:
            self.client.connect(
                self.host,
                username=self.username,
                password=self.password,
                timeout=10
            )
            self.connected = True
            return True
        except Exception as e:
            print(f"SSH connection failed: {e}")
            return False
    
    def execute_command(self, command: str) -> Dict[str, Any]:
        """Execute a command on FortiGate using interactive shell"""
        if not self.connected:
            if not self.connect():
                return {"status": "error", "message": "Failed to connect"}
        
        try:
            # Use interactive shell for better command execution
            shell = self.client.invoke_shell()
            import time
            time.sleep(2)
            
            # Clear any initial output
            while shell.recv_ready():
                shell.recv(1024)
            
            # Send command
            shell.send(command + '\n')
            time.sleep(2)
            
            # Read output
            output = ""
            while shell.recv_ready():
                output += shell.recv(1024).decode('utf-8')
            
            shell.close()
            
            # Check for errors
            if "error" in output.lower() or "fail" in output.lower():
                return {"status": "error", "message": output}
            
            return {"status": "success", "output": output}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get FortiGate system status"""
        return self.execute_command("get system status")
    
    def get_firewall_rules(self) -> Dict[str, Any]:
        """Get firewall rules"""
        result = self.execute_command("get firewall policy")
        if result["status"] == "success":
            # Parse the output to extract rules
            rules = []
            lines = result["output"].split('\n')
            current_rule = {}
            
            for line in lines:
                line = line.strip()
                if line.startswith('edit '):
                    if current_rule and 'id' in current_rule:
                        rules.append(current_rule)
                    current_rule = {"id": line.split()[1]}
                elif line.startswith('set name '):
                    current_rule["name"] = line.split('set name ')[1].strip('"')
                elif line.startswith('set action '):
                    current_rule["action"] = line.split('set action ')[1]
                elif line.startswith('set status '):
                    current_rule["status"] = line.split('set status ')[1]
                elif line.startswith('set srcaddr '):
                    current_rule["source"] = line.split('set srcaddr ')[1]
                elif line.startswith('set dstaddr '):
                    current_rule["destination"] = line.split('set dstaddr ')[1]
                elif line.startswith('set service '):
                    current_rule["service"] = line.split('set service ')[1]
                elif line == 'next':
                    if current_rule and 'id' in current_rule:
                        rules.append(current_rule)
                        current_rule = {}
            
            # Add the last rule if it exists
            if current_rule and 'id' in current_rule:
                rules.append(current_rule)
            
            return {"status": "success", "rules": rules}
        return result
    
    def create_firewall_rule(self, rule_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a firewall rule"""
        name = rule_data.get('name', 'AutoFlow-Rule')
        action = rule_data.get('action', 'accept')
        source = rule_data.get('source', 'all')
        destination = rule_data.get('destination', 'all')
        service = rule_data.get('service', 'ALL')
        
        # Get next available policy ID
        result = self.execute_command("get firewall policy")
        if result["status"] == "success":
            try:
                # Parse the output to find the highest policy ID
                lines = result["output"].split('\n')
                max_id = 0
                for line in lines:
                    if 'policyid:' in line:
                        try:
                            policy_id = int(line.split('policyid:')[1].strip())
                            if policy_id > max_id:
                                max_id = policy_id
                        except:
                            pass
                new_id = max_id + 1
                print(f"Found max ID: {max_id}, using new ID: {new_id}")
            except Exception as e:
                print(f"Error parsing policy IDs: {e}")
                new_id = 1
        else:
            new_id = 1
        
        # Create the rule
        commands = [
            f"config firewall policy",
            f"edit {new_id}",
            f"set name {name}",
            f"set srcintf port1",
            f"set dstintf port1",
            f"set srcaddr {source}",
            f"set dstaddr {destination}",
            f"set service {service}",
            f"set action {action}",
            f"set status enable",
            f"set schedule always",
            f"end"
        ]
        
        for cmd in commands:
            result = self.execute_command(cmd)
            if result["status"] == "error":
                return result
        
        return {"status": "success", "message": f"Rule {name} created with ID {new_id}"}
    
    def delete_firewall_rule(self, rule_id: str) -> Dict[str, Any]:
        """Delete a firewall rule"""
        commands = [
            f"config firewall policy",
            f"delete {rule_id}",
            f"end"
        ]
        
        for cmd in commands:
            result = self.execute_command(cmd)
            if result["status"] == "error":
                return result
        
        return {"status": "success", "message": f"Rule {rule_id} deleted"}
    
    def get_vpn_connections(self) -> Dict[str, Any]:
        """Get VPN connections"""
        return self.execute_command("get vpn ipsec tunnel")
    
    def get_security_profiles(self) -> Dict[str, Any]:
        """Get security profiles"""
        result = self.execute_command("get antivirus profile")
        if result["status"] == "success":
            return {"status": "success", "profiles": [{"name": "Antivirus Profiles", "output": result["output"]}]}
        return result
    
    def close(self):
        """Close SSH connection"""
        if self.connected:
            self.client.close()
            self.connected = False

# Global instance
fortigate_ssh = None

def get_fortigate_ssh() -> FortiGateSSHAPI:
    """Get or create FortiGate SSH instance"""
    global fortigate_ssh
    if fortigate_ssh is None:
        fortigate_ssh = FortiGateSSHAPI("192.168.111.204", "admin", "admin")
    return fortigate_ssh

# API Functions for backend integration
def get_fortigate_status() -> Dict[str, Any]:
    """Get FortiGate status"""
    api = get_fortigate_ssh()
    return api.get_system_status()

def get_firewall_rules() -> Dict[str, Any]:
    """Get firewall rules"""
    api = get_fortigate_ssh()
    return api.get_firewall_rules()

def create_firewall_rule(rule_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create firewall rule"""
    api = get_fortigate_ssh()
    return api.create_firewall_rule(rule_data)

def delete_firewall_rule(rule_id: str) -> Dict[str, Any]:
    """Delete firewall rule"""
    api = get_fortigate_ssh()
    return api.delete_firewall_rule(rule_id)

def get_vpn_connections() -> Dict[str, Any]:
    """Get VPN connections"""
    api = get_fortigate_ssh()
    return api.get_vpn_connections()

def get_security_profiles() -> Dict[str, Any]:
    """Get security profiles"""
    api = get_fortigate_ssh()
    return api.get_security_profiles()

if __name__ == "__main__":
    import sys
    import json
    
    if len(sys.argv) < 2:
        print("Usage: python3 fortigate_ssh_api.py <command> [args...]")
        print("Commands: status, connect, get-rules, create-rule, delete-rule, get-vpn, get-profiles")
        sys.exit(1)
    
    command = sys.argv[1]
    
    # Default configuration
    config = {
        'host': '192.168.111.204',
        'port': 22,
        'username': 'admin',
        'password': 'admin'
    }
    
    # Override with command line arguments if provided
    if len(sys.argv) >= 6:
        config['host'] = sys.argv[2]
        config['port'] = int(sys.argv[3])
        config['username'] = sys.argv[4]
        config['password'] = sys.argv[5]
    
    api = FortiGateSSHAPI(config['host'], config['username'], config['password'])
    
    try:
        if command == 'status':
            result = api.get_system_status()
            print(json.dumps(result))
        elif command == 'connect':
            result = api.get_system_status()
            print(json.dumps(result))
        elif command == 'get-rules':
            result = api.get_firewall_rules()
            print(json.dumps(result))
        elif command == 'create-rule':
            if len(sys.argv) >= 7:
                rule_data = json.loads(sys.argv[6])
                result = api.create_firewall_rule(rule_data)
                print(json.dumps(result))
            else:
                print(json.dumps({'status': 'error', 'message': 'Rule data required'}))
        elif command == 'delete-rule':
            if len(sys.argv) >= 7:
                rule_id = sys.argv[6]
                result = api.delete_firewall_rule(rule_id)
                print(json.dumps(result))
            else:
                print(json.dumps({'status': 'error', 'message': 'Rule ID required'}))
        elif command == 'get-vpn':
            result = api.get_vpn_connections()
            print(json.dumps(result))
        elif command == 'get-profiles':
            result = api.get_security_profiles()
            print(json.dumps(result))
        else:
            print(json.dumps({'status': 'error', 'message': f'Unknown command: {command}'}))
    except Exception as e:
        print(json.dumps({'status': 'error', 'message': str(e)})) 