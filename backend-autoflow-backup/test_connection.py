#!/usr/bin/env python3
"""
Test Connection Script
Tests connectivity and credentials for the GNS3 switch before running playbooks.
"""

import subprocess
import json
import sys
from pathlib import Path

def test_ansible_connection(target_ip="192.168.111.198"):
    """Test Ansible connection to the target device"""
    print(f"Testing Ansible connection to {target_ip}...")
    
    # Create a simple inventory for testing
    inventory_content = f"""[targets]
switch1 ansible_host={target_ip} ansible_network_os=ios ansible_connection=network_cli ansible_user=sarra ansible_password=sarra ansible_become=yes ansible_become_method=enable ansible_become_password=sarra ansible_ssh_common_args='-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null'

[all:vars]
ansible_python_interpreter=/usr/bin/python3
"""
    
    test_inventory = Path("/tmp/test_inventory.ini")
    with open(test_inventory, 'w') as f:
        f.write(inventory_content)
    
    try:
        # Test connection using ansible ping
        result = subprocess.run(
            ['ansible', 'targets', '-i', str(test_inventory), '-m', 'ping'],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            print("✅ Ansible connection successful!")
            print("Output:", result.stdout)
            return True
        else:
            print("❌ Ansible connection failed!")
            print("Error:", result.stderr)
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ Connection timeout - device may be unreachable")
        return False
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False
    finally:
        # Clean up test inventory
        if test_inventory.exists():
            test_inventory.unlink()

def test_ssh_connection(target_ip="192.168.111.198"):
    """Test direct SSH connection to the target device"""
    print(f"Testing SSH connection to {target_ip}...")
    
    try:
        # Test SSH connection using netmiko or paramiko
        result = subprocess.run(
            ['ssh', '-o', 'StrictHostKeyChecking=no', '-o', 'ConnectTimeout=10', 
             f'sarra@{target_ip}', 'show version'],
            capture_output=True,
            text=True,
            timeout=15
        )
        
        if result.returncode == 0:
            print("✅ SSH connection successful!")
            print("Device info:", result.stdout[:200] + "..." if len(result.stdout) > 200 else result.stdout)
            return True
        else:
            print("❌ SSH connection failed!")
            print("Error:", result.stderr)
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ SSH connection timeout")
        return False
    except Exception as e:
        print(f"❌ SSH connection error: {e}")
        return False

def test_ping(target_ip="192.168.111.198"):
    """Test basic network connectivity"""
    print(f"Testing ping to {target_ip}...")
    
    try:
        result = subprocess.run(
            ['ping', '-c', '3', '-W', '5', target_ip],
            capture_output=True,
            text=True,
            timeout=20
        )
        
        if result.returncode == 0:
            print("✅ Ping successful!")
            return True
        else:
            print("❌ Ping failed!")
            print("Error:", result.stderr)
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ Ping timeout")
        return False
    except Exception as e:
        print(f"❌ Ping error: {e}")
        return False

def main():
    """Main test function"""
    target_ip = sys.argv[1] if len(sys.argv) > 1 else "192.168.111.198"
    
    print("=" * 50)
    print("AutoFlow Network Management Platform")
    print("Connection Test Script")
    print("=" * 50)
    print(f"Target Device: {target_ip}")
    print()
    
    # Test basic connectivity
    ping_success = test_ping(target_ip)
    print()
    
    if not ping_success:
        print("❌ Basic connectivity failed. Please check:")
        print("  1. Network connectivity")
        print("  2. Device IP address")
        print("  3. GNS3 network configuration")
        return False
    
    # Test SSH connection
    ssh_success = test_ssh_connection(target_ip)
    print()
    
    # Test Ansible connection
    ansible_success = test_ansible_connection(target_ip)
    print()
    
    # Summary
    print("=" * 50)
    print("TEST SUMMARY")
    print("=" * 50)
    print(f"Ping Test: {'✅ PASS' if ping_success else '❌ FAIL'}")
    print(f"SSH Test: {'✅ PASS' if ssh_success else '❌ FAIL'}")
    print(f"Ansible Test: {'✅ PASS' if ansible_success else '❌ FAIL'}")
    print()
    
    if ping_success and ssh_success and ansible_success:
        print("🎉 All tests passed! Your device is ready for automation.")
        return True
    else:
        print("⚠️  Some tests failed. Please check the issues above.")
        if not ssh_success:
            print("SSH Issues:")
            print("  - Verify username/password (cisco/cisco)")
            print("  - Check if SSH is enabled on the device")
            print("  - Verify SSH port (default 22)")
        if not ansible_success:
            print("Ansible Issues:")
            print("  - Install ansible: pip3 install ansible")
            print("  - Install network modules: pip3 install ansible[network]")
            print("  - Check device credentials in inventory")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 