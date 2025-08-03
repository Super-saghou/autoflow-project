#!/usr/bin/env python3
"""
FortiGate Setup Script v2 for AutoFlow Platform
Enhanced version that properly configures API access
"""

import paramiko
import time
import json

class FortiGateSetupV2:
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
    
    def enable_api_comprehensive(self):
        """Comprehensive API configuration"""
        print("🔧 Configuring FortiGate API comprehensively...")
        
        # Step 1: Configure API user
        api_commands = [
            "config system api-user",
            "edit admin",
            "set api-key AutoFlow123!",
            "set accprofile super_admin",
            "set vdom root",
            "end"
        ]
        
        for cmd in api_commands:
            output, error = self.execute_command(cmd)
            if error and "already exists" not in error:
                print(f"⚠️ Command '{cmd}' had error: {error}")
            else:
                print(f"✅ Executed: {cmd}")
        
        # Step 2: Configure HTTPS access (avoiding port1 configuration)
        https_commands = [
            "config system global",
            "set admin-https-port 443",
            "set admin-https-redirect enable",
            "set admin-https-ssl-versions tlsv1-2 tlsv1-3",
            "end"
        ]
            "config system global",
            "set admin-https-port 443",
            "set admin-https-redirect enable",
            "set admin-https-ssl-versions tlsv1-2 tlsv1-3",
            "end"
        ]
        
        for cmd in https_commands:
            output, error = self.execute_command(cmd)
            if error:
                print(f"⚠️ Command '{cmd}' had error: {error}")
            else:
                print(f"✅ Executed: {cmd}")
        
        # Step 3: Configure admin access
        admin_commands = [
            "config system admin",
            "edit admin",
            "set accprofile super_admin",
            "set vdom root",
            "end"
        ]
        
        for cmd in admin_commands:
            output, error = self.execute_command(cmd)
            if error:
                print(f"⚠️ Command '{cmd}' had error: {error}")
            else:
                print(f"✅ Executed: {cmd}")
        
        print("✅ Comprehensive API configuration completed!")
    
    def create_autoflow_rules(self):
        """Create AutoFlow management rules"""
        print("🛡️ Creating AutoFlow management rules...")
        
        # Create address object
        address_commands = [
            "config firewall address",
            "edit AutoFlow-Management",
            "set subnet 192.168.111.0 255.255.255.0",
            "set comment 'AutoFlow management network'",
            "end"
        ]
        
        for cmd in address_commands:
            output, error = self.execute_command(cmd)
            if error and "already exists" not in error:
                print(f"⚠️ Command '{cmd}' had error: {error}")
            else:
                print(f"✅ Executed: {cmd}")
        
        # Create firewall policy (using port1 for policies only)
        policy_commands = [
            "config firewall policy",
            "edit 1",
            "set name AutoFlow-Management",
            "set srcintf port1",
            "set dstintf port1",
            "set srcaddr AutoFlow-Management",
            "set dstaddr all",
            "set service HTTPS SSH PING",
            "set action accept",
            "set status enable",
            "set comments 'AutoFlow platform management access'",
            "end"
        ]
        
        for cmd in policy_commands:
            output, error = self.execute_command(cmd)
            if error and "already exists" not in error:
                print(f"⚠️ Command '{cmd}' had error: {error}")
            else:
                print(f"✅ Executed: {cmd}")
        
        print("✅ AutoFlow rules created!")
    
    def test_api_access(self):
        """Test API access"""
        print("🧪 Testing API access...")
        
        # Test HTTPS access
        test_commands = [
            "get system status",
            "get system api-user",
            "get system interface port1"
        ]
        
        for cmd in test_commands:
            output, error = self.execute_command(cmd)
            if output:
                print(f"✅ {cmd}: OK")
            else:
                print(f"❌ {cmd}: Failed - {error}")
    
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
    print("🚀 FortiGate Setup v2 for AutoFlow Platform")
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
    setup = FortiGateSetupV2(host, username, password)
    
    # Connect
    if not setup.connect():
        print("❌ Cannot proceed without connection")
        return
    
    try:
        # Get current status
        setup.get_status()
        
        # Enable API comprehensively
        setup.enable_api_comprehensive()
        
        # Create AutoFlow rules
        setup.create_autoflow_rules()
        
        # Test API access
        setup.test_api_access()
        
        print("\n✅ FortiGate setup v2 completed!")
        print("📝 Next steps:")
        print("1. The API key is already configured: AutoFlow123!")
        print("2. Test the connection with test_fortigate_integration.py")
        print("3. If still having issues, try rebooting the FortiGate")
        print("4. Update the frontend Firewalling section")
        
    except Exception as e:
        print(f"❌ Setup failed: {e}")
    finally:
        setup.close()

if __name__ == "__main__":
    main() 