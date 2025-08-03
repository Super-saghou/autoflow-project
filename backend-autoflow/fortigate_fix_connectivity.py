#!/usr/bin/env python3
"""
FortiGate Connectivity Fix Script
Fixes firewall rules to allow proper switch management access
"""

import paramiko
import time
import json

class FortiGateConnectivityFix:
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
            
            return output.strip()
        except Exception as e:
            print(f"Error executing command: {e}")
            return ""
    
    def fix_switch_connectivity(self):
        """Fix firewall rules to allow switch management"""
        print("🔧 Fixing switch connectivity rules...")
        
        # Step 1: Create a more permissive management rule
        commands = [
            "config firewall policy",
            "edit 2",
            "set name Switch-Management",
            "set srcintf port1",
            "set dstintf port1", 
            "set srcaddr all",
            "set dstaddr all",
            "set service ALL",
            "set action accept",
            "set status enable",
            "set comments 'Allow all management traffic to switches'",
            "end"
        ]
        
        for cmd in commands:
            output = self.execute_command(cmd)
            if "error" in output.lower():
                print(f"⚠️ Warning with command '{cmd}': {output}")
            else:
                print(f"✅ Executed: {cmd}")
        
        # Step 2: Create specific rules for common management protocols
        management_commands = [
            "config firewall service custom",
            "edit SSH-Service",
            "set tcp-portrange 22",
            "end",
            "edit Telnet-Service", 
            "set tcp-portrange 23",
            "end",
            "edit SNMP-Service",
            "set udp-portrange 161-162",
            "end"
        ]
        
        for cmd in management_commands:
            output = self.execute_command(cmd)
            if "error" in output.lower():
                print(f"⚠️ Warning with command '{cmd}': {output}")
            else:
                print(f"✅ Executed: {cmd}")
        
        # Step 3: Create management policy with specific services
        policy_commands = [
            "config firewall policy",
            "edit 3",
            "set name Management-Protocols",
            "set srcintf port1",
            "set dstintf port1",
            "set srcaddr all",
            "set dstaddr all", 
            "set service SSH-Service Telnet-Service SNMP-Service HTTPS PING",
            "set action accept",
            "set status enable",
            "set comments 'Allow management protocols to switches'",
            "end"
        ]
        
        for cmd in policy_commands:
            output = self.execute_command(cmd)
            if "error" in output.lower():
                print(f"⚠️ Warning with command '{cmd}': {output}")
            else:
                print(f"✅ Executed: {cmd}")
        
        print("✅ Switch connectivity rules created!")
    
    def show_current_rules(self):
        """Show current firewall rules"""
        print("📋 Current Firewall Rules:")
        output = self.execute_command("get firewall policy")
        print(output)
    
    def test_connectivity(self):
        """Test connectivity to switch"""
        print("🧪 Testing connectivity to switch...")
        
        # Test ping
        output = self.execute_command("execute ping 192.168.111.198 count 3")
        print("Ping test:")
        print(output)
        
        # Test SSH port
        output = self.execute_command("execute telnet 192.168.111.198 22")
        print("SSH port test:")
        print(output)
    
    def close(self):
        """Close SSH connection"""
        if self.ssh:
            self.ssh.close()
            print("🔌 Connection closed")

def main():
    print("🚀 FortiGate Connectivity Fix")
    print("=" * 40)
    
    # Configuration
    host = "192.168.111.204"
    username = "admin"
    password = "admin"
    
    fortigate = FortiGateConnectivityFix(host, username, password)
    
    if fortigate.connect():
        try:
            # Show current rules
            fortigate.show_current_rules()
            
            # Fix connectivity
            fortigate.fix_switch_connectivity()
            
            # Test connectivity
            fortigate.test_connectivity()
            
            print("\n✅ FortiGate connectivity fix completed!")
            print("📝 Next steps:")
            print("1. Test your AutoFlow platform SSH terminal")
            print("2. If it works, the firewall rules are correct")
            print("3. If not, we may need to adjust the rules further")
            
        finally:
            fortigate.close()
    else:
        print("❌ Failed to connect to FortiGate")

if __name__ == "__main__":
    main() 