import time
import json
import os
import sys
import argparse
import psutil
import threading
from datetime import datetime, timedelta
from dotenv import load_dotenv
from langchain_openai import OpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain.tools import Tool
from langchain.agents import initialize_agent, AgentType

# Load environment variables
load_dotenv()

# Configuration
AUDIT_LOG = 'audit.log'
BLOCKED_FILE = 'blocked.json'
AGENT_LOG = 'ai_security_agent.log'
FAILED_THRESHOLD = 5
TIME_WINDOW_MINUTES = 10
NETWORK_MONITOR_INTERVAL = 0.5  # Check network every 0.5 seconds (much more aggressive)
SUSPICIOUS_CONNECTION_THRESHOLD = 10  # Number of connections to trigger alert

# Initialize LLM
api_key = os.getenv('OPENAI_API_KEY')
if api_key and api_key != 'your_openai_api_key_here':
    llm = OpenAI(
        temperature=0.1,  # Low temperature for consistent security decisions
        api_key=api_key
    )
    AI_ENABLED = True
else:
    print("[AI Security Agent] Warning: No valid OpenAI API key found. Running in basic security mode.")
    llm = None
    AI_ENABLED = False

class AISecurityAgent:
    def __init__(self):
        self.llm = llm
        self.network_activity = {}
        self.suspicious_ips = set()
        self.port_scan_alerts = []
        self.monitoring_active = False
        
        if AI_ENABLED and self.llm:
            self.setup_tools()
            self.setup_agent()
        else:
            self.tools = []
            self.agent = None
        
    def setup_tools(self):
        """Setup tools for the AI agent"""
        self.tools = [
            Tool(
                name="read_security_logs",
                func=self.read_security_logs,
                description="Read and analyze security logs for suspicious activity"
            ),
            Tool(
                name="block_user",
                func=self.block_user,
                description="Block a user account due to suspicious activity"
            ),
            Tool(
                name="block_ip",
                func=self.block_ip,
                description="Block an IP address due to suspicious activity"
            ),
            Tool(
                name="analyze_threat_pattern",
                func=self.analyze_threat_pattern,
                description="Analyze patterns in failed login attempts to determine threat level"
            ),
            Tool(
                name="analyze_network_threats",
                func=self.analyze_network_threats,
                description="Analyze current network activity for threats and port scanning"
            ),
            Tool(
                name="get_network_status",
                func=self.get_network_status,
                description="Get current network monitoring status and suspicious activity"
            )
        ]
    
    def setup_agent(self):
        """Initialize the AI agent"""
        try:
            self.agent = initialize_agent(
                tools=self.tools,
                llm=self.llm,
                agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
                verbose=False,  # Reduce verbosity to prevent hanging
                handle_parsing_errors=True,
                max_iterations=3,  # Limit iterations to prevent infinite loops
                early_stopping_method="generate"  # Stop early if stuck
            )
        except Exception as e:
            self.log_action(f"Error setting up agent: {str(e)}")
            self.agent = None
    
    def start_network_monitoring(self):
        """Start real-time network monitoring in a separate thread"""
        if not self.monitoring_active:
            self.monitoring_active = True
            self.network_thread = threading.Thread(target=self.network_monitor_loop, daemon=True)
            self.network_thread.start()
            self.log_action("Network monitoring started")
            
            # Also start packet monitoring for nmap detection
            self.start_packet_monitoring()
    
    def start_packet_monitoring(self):
        """Start packet-level monitoring for nmap detection"""
        try:
            import subprocess
            
            # Check if ss command is available (more reliable than tcpdump)
            result = subprocess.run(['which', 'ss'], capture_output=True, text=True)
            if result.returncode == 0:
                # Start ss-based monitoring in background
                self.packet_thread = threading.Thread(target=self.ss_monitor_loop, daemon=True)
                self.packet_thread.start()
                self.log_action("Connection monitoring started with ss command")
                
                # Test ss command to see what it shows
                self.test_ss_command()
            else:
                self.log_action("ss command not available, using basic monitoring only")
                
        except Exception as e:
            self.log_action(f"Error starting packet monitoring: {str(e)}")
    
    def test_ss_command(self):
        """Test ss command to see what connections are visible"""
        try:
            import subprocess
            
            print("🔍 Testing ss command to see current connections...")
            
            # Show all TCP connections
            result = subprocess.run(['ss', '-tan'], capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                lines = result.stdout.split('\n')
                print(f"📊 ss command shows {len(lines)} connection lines")
                
                # Show first few connections
                for i, line in enumerate(lines[:5]):
                    if line.strip():
                        print(f"   {i+1}: {line.strip()}")
                
                # Look specifically for Control VM
                control_vm_lines = [line for line in lines if '192.168.111.201' in line]
                if control_vm_lines:
                    print(f"🎯 Found {len(control_vm_lines)} connections from Control VM:")
                    for line in control_vm_lines:
                        print(f"   📡 {line.strip()}")
                else:
                    print("❌ No connections from Control VM (192.168.111.201) found")
            
            # Test network connectivity to Control VM
            print("\n🔍 Testing network connectivity to Control VM...")
            self.test_control_vm_connectivity()
                    
        except Exception as e:
            print(f"Error testing ss command: {str(e)}")
    
    def test_control_vm_connectivity(self):
        """Test if we can actually reach the Control VM"""
        try:
            import subprocess
            
            # Test 1: Ping Control VM
            print("   📡 Testing ping to Control VM...")
            ping_result = subprocess.run(['ping', '-c', '3', '192.168.111.201'], 
                                       capture_output=True, text=True, timeout=10)
            if ping_result.returncode == 0:
                print("   ✅ Ping to Control VM successful")
            else:
                print("   ❌ Ping to Control VM failed")
            
            # Test 2: Try to connect to SSH port
            print("   📡 Testing SSH connection to Control VM...")
            try:
                ssh_result = subprocess.run(['nc', '-zv', '192.168.111.201', '22'], 
                                          capture_output=True, text=True, timeout=5)
                if ssh_result.returncode == 0:
                    print("   ✅ SSH port (22) reachable on Control VM")
                else:
                    print("   ❌ SSH port (22) not reachable on Control VM")
            except FileNotFoundError:
                print("   ⚠️ nc command not available, skipping SSH test")
            
            # Test 3: Check if we can see any traffic from Control VM
            print("   📡 Checking for any traffic from Control VM...")
            ss_result = subprocess.run(['ss', '-tan', 'state', 'all'], 
                                     capture_output=True, text=True, timeout=5)
            if ss_result.returncode == 0:
                lines = ss_result.stdout.split('\n')
                control_vm_connections = [line for line in lines if '192.168.111.201' in line]
                if control_vm_connections:
                    print(f"   ✅ Found {len(control_vm_connections)} connections from Control VM")
                    for conn in control_vm_connections[:3]:
                        print(f"      📡 {conn.strip()}")
                else:
                    print("   ❌ No connections from Control VM visible")
            
            # Test 4: Test if nmap works locally
            print("   📡 Testing local nmap functionality...")
            try:
                nmap_result = subprocess.run(['nmap', '-p', '22', '127.0.0.1'], 
                                           capture_output=True, text=True, timeout=10)
                if nmap_result.returncode == 0:
                    print("   ✅ Local nmap working (scanning localhost)")
                    print(f"      📋 Output: {nmap_result.stdout.strip()}")
                else:
                    print("   ❌ Local nmap failed")
            except FileNotFoundError:
                print("   ⚠️ nmap command not available locally")
            
            # Test 5: Check if we can reach the switch
            print("   📡 Testing connectivity to Switch (192.168.111.198)...")
            switch_ping = subprocess.run(['ping', '-c', '3', '192.168.111.198'], 
                                       capture_output=True, text=True, timeout=10)
            if switch_ping.returncode == 0:
                print("   ✅ Ping to Switch successful")
            else:
                print("   ❌ Ping to Switch failed")
                    
        except Exception as e:
            print(f"   ❌ Error testing connectivity: {str(e)}")
    
    def ss_monitor_loop(self):
        """Monitor network connections using ss command for nmap detection"""
        try:
            import subprocess
            
            while self.monitoring_active:
                try:
                    # Use ss command to see all TCP connections and states
                    result = subprocess.run(['ss', '-tan', 'state', 'all'], 
                                          capture_output=True, text=True, timeout=1)
                    
                    if result.returncode == 0:
                        lines = result.stdout.split('\n')
                        
                        # Look for connections from Control VM
                        control_vm_connections = []
                        for line in lines:
                            if '192.168.111.201' in line:
                                control_vm_connections.append(line.strip())
                        
                        if control_vm_connections:
                            print(f"🔍 Found {len(control_vm_connections)} connections from Control VM:")
                            for conn in control_vm_connections[:5]:  # Show first 5
                                print(f"   📡 {conn}")
                            
                            # Check if this looks like nmap (multiple ports)
                            if len(control_vm_connections) >= 5:
                                if '192.168.111.201' not in self.suspicious_ips:
                                    self.suspicious_ips.add('192.168.111.201')
                                    self.log_action(f"🚨 NMAP DETECTED! Multiple connections from Control VM: {len(control_vm_connections)}")
                                    print(f"🚨 ALERT: NMAP scan detected from Control VM! {len(control_vm_connections)} connections")
                    
                    # Also monitor for traffic to the switch (192.168.111.198)
                    self.monitor_switch_traffic()
                    
                    time.sleep(0.5)  # Check every 0.5 seconds (much more aggressive)
                    
                except subprocess.TimeoutExpired:
                    continue
                except Exception as e:
                    self.log_action(f"ss monitoring error: {str(e)}")
                    time.sleep(0.5)
                    
        except Exception as e:
            self.log_action(f"ss monitor loop error: {str(e)}")
    
    def monitor_switch_traffic(self):
        """Monitor for traffic targeting the switch (192.168.111.198)"""
        try:
            import subprocess
            
            # Use tcpdump to monitor traffic to the switch
            # This will catch nmap scans targeting the switch
            cmd = [
                'tcpdump', '-n', '-i', 'any', '-c', '10',
                'host', '192.168.111.198',  # Traffic to/from switch
                'and', 'tcp[tcpflags] & tcp-syn != 0'  # Only SYN packets (connection attempts)
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=2)
            if result.returncode == 0 and result.stdout.strip():
                lines = result.stdout.strip().split('\n')
                if lines and len(lines) > 1:  # More than just header
                    print(f"🚨 SWITCH TRAFFIC DETECTED! {len(lines)} packets to switch:")
                    for line in lines[:3]:  # Show first 3 packets
                        if line.strip():
                            print(f"   📡 {line.strip()}")
                    
                    # Check if this looks like nmap (multiple SYN packets)
                    if len(lines) >= 5:
                        print("🚨 ALERT: Potential nmap scan targeting the switch!")
                        self.log_action("🚨 NMAP scan detected targeting switch 192.168.111.198")
                        
        except Exception as e:
            # tcpdump might not be available or need root, continue without it
            pass
    
    def network_monitor_loop(self):
        """Continuous network monitoring loop"""
        while self.monitoring_active:
            try:
                # Check for local nmap first
                if self.check_nmap_patterns():
                    print("🚨 LOCAL NMAP DETECTED! nmap is running on this machine!")
                
                self.analyze_network_connections()
                self.check_system_logs_for_nmap()  # Check system logs for nmap activity
                time.sleep(NETWORK_MONITOR_INTERVAL)
            except Exception as e:
                self.log_action(f"Network monitoring error: {str(e)}")
                time.sleep(NETWORK_MONITOR_INTERVAL)
    
    def check_system_logs_for_nmap(self):
        """Check system logs for nmap or port scanning activity"""
        try:
            # Check auth.log for connection attempts
            if os.path.exists('/var/log/auth.log'):
                with open('/var/log/auth.log', 'r') as f:
                    lines = f.readlines()
                    recent_lines = lines[-100:] if len(lines) > 100 else lines
                    
                    for line in recent_lines:
                        if 'sshd' in line and ('Failed' in line or 'Invalid' in line):
                            # Extract IP address
                            parts = line.split()
                            for i, part in enumerate(parts):
                                if part == 'from':
                                    if i + 1 < len(parts):
                                        ip = parts[i + 1]
                                        if ip not in self.suspicious_ips:
                                            self.suspicious_ips.add(ip)
                                            self.log_action(f"🔍 SSH connection attempt detected from IP: {ip}")
                                            break
            
            # Check syslog for network activity
            if os.path.exists('/var/log/syslog'):
                with open('/var/log/syslog', 'r') as f:
                    lines = f.readlines()
                    recent_lines = lines[-100:] if len(lines) > 100 else lines
                    
                    for line in recent_lines:
                        if 'kernel' in line and ('DROP' in line or 'REJECT' in line):
                            # Extract IP address
                            parts = line.split()
                            for i, part in enumerate(parts):
                                if 'SRC=' in part:
                                    ip = part.split('=')[1]
                                    if ip not in self.suspicious_ips:
                                        self.suspicious_ips.add(ip)
                                        self.log_action(f"🚫 Firewall blocked connection from IP: {ip}")
                                        break
            
            # Check for nmap-specific patterns in logs
            self.check_nmap_patterns()
                                        
        except Exception as e:
            self.log_action(f"Error checking system logs: {str(e)}")
    
    def check_nmap_patterns(self):
        """Check for nmap-specific patterns in system logs"""
        try:
            # Check if nmap process is running (someone might be running it locally)
            import subprocess
            result = subprocess.run(['pgrep', 'nmap'], capture_output=True, text=True)
            if result.returncode == 0:
                self.log_action("🚨 nmap process detected running on this system!")
                print("🚨 ALERT: nmap process detected running on this system!")
                return True
            
            # Check for recent network activity that might indicate scanning
            # Look for multiple failed connection attempts in a short time
            if os.path.exists('/var/log/syslog'):
                with open('/var/log/syslog', 'r') as f:
                    lines = f.readlines()
                    recent_lines = lines[-200:] if len(lines) > 200 else lines
                    
                    # Count connection attempts by IP in recent logs
                    ip_attempts = {}
                    for line in recent_lines:
                        if 'kernel' in line and ('DROP' in line or 'REJECT' in line):
                            parts = line.split()
                            for i, part in enumerate(parts):
                                if 'SRC=' in part:
                                    ip = part.split('=')[1]
                                    ip_attempts[ip] = ip_attempts.get(ip, 0) + 1
                    
                    # Check for IPs with many connection attempts
                    for ip, count in ip_attempts.items():
                        if count >= 5 and ip not in self.suspicious_ips:  # 5+ attempts
                            self.suspicious_ips.add(ip)
                            self.log_action(f"🔍 Multiple connection attempts from IP: {ip} - {count} attempts")
                            print(f"🚨 ALERT: Multiple connection attempts from {ip} - {count} attempts")
                            
            return False
                            
        except Exception as e:
            self.log_action(f"Error checking nmap patterns: {str(e)}")
            return False
    
    def analyze_network_connections(self):
        """Analyze current network connections for suspicious activity using REAL network monitoring"""
        try:
            import subprocess
            current_time = datetime.now()
            
            # REAL NETWORK MONITORING - Use actual network tools instead of fake psutil data
            
            # Method 1: Use ss command to see ALL TCP states including attempts
            connections = []
            ip_connections = {}
            
            try:
                ss_result = subprocess.run(['ss', '-tan', 'state', 'all'], 
                                         capture_output=True, text=True, timeout=2)
                if ss_result.returncode == 0:
                    lines = ss_result.stdout.split('\n')
                    for line in lines[1:]:  # Skip header
                        if line.strip() and ':' in line:
                            parts = line.split()
                            if len(parts) >= 5:
                                # Parse connection info
                                local_addr = parts[3]
                                remote_addr = parts[4]
                                state = parts[1]
                                
                                if ':' in remote_addr and remote_addr != '*:*':
                                    ip, port = remote_addr.rsplit(':', 1)
                                    if ip != '127.0.0.1' and ip != '::1':  # Skip localhost
                                        connections.append({
                                            'ip': ip,
                                            'port': port,
                                            'state': state,
                                            'timestamp': current_time
                                        })
                                        
                                        if ip not in ip_connections:
                                            ip_connections[ip] = []
                                        ip_connections[ip].append({
                                            'port': port,
                                            'state': state,
                                            'timestamp': current_time
                                        })
            except Exception as e:
                self.log_action(f"ss command error: {str(e)}")
            
            # Method 2: Use tcpdump to capture actual network packets (if available)
            try:
                # Capture SYN packets (connection attempts) in the last few seconds
                tcpdump_cmd = [
                    'timeout', '2', 'tcpdump', '-n', '-i', 'any', '-c', '50',
                    'tcp[tcpflags] & tcp-syn != 0',  # Only SYN packets
                    'and', 'not', 'src', '127.0.0.1'  # Exclude localhost
                ]
                
                tcpdump_result = subprocess.run(tcpdump_cmd, 
                                              capture_output=True, text=True, timeout=3)
                if tcpdump_result.returncode == 0 and tcpdump_result.stdout.strip():
                    lines = tcpdump_result.stdout.strip().split('\n')
                    for line in lines:
                        if 'IP' in line and '>' in line:
                            # Parse tcpdump output: IP 192.168.111.201.12345 > 192.168.111.198.22: Flags [S]
                            parts = line.split()
                            if len(parts) >= 3:
                                src_part = parts[1]
                                if '.' in src_part:
                                    src_ip = src_part.split('.')[0] + '.' + src_part.split('.')[1] + '.' + src_part.split('.')[2] + '.' + src_part.split('.')[3]
                                    
                                    if src_ip not in ip_connections:
                                        ip_connections[src_ip] = []
                                    
                                    # Add SYN packet as connection attempt
                                    ip_connections[src_ip].append({
                                        'port': 'SYN_ATTEMPT',
                                        'state': 'SYN_SENT',
                                        'timestamp': current_time,
                                        'type': 'packet_capture'
                                    })
                                    
                                    # Check if this looks like nmap (multiple SYN packets from same IP)
                                    syn_count = sum(1 for conn in ip_connections[src_ip] if conn.get('type') == 'packet_capture')
                                    if syn_count >= 10:  # Multiple SYN packets = potential scan
                                        if src_ip not in self.suspicious_ips:
                                            self.suspicious_ips.add(src_ip)
                                            self.log_action(f"🚨 NMAP DETECTED! Multiple SYN packets from {src_ip}: {syn_count} connection attempts")
                                            print(f"🚨 ALERT: Potential nmap scan from {src_ip} - {syn_count} SYN packets captured!")
                                            
            except Exception as e:
                # tcpdump might not be available or need root, continue without it
                pass
            
            # Method 3: Check for rapid connection state changes (nmap signature)
            for ip, conns in ip_connections.items():
                if len(conns) >= 5:  # Multiple connections from same IP
                    # Check for rapid connection attempts (nmap pattern)
                    recent_conns = [c for c in conns if (current_time - c['timestamp']).total_seconds() < 10]
                    if len(recent_conns) >= 5:
                        if ip not in self.suspicious_ips:
                            self.suspicious_ips.add(ip)
                            self.log_action(f"🚨 Rapid connection pattern detected from {ip}: {len(recent_conns)} connections in 10s")
                            print(f"🚨 ALERT: Rapid connection pattern from {ip} - {len(recent_conns)} connections in 10s")
                    
                    # Check for multiple port targeting
                    unique_ports = len(set([c['port'] for c in conns if c['port'] != 'SYN_ATTEMPT']))
                    if unique_ports >= 3:
                        if ip not in self.suspicious_ips:
                            self.suspicious_ips.add(ip)
                            self.log_action(f"🔍 Multiple port targeting detected from {ip}: {unique_ports} ports")
                            print(f"🚨 ALERT: Multiple port targeting from {ip} - {unique_ports} ports")
            
            # Update network activity with REAL data
            self.network_activity = {
                'timestamp': current_time.isoformat(),
                'total_connections': len(connections),
                'unique_ips': len(ip_connections),
                'suspicious_ips': list(self.suspicious_ips),
                'connection_details': ip_connections,
                'monitoring_method': 'real_time_packet_capture'
            }
            
            # Show REAL network status
            if ip_connections:
                print(f"📊 REAL Network Status: {len(connections)} total connections, {len(ip_connections)} unique IPs")
                for ip, conns in list(ip_connections.items())[:3]:  # Show first 3 IPs
                    print(f"   📡 {ip}: {len(conns)} connections")
                    
                    # Show connection details for suspicious IPs
                    if ip in self.suspicious_ips:
                        recent_conns = [c for c in conns if (current_time - c['timestamp']).total_seconds() < 30]
                        print(f"      🚨 Recent activity: {len(recent_conns)} connections in last 30s")
            
        except Exception as e:
            self.log_action(f"Error in real network monitoring: {str(e)}")
            print(f"❌ Network monitoring error: {str(e)}")
    
    def check_recent_connections(self):
        """Check for recent connection attempts using netstat"""
        try:
            import subprocess
            
            # Run netstat to see recent connection attempts
            result = subprocess.run(['netstat', '-an', '--tcp'], 
                                  capture_output=True, text=True, timeout=5)
            
            if result.returncode == 0:
                lines = result.stdout.split('\n')
                current_time = datetime.now()
                
                # Look for connection attempts in the last few seconds
                for line in lines:
                    if 'SYN_SENT' in line or 'TIME_WAIT' in line:
                        # Extract IP and port
                        parts = line.split()
                        if len(parts) >= 5:
                            remote_addr = parts[4]
                            if ':' in remote_addr:
                                ip, port = remote_addr.rsplit(':', 1)
                                
                                # Check if this is from our control VM
                                if ip == '192.168.111.201':
                                    if ip not in self.suspicious_ips:
                                        self.suspicious_ips.add(ip)
                                        self.log_action(f"🔍 Connection attempt detected from Control VM: {ip}:{port}")
                                        print(f"🚨 ALERT: Control VM {ip} attempting connection to port {port}")
                                
                                # Check for multiple port attempts from same IP
                                if ip not in self.suspicious_ips:
                                    # Count how many ports this IP is targeting
                                    port_attempts = sum(1 for l in lines if ip in l and ':' in l)
                                    if port_attempts >= 10:  # Multiple port attempts
                                        self.suspicious_ips.add(ip)
                                        self.log_action(f"🔍 Multiple port attempts detected from IP: {ip} - {port_attempts} ports")
                                        print(f"🚨 ALERT: Multiple port attempts from {ip} - {port_attempts} ports")
                                        break
                                        
        except Exception as e:
            # netstat might not be available, continue without it
            pass
    
    def detect_port_scanning(self, ip, connections):
        """Detect and analyze port scanning activity"""
        try:
            # Analyze connection patterns
            ports = [conn['port'] for conn in connections]
            unique_ports = len(set(ports))
            connection_count = len(connections)
            
            # Create port scanning alert
            alert = {
                'timestamp': datetime.now().isoformat(),
                'source_ip': ip,
                'connection_count': connection_count,
                'unique_ports': unique_ports,
                'ports_scanned': sorted(ports),
                'threat_level': 'HIGH' if connection_count > 50 else 'MEDIUM',
                'description': f'Port scanning detected from {ip}: {connection_count} connections to {unique_ports} ports'
            }
            
            self.port_scan_alerts.append(alert)
            
            # Use AI to analyze the threat if available
            if AI_ENABLED and self.llm:
                self.analyze_port_scan_threat(alert)
            
        except Exception as e:
            self.log_action(f"Error detecting port scanning: {str(e)}")
    
    def analyze_port_scan_threat(self, alert):
        """Use AI to analyze port scanning threat"""
        try:
            analysis_prompt = f"""
            Security Alert Analysis:
            
            Port Scanning Detected:
            - Source IP: {alert['source_ip']}
            - Connection Count: {alert['connection_count']}
            - Unique Ports: {alert['unique_ports']}
            - Threat Level: {alert['threat_level']}
            - Description: {alert['description']}
            
            Please analyze this port scanning activity and determine:
            1. Is this a real security threat?
            2. What is the likely intent of the attacker?
            3. What immediate actions should be taken?
            4. What additional monitoring should be implemented?
            5. Should this IP be blocked?
            
            Provide your security analysis and recommendations.
            """
            
            if self.agent:
                response = self.agent.invoke({"input": analysis_prompt})
                response_text = response.get('output', str(response))
                self.log_action(f"AI Port Scan Analysis: {response_text}")
                
                # Apply AI recommendations
                self.apply_port_scan_recommendations(response_text, alert)
            
        except Exception as e:
            self.log_action(f"Error in AI port scan analysis: {str(e)}")
    
    def apply_port_scan_recommendations(self, ai_response, alert):
        """Apply AI recommendations for port scanning"""
        try:
            response_lower = ai_response.lower()
            
            # Check for blocking recommendations
            if "block" in response_lower and "ip" in response_lower:
                self.block_ip(alert['source_ip'])
                self.log_action(f"AI recommended blocking IP {alert['source_ip']} due to port scanning")
            
            # Log the AI analysis
            self.log_action(f"Applied AI port scan recommendations: {ai_response[:200]}...")
            
        except Exception as e:
            self.log_action(f"Error applying AI port scan recommendations: {str(e)}")
    
    def log_action(self, message):
        """Log security actions"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        log_entry = f"[{timestamp}] {message}\n"
        
        # Write to agent log
        with open(AGENT_LOG, 'a') as f:
            f.write(log_entry)
        
        # Also print to console
        print(f"[{timestamp}] {message}")
    
    def get_network_status(self):
        """Get current network monitoring status"""
        return {
            'monitoring_active': self.monitoring_active,
            'suspicious_ips_count': len(self.suspicious_ips),
            'port_scan_alerts_count': len(self.port_scan_alerts),
            'recent_network_activity': self.network_activity,
            'suspicious_ips': list(self.suspicious_ips),
            'recent_alerts': self.port_scan_alerts[-5:] if self.port_scan_alerts else []
        }
    
    def block_user(self, username):
        """Block a user account"""
        try:
            blocked = self.load_blocked()
            if username not in blocked['users']:
                blocked['users'].append(username)
                self.save_blocked(blocked)
                self.log_action(f"User {username} blocked due to suspicious activity")
                return f"User {username} has been blocked"
            else:
                return f"User {username} is already blocked"
        except Exception as e:
            self.log_action(f"Error blocking user {username}: {str(e)}")
            return f"Error blocking user: {str(e)}"
    
    def block_ip(self, ip_address):
        """Block an IP address"""
        try:
            blocked = self.load_blocked()
            if ip_address not in blocked['ips']:
                blocked['ips'].append(ip_address)
                self.save_blocked(blocked)
                self.log_action(f"IP {ip_address} blocked due to suspicious activity")
                return f"IP {ip_address} has been blocked"
            else:
                return f"IP {ip_address} is already blocked"
        except Exception as e:
            self.log_action(f"Error blocking IP {ip_address}: {str(e)}")
            return f"Error blocking IP: {str(e)}"
    
    def load_blocked(self):
        """Load blocked users and IPs"""
        if os.path.exists(BLOCKED_FILE):
            try:
                with open(BLOCKED_FILE, 'r') as f:
                    return json.load(f)
            except:
                pass
        return {'users': [], 'ips': []}
    
    def save_blocked(self, blocked):
        """Save blocked users and IPs"""
        with open(BLOCKED_FILE, 'w') as f:
            json.dump(blocked, f, indent=2)
    
    def get_failed_attempts(self):
        """Get failed login attempts from logs"""
        failed_users = {}
        failed_ips = {}
        
        try:
            if os.path.exists(AUDIT_LOG):
                with open(AUDIT_LOG, 'r') as f:
                    lines = f.readlines()
                
                for line in lines:
                    if 'failed' in line.lower() or 'error' in line.lower():
                        # Simple parsing - you can enhance this
                        if 'user' in line.lower():
                            user = line.split()[0] if line.split() else 'unknown'
                            failed_users[user] = failed_users.get(user, 0) + 1
                        if 'ip' in line.lower():
                            ip = line.split()[-1] if line.split() else 'unknown'
                            failed_ips[ip] = failed_ips.get(ip, 0) + 1
        except Exception as e:
            self.log_action(f"Error parsing failed attempts: {str(e)}")
        
        return failed_users, failed_ips
    
    def analyze_network_threats(self):
        """Analyze current network threats using AI"""
        try:
            network_status = self.get_network_status()
            
            if network_status['suspicious_ips_count'] == 0:
                return "No network threats detected. Network appears secure."
            
            # Create analysis prompt
            analysis_prompt = f"""
            Network Security Analysis:
            
            Current Network Status:
            - Suspicious IPs: {network_status['suspicious_ips_count']}
            - Suspicious IPs: {network_status['suspicious_ips']}
            - Recent Alerts: {network_status['recent_alerts']}
            
            Please analyze this network activity and determine:
            1. What types of attacks are being attempted?
            2. What is the overall threat level?
            3. What immediate security measures should be taken?
            4. What long-term security improvements are needed?
            
            Provide your security analysis and action plan.
            """
            
            if self.agent:
                response = self.agent.invoke({"input": analysis_prompt})
                response_text = response.get('output', str(response))
                return f"AI Network Threat Analysis:\n{response_text}"
            else:
                return f"Basic Network Threat Analysis:\n{network_status}"
                
        except Exception as e:
            return f"Error analyzing network threats: {str(e)}"
    
    def ai_security_analysis(self):
        """Run AI-powered security analysis"""
        try:
            # Get recent log data
            log_data = self.read_security_logs()
            
            # Get failed attempts
            failed_users, failed_ips = self.get_failed_attempts()
            
            # Get network status
            network_status = self.get_network_status()
            
            if AI_ENABLED and self.llm:
                # Create analysis prompt
                analysis_prompt = f"""
                Security Analysis Request:
                
                Recent Log Data:
                {log_data}
                
                Failed Login Summary (Last {TIME_WINDOW_MINUTES} minutes):
                Users with failed attempts: {failed_users}
                IPs with failed attempts: {failed_ips}
                
                Network Security Status:
                - Suspicious IPs: {network_status['suspicious_ips_count']}
                - Port Scan Alerts: {network_status['port_scan_alerts_count']}
                - Recent Network Alerts: {network_status['recent_alerts']}
                
                Please analyze this security data and determine:
                1. Is there a security threat present?
                2. What is the threat level (Low/Medium/High/Critical)?
                3. Should any users or IPs be blocked?
                4. What additional monitoring should be implemented?
                5. Are there any network-based attacks happening?
                
                Provide your analysis and recommendations.
                """
                
                # Get AI analysis
                response = self.agent.invoke({"input": analysis_prompt})
                response_text = response.get('output', str(response))
                self.log_action(f"AI Analysis: {response_text}")
                
                # Apply AI recommendations
                self.apply_ai_recommendations(response_text, failed_users, failed_ips)
            else:
                # Basic security analysis without AI
                self.log_action(f"Basic Security Analysis - Users with failed attempts: {failed_users}, IPs with failed attempts: {failed_ips}")
                self.basic_security_check()
            
        except Exception as e:
            self.log_action(f"AI Analysis Error: {str(e)}")
            # Fallback to basic logic
            self.basic_security_check()
    
    def read_security_logs(self):
        """Read and return recent security log entries"""
        if not os.path.exists(AUDIT_LOG):
            return "No audit log found."
        
        with open(AUDIT_LOG, 'r') as f:
            lines = f.readlines()
        
        # Get last 50 lines for analysis
        recent_lines = lines[-50:] if len(lines) > 50 else lines
        return "Recent security log entries:\n" + "".join(recent_lines)
    
    def analyze_threat_pattern(self, log_data):
        """AI-powered threat pattern analysis"""
        prompt = PromptTemplate(
            input_variables=["log_data"],
            template="""
            Analyze the following security log data for potential threats:
            
            {log_data}
            
            Identify:
            1. Suspicious patterns
            2. Potential attack vectors
            3. Security recommendations
            
            Provide your analysis.
            """
        )
        
        if self.llm:
            chain = LLMChain(llm=self.llm, prompt=prompt)
            return chain.run(log_data=log_data)
        else:
            return "AI analysis not available"
    
    def apply_ai_recommendations(self, ai_response, failed_users, failed_ips):
        """Apply AI recommendations"""
        try:
            # Simple parsing of AI response for blocking recommendations
            response_lower = ai_response.lower()
            
            # Check for blocking recommendations
            if "block" in response_lower and "user" in response_lower:
                for user, count in failed_users.items():
                    if count >= FAILED_THRESHOLD:
                        self.block_user(user)
            
            if "block" in response_lower and "ip" in response_lower:
                for ip, count in failed_ips.items():
                    if count >= FAILED_THRESHOLD:
                        self.block_ip(ip)
            
            self.log_action(f"Applied AI recommendations: {ai_response[:200]}...")
            
        except Exception as e:
            self.log_action(f"Error applying AI recommendations: {str(e)}")
    
    def basic_security_check(self):
        """Fallback to basic security logic"""
        blocked = self.load_blocked()
        failed_users, failed_ips = self.get_failed_attempts()
        
        # Block users
        for user, count in failed_users.items():
            if count >= FAILED_THRESHOLD and user not in blocked['users']:
                blocked['users'].append(user)
                self.log_action(f"Basic logic blocked user: {user} after {count} failed attempts.")
        
        # Block IPs
        for ip, count in failed_ips.items():
            if count >= FAILED_THRESHOLD and ip not in blocked['ips']:
                blocked['ips'].append(ip)
                self.log_action(f"Basic logic blocked IP: {ip} after {count} failed attempts.")
        
        self.save_blocked(blocked)
    
    def run(self):
        """Main agent loop"""
        print("[AI Security Agent] Starting AI-powered security monitoring...")
        print(f"[AI Security Agent] Using LLM: {type(self.llm).__name__}")
        
        # Start network monitoring
        self.start_network_monitoring()
        print("[AI Security Agent] Network monitoring started in background")
        
        while True:
            try:
                print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Running AI security analysis...")
                self.ai_security_analysis()
                
                # Show network status
                network_status = self.get_network_status()
                if network_status['suspicious_ips_count'] > 0:
                    print(f"🚨 ALERT: {network_status['suspicious_ips_count']} suspicious IPs detected!")
                    print(f"📊 Port scan alerts: {network_status['port_scan_alerts_count']}")
                
                time.sleep(60)  # Run every minute
            except KeyboardInterrupt:
                print("\n[AI Security Agent] Shutting down...")
                self.monitoring_active = False
                break
            except Exception as e:
                print(f"[AI Security Agent] Error: {e}")
                time.sleep(60)

    def manual_analysis(self):
        """Run a single manual analysis"""
        print("[AI Security Agent] Running manual analysis...")
        try:
            # Start network monitoring for manual analysis
            self.start_network_monitoring()
            
            # Run security analysis
            self.ai_security_analysis()
            
            # Get network status
            network_status = self.get_network_status()
            print(f"\n📊 Network Status:")
            print(f"   - Monitoring Active: {network_status['monitoring_active']}")
            print(f"   - Suspicious IPs: {network_status['suspicious_ips_count']}")
            print(f"   - Port Scan Alerts: {network_status['port_scan_alerts_count']}")
            
            if network_status['suspicious_ips_count'] > 0:
                print(f"🚨 Suspicious IPs: {network_status['suspicious_ips']}")
                print(f"📋 Recent Alerts: {len(network_status['recent_alerts'])}")
            
            # Stop monitoring after manual analysis
            self.monitoring_active = False
            
            print("[AI Security Agent] Manual analysis completed successfully!")
            return True
        except Exception as e:
            print(f"[AI Security Agent] Manual analysis failed: {e}")
            self.monitoring_active = False
            return False

    def monitor_switch_for_nmap(self):
        """Specifically monitor the switch (192.168.111.198) for nmap activity"""
        try:
            import subprocess
            current_time = datetime.now()
            
            # Method 1: Monitor ping latency to switch (nmap can cause latency spikes)
            try:
                ping_result = subprocess.run(['ping', '-c', '3', '-W', '1', '192.168.111.198'], 
                                           capture_output=True, text=True, timeout=5)
                if ping_result.returncode == 0:
                    # Parse ping output for latency
                    lines = ping_result.stdout.split('\n')
                    latencies = []
                    for line in lines:
                        if 'time=' in line:
                            time_part = line.split('time=')[1].split()[0]
                            try:
                                latency = float(time_part)
                                latencies.append(latency)
                            except:
                                pass
                    
                    if latencies:
                        avg_latency = sum(latencies) / len(latencies)
                        max_latency = max(latencies)
                        
                        # Check for unusual latency (nmap can cause spikes)
                        if max_latency > 100:  # More than 100ms is unusual for local network
                            print(f"⚠️ Switch latency spike detected: {max_latency:.1f}ms (avg: {avg_latency:.1f}ms)")
                            
                        # Store latency for trend analysis
                        if not hasattr(self, 'switch_latencies'):
                            self.switch_latencies = []
                        self.switch_latencies.append({
                            'timestamp': current_time,
                            'avg_latency': avg_latency,
                            'max_latency': max_latency
                        })
                        
                        # Keep only last 20 measurements
                        if len(self.switch_latencies) > 20:
                            self.switch_latencies.pop(0)
                        
                        # Check for latency trend (increasing latency might indicate nmap)
                        if len(self.switch_latencies) >= 5:
                            recent_avg = sum([l['avg_latency'] for l in self.switch_latencies[-5:]]) / 5
                            older_avg = sum([l['avg_latency'] for l in self.switch_latencies[:5]]) / 5
                            if recent_avg > older_avg * 2:  # Latency doubled
                                print(f"🚨 Switch latency trend: {older_avg:.1f}ms → {recent_avg:.1f}ms (potential network stress)")
                                
            except Exception as e:
                pass
            
            # Method 2: Use tcpdump to specifically monitor traffic TO the switch
            try:
                # Capture packets going TO the switch (192.168.111.198)
                tcpdump_cmd = [
                    'timeout', '3', 'tcpdump', '-n', '-i', 'any', '-c', '100',
                    'dst', '192.168.111.198',  # Traffic TO switch
                    'and', 'tcp[tcpflags] & tcp-syn != 0'  # Only SYN packets
                ]
                
                tcpdump_result = subprocess.run(tcpdump_cmd, 
                                              capture_output=True, text=True, timeout=4)
                if tcpdump_result.returncode == 0 and tcpdump_result.stdout.strip():
                    lines = tcpdump_result.stdout.strip().split('\n')
                    if len(lines) > 1:  # More than just header
                        print(f"🔍 Switch traffic detected: {len(lines)} packets to switch")
                        
                        # Group by source IP
                        src_ips = {}
                        for line in lines:
                            if 'IP' in line and '>' in line:
                                parts = line.split()
                                if len(parts) >= 3:
                                    src_part = parts[1]
                                    if '.' in src_part:
                                        src_ip = src_part.split('.')[0] + '.' + src_part.split('.')[1] + '.' + src_part.split('.')[2] + '.' + src_part.split('.')[3]
                                        if src_ip not in src_ips:
                                            src_ips[src_ip] = 0
                                        src_ips[src_ip] += 1
                        
                        # Check for nmap patterns
                        for src_ip, packet_count in src_ips.items():
                            if packet_count >= 10:  # Multiple SYN packets to switch
                                print(f"🚨 ALERT: Potential nmap scan to switch from {src_ip} - {packet_count} SYN packets!")
                                self.log_action(f"🚨 NMAP scan to switch detected from {src_ip}: {packet_count} packets")
                                
                                if src_ip not in self.suspicious_ips:
                                    self.suspicious_ips.add(src_ip)
                                    
            except Exception as e:
                # tcpdump might not be available or need root
                pass
            
            # Method 3: Check if switch is responding slowly (nmap can overwhelm it)
            try:
                # Quick connectivity test
                quick_ping = subprocess.run(['ping', '-c', '1', '-W', '2', '192.168.111.198'], 
                                          capture_output=True, text=True, timeout=3)
                if quick_ping.returncode != 0:
                    print(f"⚠️ Switch connectivity issue detected - ping failed")
                    self.log_action("⚠️ Switch connectivity issue - potential nmap overload")
                    
            except Exception as e:
                pass
                
        except Exception as e:
            self.log_action(f"Switch monitoring error: {str(e)}")
    
    def enhanced_network_monitor_loop(self):
        """Enhanced network monitoring with switch-specific monitoring"""
        while self.monitoring_active:
            try:
                # Monitor general network
                self.analyze_network_connections()
                
                # Specifically monitor the switch for nmap
                self.monitor_switch_for_nmap()
                
                # Check system logs
                self.check_system_logs_for_nmap()
                
                # NEW: DDoS and Brute Force Detection
                self.detect_ddos_attacks()
                self.detect_brute_force_attempts()
                
                time.sleep(0.5)  # Check every 0.5 seconds
                
            except Exception as e:
                self.log_action(f"Enhanced monitoring error: {str(e)}")
                time.sleep(0.5)

    def detect_ddos_attacks(self):
        """Detect DDoS attacks including connection floods and resource exhaustion"""
        try:
            current_time = datetime.now()
            
            # Method 1: Connection Rate Monitoring
            if not hasattr(self, 'connection_history'):
                self.connection_history = []
            
            # Get current connection count
            try:
                ss_result = subprocess.run(['ss', '-tan', 'state', 'all'], 
                                         capture_output=True, text=True, timeout=2)
                if ss_result.returncode == 0:
                    lines = ss_result.stdout.split('\n')
                    current_connections = len(lines) - 1  # Subtract header
                    
                    # Store connection count with timestamp
                    self.connection_history.append({
                        'timestamp': current_time,
                        'connections': current_connections
                    })
                    
                    # Keep only last 60 measurements (30 seconds)
                    if len(self.connection_history) > 60:
                        self.connection_history.pop(0)
                    
                    # Check for connection flood (DDoS signature)
                    if len(self.connection_history) >= 10:
                        recent_avg = sum([h['connections'] for h in self.connection_history[-10:]]) / 10
                        older_avg = sum([h['connections'] for h in self.connection_history[:10]]) / 10
                        
                        # If connections increased by 300% in 5 seconds
                        if recent_avg > older_avg * 3:
                            print(f"🚨 DDoS ALERT: Connection flood detected!")
                            print(f"   📊 Connections: {older_avg:.0f} → {recent_avg:.0f} (+{((recent_avg/older_avg)-1)*100:.0f}%)")
                            self.log_action(f"🚨 DDoS: Connection flood - {older_avg:.0f} → {recent_avg:.0f} connections")
                            
                            # Add to suspicious IPs if we can identify the source
                            if '192.168.111.198' not in self.suspicious_ips:
                                self.suspicious_ips.add('192.168.111.198')
                                
            except Exception as e:
                pass
            
            # Method 2: Resource Exhaustion Monitoring
            try:
                # Check system resources
                import psutil
                
                # CPU usage
                cpu_percent = psutil.cpu_percent(interval=1)
                if cpu_percent > 80:  # High CPU usage
                    print(f"⚠️ High CPU usage detected: {cpu_percent:.1f}%")
                    if cpu_percent > 95:
                        print(f"🚨 CRITICAL: CPU exhaustion - {cpu_percent:.1f}%")
                        self.log_action(f"🚨 DDoS: CPU exhaustion - {cpu_percent:.1f}%")
                
                # Memory usage
                memory = psutil.virtual_memory()
                if memory.percent > 85:  # High memory usage
                    print(f"⚠️ High memory usage: {memory.percent:.1f}%")
                    if memory.percent > 95:
                        print(f"🚨 CRITICAL: Memory exhaustion - {memory.percent:.1f}%")
                        self.log_action(f"🚨 DDoS: Memory exhaustion - {memory.percent:.1f}%")
                
                # Network interface saturation
                net_io = psutil.net_io_counters()
                if not hasattr(self, 'last_net_io'):
                    self.last_net_io = net_io
                    self.last_net_time = current_time
                else:
                    time_diff = (current_time - self.last_net_time).total_seconds()
                    if time_diff > 0:
                        bytes_sent_rate = (net_io.bytes_sent - self.last_net_io.bytes_sent) / time_diff
                        bytes_recv_rate = (net_io.bytes_recv - self.last_net_io.bytes_recv) / time_diff
                        
                        # High network activity (potential DDoS)
                        if bytes_recv_rate > 1000000:  # > 1MB/s
                            print(f"⚠️ High network activity: {bytes_recv_rate/1000000:.1f} MB/s received")
                            if bytes_recv_rate > 10000000:  # > 10MB/s
                                print(f"🚨 CRITICAL: Network saturation - {bytes_recv_rate/1000000:.1f} MB/s")
                                self.log_action(f"🚨 DDoS: Network saturation - {bytes_recv_rate/1000000:.1f} MB/s")
                        
                        self.last_net_io = net_io
                        self.last_net_time = current_time
                        
            except Exception as e:
                pass
            
            # Method 3: SYN Flood Detection
            try:
                # Monitor for excessive SYN packets (SYN flood attack)
                tcpdump_cmd = [
                    'timeout', '2', 'tcpdump', '-n', '-i', 'any', '-c', '100',
                    'tcp[tcpflags] & tcp-syn != 0',  # Only SYN packets
                    'and', 'not', 'src', '127.0.0.1'  # Exclude localhost
                ]
                
                tcpdump_result = subprocess.run(tcpdump_cmd, 
                                              capture_output=True, text=True, timeout=3)
                if tcpdump_result.returncode == 0 and tcpdump_result.stdout.strip():
                    lines = tcpdump_result.stdout.strip().split('\n')
                    if len(lines) > 50:  # More than 50 SYN packets in 2 seconds
                        print(f"🚨 DDoS ALERT: SYN flood detected!")
                        print(f"   📊 SYN packets: {len(lines)} in 2 seconds")
                        self.log_action(f"🚨 DDoS: SYN flood - {len(lines)} packets in 2s")
                        
            except Exception as e:
                pass
                
        except Exception as e:
            self.log_action(f"DDoS detection error: {str(e)}")

    def detect_brute_force_attempts(self):
        """Detect brute force attacks including repeated authentication failures"""
        try:
            current_time = datetime.now()
            
            # Method 1: SSH Brute Force Detection
            try:
                # Check auth.log for SSH failures
                if os.path.exists('/var/log/auth.log'):
                    with open('/var/log/auth.log', 'r') as f:
                        lines = f.readlines()
                        recent_lines = lines[-200:] if len(lines) > 200 else lines
                        
                        # Count SSH failures by IP
                        ssh_failures = {}
                        for line in recent_lines:
                            if 'sshd' in line and 'Failed password' in line:
                                # Extract IP address
                                parts = line.split()
                                for i, part in enumerate(parts):
                                    if part == 'from':
                                        if i + 1 < len(parts):
                                            ip = parts[i + 1]
                                            if ip not in ssh_failures:
                                                ssh_failures[ip] = 0
                                            ssh_failures[ip] += 1
                                            break
                        
                        # Check for brute force patterns
                        for ip, failures in ssh_failures.items():
                            if failures >= 5:  # 5+ failed attempts
                                print(f"🚨 BRUTE FORCE ALERT: SSH attacks from {ip}")
                                print(f"   📊 Failed attempts: {failures}")
                                self.log_action(f"🚨 Brute Force: SSH - {ip} - {failures} failures")
                                
                                if ip not in self.suspicious_ips:
                                    self.suspicious_ips.add(ip)
                                    
            except Exception as e:
                pass
            
            # Method 2: HTTP Authentication Failures
            try:
                # Check for web server authentication failures
                if os.path.exists('/var/log/apache2/access.log'):
                    with open('/var/log/apache2/access.log', 'r') as f:
                        lines = f.readlines()
                        recent_lines = lines[-100:] if len(lines) > 100 else lines
                        
                        # Count 401/403 responses by IP
                        http_failures = {}
                        for line in recent_lines:
                            if ' 401 ' in line or ' 403 ' in line:
                                parts = line.split()
                                if len(parts) >= 1:
                                    ip = parts[0]
                                    if ip not in http_failures:
                                        http_failures[ip] = 0
                                    http_failures[ip] += 1
                        
                        # Check for brute force patterns
                        for ip, failures in http_failures.items():
                            if failures >= 10:  # 10+ auth failures
                                print(f"🚨 BRUTE FORCE ALERT: HTTP attacks from {ip}")
                                print(f"   📊 Auth failures: {failures}")
                                self.log_action(f"🚨 Brute Force: HTTP - {ip} - {failures} failures")
                                
                                if ip not in self.suspicious_ips:
                                    self.suspicious_ips.add(ip)
                                    
            except Exception as e:
                pass
            
            # Method 3: Account Lockout Detection
            try:
                # Check for account lockouts in auth.log
                if os.path.exists('/var/log/auth.log'):
                    with open('/var/log/auth.log', 'r') as f:
                        lines = f.readlines()
                        recent_lines = lines[-100:] if len(lines) > 100 else lines
                        
                        lockout_count = 0
                        for line in recent_lines:
                            if 'Account locked' in line or 'Account temporarily locked' in line:
                                lockout_count += 1
                        
                        if lockout_count > 0:
                            print(f"⚠️ Account lockouts detected: {lockout_count}")
                            if lockout_count >= 3:
                                print(f"🚨 CRITICAL: Multiple account lockouts - {lockout_count}")
                                self.log_action(f"🚨 Brute Force: Multiple account lockouts - {lockout_count}")
                                
            except Exception as e:
                pass
                
        except Exception as e:
            self.log_action(f"Brute force detection error: {str(e)}")

def main():
    """Main function with command line argument support"""
    parser = argparse.ArgumentParser(description='AI Security Agent')
    parser.add_argument('--manual-analysis', action='store_true', 
                       help='Run a single manual analysis and exit')
    parser.add_argument('--test-network', action='store_true',
                       help='Test network monitoring capabilities')
    parser.add_argument('--start-monitoring', action='store_true',
                       help='Start continuous network monitoring')
    parser.add_argument('--monitor-status', action='store_true',
                       help='Show current monitoring status and exit')
    parser.add_argument('--get-logs', action='store_true',
                       help='Show recent security logs and exit')
    
    args = parser.parse_args()
    
    agent = AISecurityAgent()
    
    if args.monitor_status:
        # Show monitoring status
        print("[AI Security Agent] Current Monitoring Status:")
        print(f"📡 Monitoring Active: {agent.monitoring_active}")
        print(f"🔍 Suspicious IPs: {len(agent.suspicious_ips)}")
        print(f"🚨 Port Scan Alerts: {len(agent.port_scan_alerts)}")
        
        network_status = agent.get_network_status()
        print(f"🌐 Network Status: {network_status['suspicious_ips_count']} suspicious IPs")
        if network_status['suspicious_ips_count'] > 0:
            print(f"🚨 Suspicious IPs: {network_status['suspicious_ips']}")
        
        sys.exit(0)
        
    elif args.get_logs:
        # Show recent logs
        print("[AI Security Agent] Recent Security Logs:")
        try:
            if os.path.exists(AGENT_LOG):
                with open(AGENT_LOG, 'r') as f:
                    lines = f.readlines()
                    recent_lines = lines[-20:] if len(lines) > 20 else lines
                    for line in recent_lines:
                        print(line.strip())
            else:
                print("No log file found.")
        except Exception as e:
            print(f"Error reading logs: {e}")
        sys.exit(0)
        
    elif args.start_monitoring:
        # Start continuous monitoring
        print("[AI Security Agent] Starting continuous monitoring...")
        agent.start_network_monitoring()
        agent.run()
        
    elif args.test_network:
        # Test network monitoring
        print("[AI Security Agent] Testing ENHANCED network monitoring...")
        print("🔍 This will use REAL network monitoring tools (tcpdump, ss, ping)")
        print("💡 Run nmap from Control VM to switch (192.168.111.198) to test detection!")
        
        agent.start_network_monitoring()
        
        print("🔍 Enhanced network monitoring started. Testing for 30 seconds...")
        print("📡 Monitoring methods:")
        print("   - Real-time packet capture (tcpdump)")
        print("   - TCP connection states (ss command)")
        print("   - Switch latency monitoring")
        print("   - Switch traffic analysis")
        print("   - 🚨 DDoS attack detection (connection floods, resource exhaustion)")
        print("   - 🔐 Brute force detection (SSH, HTTP, account lockouts)")
        
        try:
            print("🔍 Starting CONTINUOUS enhanced monitoring...")
            print("📡 Running switch monitoring every 2 seconds...")
            
            for i in range(6):  # 30 seconds (6 * 5 second intervals)
                time.sleep(5)
                
                print(f"\n📊 Status update {i+1}/6:")
                
                # Run enhanced monitoring during test
                print("🔍 Running switch monitoring...")
                agent.monitor_switch_for_nmap()
                
                # Also run general network analysis
                print("🔍 Running network analysis...")
                agent.analyze_network_connections()
                
                network_status = agent.get_network_status()
                print(f"📊 Network Status: {network_status['suspicious_ips_count']} suspicious IPs")
                
                if network_status['suspicious_ips_count'] > 0:
                    print(f"🚨 Suspicious IPs detected: {network_status['suspicious_ips']}")
                    print(f"🎯 Run nmap from Control VM to switch to test detection!")
                    break
                    
        except KeyboardInterrupt:
            print("\n⏹️ Test interrupted by user")
        
        agent.monitoring_active = False
        print("✅ Enhanced network monitoring test completed!")
        
    elif args.manual_analysis:
        # Run single analysis for manual trigger
        success = agent.manual_analysis()
        sys.exit(0 if success else 1)
    else:
        # Run continuous monitoring loop
        agent.run()

if __name__ == '__main__':
    main() 