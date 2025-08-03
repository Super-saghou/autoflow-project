#!/usr/bin/env python3
"""
Fixed FortiGate SSH API - Uses persistent SSH session
"""

import paramiko
import time
import json
import sys
from typing import Dict, Any

class FortiGateSSHAPIFixed:
    def __init__(self, host: str, username: str = "admin", password: str = "admin"):
        self.host = host
        self.username = username
        self.password = password
        self.ssh = None
        self.shell = None
        self.connected = False
    
    def connect(self) -> bool:
        """Connect to FortiGate via SSH"""
        try:
            print(f"🔌 Connecting to FortiGate {self.host}...")
            self.ssh = paramiko.SSHClient()
            self.ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            self.ssh.connect(self.host, username=self.username, password=self.password, timeout=10)
            
            # Get interactive shell
            self.shell = self.ssh.invoke_shell()
            time.sleep(2)
            
            # Clear initial output
            while self.shell.recv_ready():
                self.shell.recv(1024)
            
            self.connected = True
            print("✅ Connected successfully!")
            return True
            
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            return False
    
    def execute_command(self, command: str) -> Dict[str, Any]:
        """Execute a command on FortiGate using persistent shell"""
        try:
            if not self.connected or not self.shell:
                return {"status": "error", "message": "Not connected to FortiGate"}
            
            print(f"Executing: {command}")
            self.shell.send(command + '\n')
            time.sleep(2)
            
            output = ""
            while self.shell.recv_ready():
                output += self.shell.recv(1024).decode('utf-8')
            
            print(f"Output: {output}")
            
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
                if line.startswith('== [') and 'policyid:' in line:
                    if current_rule and 'id' in current_rule:
                        rules.append(current_rule)
                    policy_id = line.split('policyid:')[1].strip()
                    current_rule = {"id": policy_id}
                elif line.startswith('set name ') and current_rule:
                    current_rule["name"] = line.split('set name ')[1].strip('"')
                elif line.startswith('set action ') and current_rule:
                    current_rule["action"] = line.split('set action ')[1]
                elif line.startswith('set status ') and current_rule:
                    current_rule["status"] = line.split('set status ')[1]
                elif line.startswith('set srcaddr ') and current_rule:
                    current_rule["source"] = line.split('set srcaddr ')[1]
                elif line.startswith('set dstaddr ') and current_rule:
                    current_rule["destination"] = line.split('set dstaddr ')[1]
                elif line.startswith('set service ') and current_rule:
                    current_rule["service"] = line.split('set service ')[1]
            
            # Add the last rule if it exists
            if current_rule and 'id' in current_rule:
                rules.append(current_rule)
            
            return {"status": "success", "rules": rules}
        return result
    
    def create_firewall_rule(self, rule_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a firewall rule using persistent session"""
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
        
        # Create the rule using persistent session
        commands = [
            f"config firewall policy",
            f"edit {new_id}",
            f"set name {name}",
            f"set srcintf port1",
            f"set dstintf port1",
            f"set srcaddr all",
            f"set dstaddr all",
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
        return result
    
    def close(self):
        """Close SSH connection"""
        if self.ssh:
            self.ssh.close()
            self.connected = False
            print("🔌 Connection closed")

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 fortigate_ssh_api_fixed.py <command> <host> [port] [username] [password] [data]")
        sys.exit(1)
    
    command = sys.argv[1]
    host = sys.argv[2]
    port = int(sys.argv[3]) if len(sys.argv) > 3 else 22
    username = sys.argv[4] if len(sys.argv) > 4 else "admin"
    password = sys.argv[5] if len(sys.argv) > 5 else "admin"
    
    fortigate = FortiGateSSHAPIFixed(host, username, password)
    
    if not fortigate.connect():
        print(json.dumps({"status": "error", "message": "Failed to connect"}))
        sys.exit(1)
    
    try:
        if command == "status":
            result = fortigate.get_system_status()
        elif command == "get-rules":
            result = fortigate.get_firewall_rules()
        elif command == "create-rule":
            if len(sys.argv) < 7:
                print(json.dumps({"status": "error", "message": "Rule data required"}))
                sys.exit(1)
            rule_data = json.loads(sys.argv[6])
            result = fortigate.create_firewall_rule(rule_data)
        elif command == "delete-rule":
            if len(sys.argv) < 7:
                print(json.dumps({"status": "error", "message": "Rule ID required"}))
                sys.exit(1)
            rule_id = sys.argv[6]
            result = fortigate.delete_firewall_rule(rule_id)
        elif command == "get-vpn":
            result = fortigate.get_vpn_connections()
        elif command == "get-profiles":
            result = fortigate.get_security_profiles()
        else:
            result = {"status": "error", "message": f"Unknown command: {command}"}
        
        print(json.dumps(result))
        
    finally:
        fortigate.close()

if __name__ == "__main__":
    main() 