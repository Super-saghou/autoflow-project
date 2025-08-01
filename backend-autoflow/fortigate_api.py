#!/usr/bin/env python3
"""
FortiGate API Integration for AutoFlow Platform
Handles FortiGate firewall management via REST API
"""

import requests
import json
import time
import logging
from typing import Dict, List, Optional, Any
from urllib3.exceptions import InsecureRequestWarning
import urllib3

# Suppress SSL warnings for self-signed certificates
urllib3.disable_warnings(InsecureRequestWarning)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FortiGateAPI:
    """FortiGate API client for managing firewall operations"""
    
    def __init__(self, host: str, port: int = 443, username: str = "admin", api_token: str = ""):
        self.host = host
        self.port = port
        self.username = username
        self.api_token = api_token
        self.base_url = f"https://{host}:{port}/api/v2"
        self.session = requests.Session()
        self.session.verify = False  # Disable SSL verification for lab environments
        self.connected = False
        
        # Set headers
        if api_token:
            self.session.headers.update({
                'Authorization': f'Bearer {api_token}',
                'Content-Type': 'application/json'
            })
    
    def test_connection(self) -> Dict[str, Any]:
        """Test connection to FortiGate"""
        try:
            response = self.session.get(f"{self.base_url}/monitor/system/status", timeout=10)
            if response.status_code == 200:
                self.connected = True
                return {
                    "status": "connected",
                    "message": "Successfully connected to FortiGate",
                    "data": response.json()
                }
            else:
                return {
                    "status": "error",
                    "message": f"Connection failed: {response.status_code}",
                    "data": None
                }
        except requests.exceptions.RequestException as e:
            logger.error(f"Connection error: {e}")
            return {
                "status": "error",
                "message": f"Connection failed: {str(e)}",
                "data": None
            }
    
    def get_firewall_rules(self) -> Dict[str, Any]:
        """Get all firewall rules"""
        try:
            response = self.session.get(f"{self.base_url}/cmdb/firewall/policy", timeout=10)
            if response.status_code == 200:
                data = response.json()
                rules = []
                for rule in data.get('results', []):
                    rules.append({
                        'id': rule.get('policyid'),
                        'name': rule.get('name'),
                        'source': ', '.join(rule.get('srcaddr', [])),
                        'destination': ', '.join(rule.get('dstaddr', [])),
                        'service': ', '.join(rule.get('service', [])),
                        'action': rule.get('action'),
                        'status': 'enabled' if rule.get('status') == 'enable' else 'disabled'
                    })
                return {
                    "status": "success",
                    "rules": rules
                }
            else:
                return {
                    "status": "error",
                    "message": f"Failed to get firewall rules: {response.status_code}",
                    "rules": []
                }
        except Exception as e:
            logger.error(f"Error getting firewall rules: {e}")
            return {
                "status": "error",
                "message": str(e),
                "rules": []
            }
    
    def create_firewall_rule(self, rule_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new firewall rule"""
        try:
            # Prepare rule data for FortiGate API
            fortigate_rule = {
                "name": rule_data.get('name'),
                "srcaddr": [rule_data.get('source')],
                "dstaddr": [rule_data.get('destination')],
                "service": [rule_data.get('service')],
                "action": rule_data.get('action', 'accept'),
                "status": "enable" if rule_data.get('status', 'enabled') == 'enabled' else 'disable'
            }
            
            response = self.session.post(
                f"{self.base_url}/cmdb/firewall/policy",
                json=fortigate_rule,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                return {
                    "status": "success",
                    "message": "Firewall rule created successfully",
                    "data": response.json()
                }
            else:
                return {
                    "status": "error",
                    "message": f"Failed to create firewall rule: {response.status_code}",
                    "data": None
                }
        except Exception as e:
            logger.error(f"Error creating firewall rule: {e}")
            return {
                "status": "error",
                "message": str(e),
                "data": None
            }
    
    def delete_firewall_rule(self, rule_id: str) -> Dict[str, Any]:
        """Delete a firewall rule"""
        try:
            response = self.session.delete(f"{self.base_url}/cmdb/firewall/policy/{rule_id}", timeout=10)
            
            if response.status_code in [200, 204]:
                return {
                    "status": "success",
                    "message": "Firewall rule deleted successfully"
                }
            else:
                return {
                    "status": "error",
                    "message": f"Failed to delete firewall rule: {response.status_code}"
                }
        except Exception as e:
            logger.error(f"Error deleting firewall rule: {e}")
            return {
                "status": "error",
                "message": str(e)
            }
    
    def get_vpn_connections(self) -> Dict[str, Any]:
        """Get VPN connections status"""
        try:
            response = self.session.get(f"{self.base_url}/monitor/vpn/ipsec", timeout=10)
            if response.status_code == 200:
                data = response.json()
                connections = []
                for vpn in data.get('results', []):
                    connections.append({
                        'name': vpn.get('name'),
                        'type': vpn.get('type', 'IPsec'),
                        'remoteIp': vpn.get('remote-gw'),
                        'status': vpn.get('status'),
                        'uptime': vpn.get('uptime', '0s')
                    })
                return {
                    "status": "success",
                    "connections": connections
                }
            else:
                return {
                    "status": "error",
                    "message": f"Failed to get VPN connections: {response.status_code}",
                    "connections": []
                }
        except Exception as e:
            logger.error(f"Error getting VPN connections: {e}")
            return {
                "status": "error",
                "message": str(e),
                "connections": []
            }
    
    def get_security_profiles(self) -> Dict[str, Any]:
        """Get security profiles"""
        try:
            profiles = []
            
            # Get Antivirus profiles
            response = self.session.get(f"{self.base_url}/cmdb/antivirus/profile", timeout=10)
            if response.status_code == 200:
                data = response.json()
                for profile in data.get('results', []):
                    profiles.append({
                        'name': profile.get('name'),
                        'type': 'Antivirus',
                        'status': 'active' if profile.get('status') == 'enable' else 'inactive',
                        'appliedRules': len(profile.get('rules', []))
                    })
            
            # Get Web Filter profiles
            response = self.session.get(f"{self.base_url}/cmdb/webfilter/profile", timeout=10)
            if response.status_code == 200:
                data = response.json()
                for profile in data.get('results', []):
                    profiles.append({
                        'name': profile.get('name'),
                        'type': 'Web Filter',
                        'status': 'active' if profile.get('status') == 'enable' else 'inactive',
                        'appliedRules': len(profile.get('rules', []))
                    })
            
            return {
                "status": "success",
                "profiles": profiles
            }
        except Exception as e:
            logger.error(f"Error getting security profiles: {e}")
            return {
                "status": "error",
                "message": str(e),
                "profiles": []
            }
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get FortiGate system status"""
        try:
            response = self.session.get(f"{self.base_url}/monitor/system/status", timeout=10)
            if response.status_code == 200:
                return {
                    "status": "success",
                    "data": response.json()
                }
            else:
                return {
                    "status": "error",
                    "message": f"Failed to get system status: {response.status_code}"
                }
        except Exception as e:
            logger.error(f"Error getting system status: {e}")
            return {
                "status": "error",
                "message": str(e)
            }

# Global FortiGate instance
fortigate_instance = None

def initialize_fortigate(host: str, port: int, username: str, api_token: str) -> Dict[str, Any]:
    """Initialize FortiGate connection"""
    global fortigate_instance
    try:
        fortigate_instance = FortiGateAPI(host, port, username, api_token)
        result = fortigate_instance.test_connection()
        return result
    except Exception as e:
        logger.error(f"Failed to initialize FortiGate: {e}")
        return {
            "status": "error",
            "message": str(e)
        }

def get_fortigate_status() -> Dict[str, Any]:
    """Get FortiGate connection status"""
    global fortigate_instance
    if fortigate_instance and fortigate_instance.connected:
        return {
            "status": "connected",
            "message": "FortiGate is connected"
        }
    else:
        return {
            "status": "disconnected",
            "message": "FortiGate is not connected"
        }

def get_firewall_rules() -> Dict[str, Any]:
    """Get firewall rules"""
    global fortigate_instance
    if not fortigate_instance or not fortigate_instance.connected:
        return {
            "status": "error",
            "message": "FortiGate not connected",
            "rules": []
        }
    return fortigate_instance.get_firewall_rules()

def create_firewall_rule(rule_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create firewall rule"""
    global fortigate_instance
    if not fortigate_instance or not fortigate_instance.connected:
        return {
            "status": "error",
            "message": "FortiGate not connected"
        }
    return fortigate_instance.create_firewall_rule(rule_data)

def delete_firewall_rule(rule_id: str) -> Dict[str, Any]:
    """Delete firewall rule"""
    global fortigate_instance
    if not fortigate_instance or not fortigate_instance.connected:
        return {
            "status": "error",
            "message": "FortiGate not connected"
        }
    return fortigate_instance.delete_firewall_rule(rule_id)

def get_vpn_connections() -> Dict[str, Any]:
    """Get VPN connections"""
    global fortigate_instance
    if not fortigate_instance or not fortigate_instance.connected:
        return {
            "status": "error",
            "message": "FortiGate not connected",
            "connections": []
        }
    return fortigate_instance.get_vpn_connections()

def get_security_profiles() -> Dict[str, Any]:
    """Get security profiles"""
    global fortigate_instance
    if not fortigate_instance or not fortigate_instance.connected:
        return {
            "status": "error",
            "message": "FortiGate not connected",
            "profiles": []
        }
    return fortigate_instance.get_security_profiles()

if __name__ == "__main__":
    # Test the FortiGate API
    print("Testing FortiGate API...")
    
    # Initialize connection (replace with your FortiGate details)
    result = initialize_fortigate("192.168.1.99", 443, "admin", "your-api-token")
    print(f"Connection result: {result}")
    
    if result["status"] == "connected":
        # Test getting firewall rules
        rules = get_firewall_rules()
        print(f"Firewall rules: {rules}")
        
        # Test getting VPN connections
        vpn = get_vpn_connections()
        print(f"VPN connections: {vpn}")
        
        # Test getting security profiles
        profiles = get_security_profiles()
        print(f"Security profiles: {profiles}") 