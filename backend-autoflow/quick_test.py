#!/usr/bin/env python3
"""
Quick Test Script
Tests the system components without requiring a network device.
"""

import json
import subprocess
import sys
from pathlib import Path

def test_python_dependencies():
    """Test if required Python packages are installed"""
    print("Testing Python dependencies...")
    
    required_packages = ['flask', 'flask_cors', 'pyyaml', 'ansible']
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package} - not installed")
            return False
    
    return True

def test_playbook_generator():
    """Test the playbook generator"""
    print("\nTesting playbook generator...")
    
    try:
        from playbook_generator import AnsiblePlaybookGenerator
        
        generator = AnsiblePlaybookGenerator()
        
        # Test VLAN playbook generation
        playbook_path = generator.generate_vlan_playbook(
            "192.168.111.198", 
            "10", 
            "TestVLAN"
        )
        
        if Path(playbook_path).exists():
            print("✅ VLAN playbook generated successfully")
            
            # Read and validate the playbook
            with open(playbook_path, 'r') as f:
                content = f.read()
                if ('vlan_id: \'10\'' in content or 'vlan_id: 10' in content) and 'vlan_name: TestVLAN' in content:
                    print("✅ Playbook content is valid")
                    return True
                else:
                    print("❌ Playbook content is invalid")
                    print("Content:", content)
                    return False
        else:
            print("❌ Playbook file not created")
            return False
            
    except Exception as e:
        print(f"❌ Playbook generator error: {e}")
        return False

def test_flask_api():
    """Test if Flask API can start"""
    print("\nTesting Flask API...")
    
    try:
        # Try to import the Flask app
        from playbook_api import app
        
        print("✅ Flask app imported successfully")
        
        # Test if the app has the expected routes
        routes = [rule.rule for rule in app.url_map.iter_rules()]
        expected_routes = ['/api/health', '/api/generate-playbook', '/api/execute-playbook', '/api/generate-and-execute']
        
        for route in expected_routes:
            if route in routes:
                print(f"✅ Route {route} found")
            else:
                print(f"❌ Route {route} missing")
                return False
        
        return True
        
    except Exception as e:
        print(f"❌ Flask API error: {e}")
        return False

def test_inventory_file():
    """Test if inventory file is properly configured"""
    print("\nTesting inventory file...")
    
    inventory_path = Path("inventory.ini")
    
    if not inventory_path.exists():
        print("❌ Inventory file not found")
        return False
    
    with open(inventory_path, 'r') as f:
        content = f.read()
        
        required_items = [
            '192.168.111.198',
            'ansible_network_os=ios',
            'ansible_user=sarra',
            'ansible_password=sarra'
        ]
        
        for item in required_items:
            if item in content:
                print(f"✅ {item} found in inventory")
            else:
                print(f"❌ {item} missing from inventory")
                return False
    
    return True

def test_ansible_installation():
    """Test if Ansible is properly installed"""
    print("\nTesting Ansible installation...")
    
    try:
        result = subprocess.run(
            ['ansible', '--version'],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            print("✅ Ansible is installed")
            print(f"Version: {result.stdout.split()[1]}")
            return True
        else:
            print("❌ Ansible command failed")
            return False
            
    except FileNotFoundError:
        print("❌ Ansible not found in PATH")
        return False
    except Exception as e:
        print(f"❌ Ansible test error: {e}")
        return False

def main():
    """Main test function"""
    print("=" * 60)
    print("AutoFlow Network Management Platform")
    print("System Component Test")
    print("=" * 60)
    
    tests = [
        ("Python Dependencies", test_python_dependencies),
        ("Playbook Generator", test_playbook_generator),
        ("Flask API", test_flask_api),
        ("Inventory File", test_inventory_file),
        ("Ansible Installation", test_ansible_installation)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test failed with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\nResults: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All system components are ready!")
        print("\nNext steps:")
        print("1. Test connection to your GNS3 switch:")
        print("   python3 test_connection.py 192.168.111.198")
        print("\n2. Start the services:")
        print("   ./start_services.sh")
        print("\n3. Test VLAN creation:")
        print("   curl -X POST http://localhost:5001/api/generate-and-execute \\")
        print("     -H \"Content-Type: application/json\" \\")
        print("     -d '{\"action\": \"vlan\", \"target_ip\": \"192.168.111.198\", \"vlan_id\": 10, \"vlan_name\": \"Engineering\"}'")
        return True
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please fix the issues above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 