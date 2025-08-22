#!/usr/bin/env python3
"""
Network Connection Debug Tool
Shows exactly what network connections are being detected
"""

import psutil
import time
from datetime import datetime

def debug_network_connections():
    """Debug: Show all network connections"""
    print(f"[{datetime.now()}] 🔍 Debugging network connections...")
    
    try:
        # Get all network connections
        connections = psutil.net_connections()
        print(f"[{datetime.now()}] 📊 Total connections found: {len(connections)}")
        
        # Show connections to your switch
        switch_connections = []
        for conn in connections:
            if conn.raddr and conn.raddr.ip == "192.168.111.198":
                switch_connections.append({
                    'local_ip': conn.laddr.ip if conn.laddr else 'unknown',
                    'remote_ip': conn.raddr.ip,
                    'remote_port': conn.raddr.port,
                    'status': conn.status
                })
        
        print(f"[{datetime.now()}] 🎯 Connections to switch (192.168.111.198): {len(switch_connections)}")
        
        for conn in switch_connections:
            print(f"   🔗 {conn['local_ip']} -> {conn['remote_ip']}:{conn['remote_port']} ({conn['status']})")
            
        # Show all connections for debugging
        print(f"\n[{datetime.now()}] 🔍 All active connections:")
        for conn in connections[:10]:  # Show first 10
            if conn.raddr:
                print(f"   📡 {conn.laddr.ip if conn.laddr else 'unknown'} -> {conn.raddr.ip}:{conn.raddr.port} ({conn.status})")
                
    except Exception as e:
        print(f"[{datetime.now()}] ❌ Error: {e}")

if __name__ == "__main__":
    print("🔧 Network Connection Debug Tool")
    print("=" * 50)
    
    while True:
        debug_network_connections()
        print("\n" + "="*50)
        time.sleep(5) 