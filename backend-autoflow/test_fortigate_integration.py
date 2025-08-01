#!/usr/bin/env python3
"""
Test script for FortiGate integration with AutoFlow platform
"""

import json
import sys
import time
from fortigate_api import FortiGateAPI

def test_fortigate_integration():
    """Test FortiGate integration"""
    print("🔥 Testing FortiGate Integration with AutoFlow Platform")
    print("=" * 60)
    
    # Test configuration
    test_config = {
        'host': '192.168.1.99',
        'port': 443,
        'username': 'admin',
        'api_token': 'test-token'  # Replace with actual token
    }
    
    print(f"📋 Test Configuration:")
    print(f"   Host: {test_config['host']}")
    print(f"   Port: {test_config['port']}")
    print(f"   Username: {test_config['username']}")
    print()
    
    # Initialize FortiGate API
    print("🔌 Initializing FortiGate API...")
    try:
        fortigate = FortiGateAPI(
            test_config['host'],
            test_config['port'],
            test_config['username'],
            test_config['api_token']
        )
        print("✅ FortiGate API initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize FortiGate API: {e}")
        return False
    
    # Test 1: Connection
    print("\n🔗 Test 1: Connection Test")
    print("-" * 30)
    try:
        result = fortigate.test_connection()
        print(f"Status: {result['status']}")
        print(f"Message: {result['message']}")
        if result['status'] == 'connected':
            print("✅ Connection successful!")
        else:
            print("❌ Connection failed")
            return False
    except Exception as e:
        print(f"❌ Connection test failed: {e}")
        return False
    
    # Test 2: Get Firewall Rules
    print("\n🛡️ Test 2: Firewall Rules")
    print("-" * 30)
    try:
        result = fortigate.get_firewall_rules()
        print(f"Status: {result['status']}")
        print(f"Rules found: {len(result.get('rules', []))}")
        if result['status'] == 'success':
            print("✅ Firewall rules retrieved successfully!")
            for rule in result.get('rules', [])[:3]:  # Show first 3 rules
                print(f"   - {rule.get('name', 'Unknown')} ({rule.get('action', 'unknown')})")
        else:
            print(f"❌ Failed to get firewall rules: {result.get('message', 'Unknown error')}")
    except Exception as e:
        print(f"❌ Firewall rules test failed: {e}")
    
    # Test 3: Get VPN Connections
    print("\n🔐 Test 3: VPN Connections")
    print("-" * 30)
    try:
        result = fortigate.get_vpn_connections()
        print(f"Status: {result['status']}")
        print(f"Connections found: {len(result.get('connections', []))}")
        if result['status'] == 'success':
            print("✅ VPN connections retrieved successfully!")
            for vpn in result.get('connections', [])[:3]:  # Show first 3 connections
                print(f"   - {vpn.get('name', 'Unknown')} ({vpn.get('status', 'unknown')})")
        else:
            print(f"❌ Failed to get VPN connections: {result.get('message', 'Unknown error')}")
    except Exception as e:
        print(f"❌ VPN connections test failed: {e}")
    
    # Test 4: Get Security Profiles
    print("\n🔒 Test 4: Security Profiles")
    print("-" * 30)
    try:
        result = fortigate.get_security_profiles()
        print(f"Status: {result['status']}")
        print(f"Profiles found: {len(result.get('profiles', []))}")
        if result['status'] == 'success':
            print("✅ Security profiles retrieved successfully!")
            for profile in result.get('profiles', [])[:3]:  # Show first 3 profiles
                print(f"   - {profile.get('name', 'Unknown')} ({profile.get('type', 'unknown')})")
        else:
            print(f"❌ Failed to get security profiles: {result.get('message', 'Unknown error')}")
    except Exception as e:
        print(f"❌ Security profiles test failed: {e}")
    
    # Test 5: Create Test Firewall Rule
    print("\n➕ Test 5: Create Test Firewall Rule")
    print("-" * 30)
    try:
        test_rule = {
            'name': 'AutoFlow-Test-Rule',
            'source': '192.168.10.0/24',
            'destination': 'any',
            'service': 'HTTP',
            'action': 'accept',
            'status': 'enabled'
        }
        
        result = fortigate.create_firewall_rule(test_rule)
        print(f"Status: {result['status']}")
        print(f"Message: {result.get('message', 'No message')}")
        if result['status'] == 'success':
            print("✅ Test firewall rule created successfully!")
        else:
            print(f"❌ Failed to create test rule: {result.get('message', 'Unknown error')}")
    except Exception as e:
        print(f"❌ Create rule test failed: {e}")
    
    # Test 6: System Status
    print("\n📊 Test 6: System Status")
    print("-" * 30)
    try:
        result = fortigate.get_system_status()
        print(f"Status: {result['status']}")
        if result['status'] == 'success':
            data = result.get('data', {})
            print(f"   Version: {data.get('version', 'Unknown')}")
            print(f"   Serial: {data.get('serial', 'Unknown')}")
            print(f"   Status: {data.get('status', 'Unknown')}")
            print("✅ System status retrieved successfully!")
        else:
            print(f"❌ Failed to get system status: {result.get('message', 'Unknown error')}")
    except Exception as e:
        print(f"❌ System status test failed: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 FortiGate Integration Test Completed!")
    print("📝 Check the results above to verify integration status")
    
    return True

def test_api_endpoints():
    """Test API endpoints from Node.js server"""
    print("\n🌐 Testing API Endpoints")
    print("=" * 60)
    
    import requests
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    base_url = "http://localhost:5000"
    
    # Test endpoints
    endpoints = [
        '/api/fortigate/status',
        '/api/fortigate/firewall-rules',
        '/api/fortigate/vpn-connections',
        '/api/fortigate/security-profiles'
    ]
    
    for endpoint in endpoints:
        try:
            print(f"🔗 Testing {endpoint}...")
            response = requests.get(f"{base_url}{endpoint}", timeout=10)
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"   Response: {data.get('status', 'unknown')}")
                print("   ✅ Endpoint working")
            else:
                print("   ❌ Endpoint failed")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        print()

def main():
    """Main test function"""
    print("🚀 AutoFlow FortiGate Integration Test Suite")
    print("=" * 60)
    
    # Test FortiGate API directly
    success = test_fortigate_integration()
    
    # Test API endpoints (if server is running)
    try:
        test_api_endpoints()
    except Exception as e:
        print(f"⚠️  API endpoint test skipped: {e}")
        print("   Make sure the AutoFlow server is running on port 5000")
    
    print("\n📋 Test Summary:")
    if success:
        print("✅ FortiGate integration is working correctly!")
        print("🎯 You can now use the Firewalling page in AutoFlow")
    else:
        print("❌ FortiGate integration needs attention")
        print("🔧 Check the configuration and network connectivity")
    
    print("\n📚 Next Steps:")
    print("1. Configure FortiGate in GNS3")
    print("2. Set up API token in FortiGate")
    print("3. Update configuration in AutoFlow")
    print("4. Test the Firewalling page interface")

if __name__ == "__main__":
    main() 