#!/usr/bin/env python3
"""
Debug FortiGate Rule Creation
"""

import paramiko
import time
import json

class FortiGateDebug:
    def __init__(self, host, username, password):
        self.host = host
        self.username = username
        self.password = password
        self.ssh = None
        self.shell = None
    
    def connect(self):
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
            
            print("✅ Connected successfully!")
            return True
            
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            return False
    
    def execute_command(self, command):
        """Execute command and return output"""
        try:
            print(f"Executing: {command}")
            self.shell.send(command + '\n')
            time.sleep(2)
            
            output = ""
            while self.shell.recv_ready():
                output += self.shell.recv(1024).decode('utf-8')
            
            print(f"Output: {output}")
            return output.strip()
        except Exception as e:
            print(f"Error executing command: {e}")
            return ""
    
    def debug_rule_creation(self):
        """Debug rule creation step by step"""
        print("🔧 Debugging rule creation...")
        
        # Step 1: Check current rules
        print("\n1. Current rules:")
        self.execute_command("get firewall policy")
        
        # Step 2: Try to create a rule manually
        print("\n2. Creating rule manually:")
        commands = [
            "config firewall policy",
            "edit 2",
            "set name Debug-Rule",
            "set srcintf port1",
            "set dstintf port1",
            "set srcaddr all",
            "set dstaddr all",
            "set service ALL",
            "set action accept",
            "set status enable",
            "set schedule always",
            "end"
        ]
        
        for cmd in commands:
            output = self.execute_command(cmd)
            if "error" in output.lower() or "fail" in output.lower():
                print(f"❌ Error with command '{cmd}': {output}")
                return False
        
        # Step 3: Check rules again
        print("\n3. Rules after creation:")
        self.execute_command("get firewall policy")
        
        return True
    
    def close(self):
        """Close SSH connection"""
        if self.ssh:
            self.ssh.close()
            print("🔌 Connection closed")

def main():
    print("🔍 FortiGate Debug")
    print("=" * 40)
    
    # Configuration
    host = "192.168.111.204"
    username = "admin"
    password = "admin"
    
    fortigate = FortiGateDebug(host, username, password)
    
    if fortigate.connect():
        try:
            fortigate.debug_rule_creation()
        finally:
            fortigate.close()
    else:
        print("❌ Failed to connect to FortiGate")

if __name__ == "__main__":
    main() 