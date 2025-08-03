#!/usr/bin/env python3
"""
Emergency FortiGate Fix - Simple Rules to Allow Switch Access
"""

import paramiko
import time

class FortiGateEmergencyFix:
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
    
    def create_simple_allow_rule(self):
        """Create a simple allow rule for switch access"""
        print("🔧 Creating simple allow rule for switch access...")
        
        # Simple rule that allows all traffic from platform to switch
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
            "set comments 'Emergency rule - allow all platform traffic'",
            "end"
        ]
        
        for cmd in commands:
            output = self.execute_command(cmd)
            if "error" in output.lower() or "fail" in output.lower():
                print(f"⚠️ Warning with command '{cmd}': {output}")
            else:
                print(f"✅ Executed: {cmd}")
        
        print("✅ Simple allow rule created!")
    
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
    print("🚨 FortiGate Emergency Fix")
    print("=" * 40)
    
    # Configuration
    host = "192.168.111.204"
    username = "admin"
    password = "admin"
    
    fortigate = FortiGateEmergencyFix(host, username, password)
    
    if fortigate.connect():
        try:
            # Show current rules
            fortigate.show_rules()
            
            # Create simple allow rule
            fortigate.create_simple_allow_rule()
            
            # Show rules again
            fortigate.show_rules()
            
            # Test connectivity
            fortigate.test_connectivity()
            
            print("\n✅ Emergency fix completed!")
            print("📝 Next steps:")
            print("1. Test your AutoFlow platform SSH terminal")
            print("2. Test MAC refresh and topology")
            print("3. If it works, the emergency rule is working")
            
        finally:
            fortigate.close()
    else:
        print("❌ Failed to connect to FortiGate")

if __name__ == "__main__":
    main() 