#!/usr/bin/env python3
"""
FortiGate CLI Interface
Command-line interface for FortiGate API operations
"""

import sys
import json
import argparse
from fortigate_api import (
    initialize_fortigate, get_fortigate_status, get_firewall_rules,
    create_firewall_rule, delete_firewall_rule, get_vpn_connections,
    get_security_profiles
)

def main():
    parser = argparse.ArgumentParser(description='FortiGate CLI Interface')
    parser.add_argument('command', choices=[
        'status', 'connect', 'get-rules', 'create-rule', 'delete-rule',
        'get-vpn', 'get-profiles'
    ], help='Command to execute')
    
    parser.add_argument('--host', help='FortiGate host IP')
    parser.add_argument('--port', type=int, default=443, help='FortiGate port')
    parser.add_argument('--username', default='admin', help='FortiGate username')
    parser.add_argument('--token', help='FortiGate API token')
    parser.add_argument('--rule-id', help='Firewall rule ID for delete operation')
    parser.add_argument('--rule-data', help='JSON string for rule data')
    
    args = parser.parse_args()
    
    try:
        if args.command == 'status':
            result = get_fortigate_status()
            print(json.dumps(result))
            
        elif args.command == 'connect':
            if not all([args.host, args.username, args.token]):
                print(json.dumps({
                    "status": "error",
                    "message": "Host, username, and token are required for connection"
                }))
                sys.exit(1)
            
            result = initialize_fortigate(args.host, args.port, args.username, args.token)
            print(json.dumps(result))
            
        elif args.command == 'get-rules':
            result = get_firewall_rules()
            print(json.dumps(result))
            
        elif args.command == 'create-rule':
            if not args.rule_data:
                print(json.dumps({
                    "status": "error",
                    "message": "Rule data is required"
                }))
                sys.exit(1)
            
            try:
                rule_data = json.loads(args.rule_data)
                result = create_firewall_rule(rule_data)
                print(json.dumps(result))
            except json.JSONDecodeError:
                print(json.dumps({
                    "status": "error",
                    "message": "Invalid JSON in rule data"
                }))
                sys.exit(1)
            
        elif args.command == 'delete-rule':
            if not args.rule_id:
                print(json.dumps({
                    "status": "error",
                    "message": "Rule ID is required"
                }))
                sys.exit(1)
            
            result = delete_firewall_rule(args.rule_id)
            print(json.dumps(result))
            
        elif args.command == 'get-vpn':
            result = get_vpn_connections()
            print(json.dumps(result))
            
        elif args.command == 'get-profiles':
            result = get_security_profiles()
            print(json.dumps(result))
            
    except Exception as e:
        print(json.dumps({
            "status": "error",
            "message": str(e)
        }))
        sys.exit(1)

if __name__ == "__main__":
    main() 