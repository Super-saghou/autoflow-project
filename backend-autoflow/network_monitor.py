#!/usr/bin/env python3
"""
Simple Network Monitor - Port Scanning Detection
This version uses psutil to monitor network connections and detect threats
"""

import subprocess
import time
import json
import threading
from datetime import datetime
import psutil

class SimpleNetworkMonitor:
    def __init__(self):
        self.suspicious_ips = {}
        self.port_scan_threshold = 3
        self.time_window = 30
        self.monitoring_active = False
        self.connection_history = []
        
    def start_monitoring(self):
        """Start simple network monitoring"""
        self.monitoring_active = True
        print(f"[{datetime.now()}] Starting Simple Network Monitor...")
        print(f"[{datetime.now()}] Monitoring network connections...")
        
        # Start monitoring thread
        monitor_thread = threading.Thread(target=self._monitor_connections)
        monitor_thread.daemon = True
        monitor_thread.start()
        
        # Start status display
        status_thread = threading.Thread(target=self._show_status)
        status_thread.daemon = True
        status_thread.start()
        
    def _monitor_connections(self):
        """Monitor network connections using psutil"""
        while self.monitoring_active:
            try:
                # Get current network connections
                connections = psutil.net_connections()
                
                # Filter for connections to your switch
                switch_connections = []
                for conn in connections:
                    if conn.raddr and conn.raddr.ip == "192.168.111.198":
                        switch_connections.append({
                            'local_ip': conn.laddr.ip if conn.laddr else 'unknown',
                            'remote_ip': conn.raddr.ip,
                            'remote_port': conn.raddr.port,
                            'status': conn.status,
                            'timestamp': datetime.now()
                        })
                
                # Analyze connections for port scanning
                if switch_connections:
                    self._analyze_connections(switch_connections)
                
                time.sleep(2)  # Check every 2 seconds
                
            except Exception as e:
                print(f"[{datetime.now()}] Monitoring error: {e}")
                time.sleep(5)
    
    def _analyze_connections(self, connections):
        """Analyze connections for suspicious patterns"""
        # Group by source IP
        connections_by_ip = {}
        for conn in connections:
            src_ip = conn['local_ip']
            if src_ip not in connections_by_ip:
                connections_by_ip[src_ip] = []
            connections_by_ip[src_ip].append(conn)
        
        # Check each IP for port scanning patterns
        for src_ip, conns in connections_by_ip.items():
            if len(conns) >= self.port_scan_threshold:
                self._check_port_scanning(src_ip, conns)
    
    def _check_port_scanning(self, src_ip, connections):
        """Detect port scanning from connection patterns"""
        current_time = datetime.now()
        
        if src_ip not in self.suspicious_ips:
            self.suspicious_ips[src_ip] = {
                'first_seen': current_time,
                'connections': [],
                'ports_scanned': set(),
                'alerted': False
            }
        
        ip_data = self.suspicious_ips[src_ip]
        ip_data['connections'].extend(connections)
        
        # Update ports scanned
        for conn in connections:
            ip_data['ports_scanned'].add(conn['remote_port'])
        
        # Check if this looks like port scanning
        if len(ip_data['ports_scanned']) >= self.port_scan_threshold and not ip_data['alerted']:
            time_diff = (current_time - ip_data['first_seen']).total_seconds()
            if time_diff <= self.time_window:
                self._alert_port_scanning(src_ip, ip_data)
                ip_data['alerted'] = True
    
    def _alert_port_scanning(self, src_ip, ip_data):
        """Generate alert for detected port scanning"""
        alert = {
            'timestamp': datetime.now().isoformat(),
            'threat_type': 'port_scanning',
            'source_ip': src_ip,
            'target_ip': '192.168.111.198',
            'ports_scanned': list(ip_data['ports_scanned']),
            'severity': 'high',
            'description': f'Port scanning detected from {src_ip} to 192.168.111.198'
        }
        
        print(f"\n🚨🚨🚨 PORT SCANNING DETECTED! 🚨🚨🚨")
        print(f"   📅 Time: {datetime.now()}")
        print(f"   🔴 Source: {src_ip}")
        print(f"   🎯 Target: 192.168.111.198")
        print(f"   🔌 Ports: {list(ip_data['ports_scanned'])}")
        print(f"   ⚠️  Severity: {alert['severity']}")
        print(f"   📊 Total connections: {len(ip_data['connections'])}")
        print(f"🚨🚨🚨 END ALERT 🚨🚨🚨\n")
        
        # Save alert
        self._save_alert(alert)
        
        # Trigger email alert
        self._trigger_email_alert(alert)
    
    def _save_alert(self, alert):
        """Save security alert"""
        try:
            with open('network_alerts.log', 'a') as f:
                f.write(json.dumps(alert) + '\n')
            print(f"[{datetime.now()}] 💾 Alert saved to network_alerts.log")
        except Exception as e:
            print(f"[{datetime.now()}] ❌ Error saving alert: {e}")
    
    def _trigger_email_alert(self, alert):
        """Trigger email alert"""
        print(f"[{datetime.now()}] 📧 Email alert triggered for {alert['threat_type']}")
    
    def _show_status(self):
        """Show monitoring status"""
        while self.monitoring_active:
            print(f"[{datetime.now()}] 📊 Status: {len(self.suspicious_ips)} suspicious IPs detected")
            time.sleep(10)
    
    def stop_monitoring(self):
        """Stop monitoring"""
        self.monitoring_active = False
        print(f"[{datetime.now()}] Network monitoring stopped")
    
    def get_status(self):
        """Get current status"""
        return {
            'monitoring_active': self.monitoring_active,
            'suspicious_ips': len(self.suspicious_ips),
            'details': self.suspicious_ips
        }

# Test the monitor
if __name__ == "__main__":
    print("🔧 Simple Network Monitor - Port Scanning Detection")
    print("=" * 60)
    
    monitor = SimpleNetworkMonitor()
    try:
        monitor.start_monitoring()
        print("\n✅ Network monitoring is ACTIVE!")
        print("💡 Now run: nmap -p 80,443,22,8080 192.168.111.198")
        print("⏳ Waiting for threats... (Press Ctrl+C to stop)\n")
        
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n🛑 Stopping network monitor...")
        monitor.stop_monitoring()
        print("✅ Network monitoring stopped.")




