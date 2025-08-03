#!/usr/bin/env python3
"""
Final FortiGate Fix - Complete Rules with Required Parameters
"""

import paramiko
import time

class FortiGateFinalFix:
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
    
    def create_complete_allow_rule(self):
        """Create a complete allow rule with all required parameters"""
        print("🔧 Creating complete allow rule for switch access...")
        
        # Complete rule with all required parameters
        commands = [
            "config firewall policy",
            "edit 1",
            "set name Allow-Platform-to-Switch",
            "set srcintf port1",
            "set dstintf port1",
            "set srcaddr all",
            "set dstaddr all",
            "set service ALL",
            "set action accept",
            "set status enable",
            "set schedule always",
            "set comments 'Complete rule - allow all platform traffic'",
            "end"
        ]
        
        for cmd in commands:
            output = self.execute_command(cmd)
            if "error" in output.lower() or "fail" in output.lower():
                print(f"⚠️ Warning with command '{cmd}': {output}")
            else:
                print(f"✅ Executed: {cmd}")
        
        print("✅ Complete allow rule created!")
    
    def show_rules(self):
        """Show current firewall rules"""
        print("📋 Current Firewall Rules:")
        output = self.execute_command("get firewall policy")
        print(output)
    
    def test_connectivity(self):
        """Test connectivity to switch"""
        print("🧪 Testing connectivity to switch...")
        
        # Test ping
        output = self.execute_command("execute ping 192.168.111.198")
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
    print("🔧 FortiGate Final Fix")
    print("=" * 40)
    
    # Configuration
    host = "192.168.111.204"
    username = "admin"
    password = "admin"
    
    fortigate = FortiGateFinalFix(host, username, password)
    
    if fortigate.connect():
        try:
            # Show current rules
            fortigate.show_rules()
            
            # Create complete allow rule
            fortigate.create_complete_allow_rule()
            
            # Show rules again
            fortigate.show_rules()
            
            # Test connectivity
            fortigate.test_connectivity()
            
            print("\n✅ Final fix completed!")
            print("📝 Next steps:")
            print("1. Test your AutoFlow platform SSH terminal")
            print("2. Test MAC refresh and topology")
            print("3. If it works, the complete rule is working")
            
        finally:
            fortigate.close()
    else:
        print("❌ Failed to connect to FortiGate")

if __name__ == "__main__":
    main() 