#!/usr/bin/env python3
"""
FortiGate Setup Script for AutoFlow Platform
This script helps configure FortiGate to work with AutoFlow
"""

import paramiko
import time
import json

class FortiGateSetup:
    def __init__(self, host, username, password):
        self.host = host
        self.username = username
        self.password = password
        self.client = paramiko.SSHClient()
        self.client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    def connect(self):
        """Connect to FortiGate via SSH"""
        try:
            print(f"🔌 Connecting to FortiGate {self.host}...")
            self.client.connect(
                self.host, 
                username=self.username, 
                password=self.password,
                timeout=10
            )
            print("✅ Connected successfully!")
            return True
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            return False
    
    def execute_command(self, command):
        """Execute a command on FortiGate"""
        try:
            stdin, stdout, stderr = self.client.exec_command(command)
            output = stdout.read().decode('utf-8')
            error = stderr.read().decode('utf-8')
            return output, error
        except Exception as e:
            return "", str(e)
    
    def enable_api(self):
        """Enable FortiGate API"""
        commands = [
            "config system api-user",
            "edit admin",
            "set api-key AutoFlow123!",
            "set accprofile super_admin",
            "end",
            "config system interface",
            "edit port1",
            "set allowaccess https ssh",
            "end",
            "config system global",
            "set admin-https-port 443",
            "set admin-https-redirect enable",
            "end"
        ]
        
        print("🔧 Enabling FortiGate API...")
        for cmd in commands:
            output, error = self.execute_command(cmd)
            if error:
                print(f"⚠️ Command '{cmd}' had error: {error}")
            else:
                print(f"✅ Executed: {cmd}")
        
        print("✅ API configuration completed!")
    
    def create_autoflow_rules(self):
        """Create AutoFlow management rules"""
        commands = [
            "config firewall address",
            "edit AutoFlow-Management",
            "set subnet 192.168.111.0 255.255.255.0",
            "end",
            "config firewall policy",
            "edit 1",
            "set name AutoFlow-Management",
            "set srcintf port1",
            "set dstintf port1",
            "set srcaddr AutoFlow-Management",
            "set dstaddr all",
            "set service HTTPS SSH",
            "set action accept",
            "set status enable",
            "end"
        ]
        
        print("🛡️ Creating AutoFlow management rules...")
        for cmd in commands:
            output, error = self.execute_command(cmd)
            if error:
                print(f"⚠️ Command '{cmd}' had error: {error}")
            else:
                print(f"✅ Executed: {cmd}")
        
        print("✅ AutoFlow rules created!")
    
    def get_status(self):
        """Get FortiGate status"""
        output, error = self.execute_command("get system status")
        if output:
            print("📊 FortiGate Status:")
            print(output)
        if error:
            print(f"❌ Error getting status: {error}")
    
    def close(self):
        """Close SSH connection"""
        self.client.close()
        print("🔌 Connection closed")

def main():
    print("🚀 FortiGate Setup for AutoFlow Platform")
    print("=" * 50)
    
    # Configuration
    host = "192.168.111.204"
    username = "admin"
    password = "admin"  # Change this to your actual password
    
    print(f"📋 Configuration:")
    print(f"   Host: {host}")
    print(f"   Username: {username}")
    print(f"   Password: {password}")
    print()
    
    # Initialize setup
    setup = FortiGateSetup(host, username, password)
    
    # Connect
    if not setup.connect():
        print("❌ Cannot proceed without connection")
        return
    
    try:
        # Get current status
        setup.get_status()
        
        # Enable API
        setup.enable_api()
        
        # Create AutoFlow rules
        setup.create_autoflow_rules()
        
        print("\n✅ FortiGate setup completed!")
        print("📝 Next steps:")
        print("1. Update fortigate_config.json with API key: AutoFlow123!")
        print("2. Test the connection with test_fortigate_integration.py")
        print("3. Update the frontend Firewalling section")
        
    except Exception as e:
        print(f"❌ Setup failed: {e}")
    finally:
        setup.close()

if __name__ == "__main__":
    main() 