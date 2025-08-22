#!/usr/bin/env python3
"""
Cisco Switch Syslog Server with AI-Powered Threat Detection
Receives logs from Cisco switches and analyzes them for security threats using Ollama
"""

import socket
import json
import time
from datetime import datetime
import threading

class SwitchSyslogServer:
    def __init__(self, host='0.0.0.0', port=514):  # Changed back to 514
        self.host = host
        self.port = port
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.security_events = []
        self.running = False
        
        # Try to initialize Ollama
        try:
            import ollama
            self.ollama = ollama
            print("✅ Ollama connected successfully")
            self.ai_enabled = True
        except ImportError:
            print("⚠️ Ollama not installed. Install with: pip install ollama")
            self.ollama = None
            self.ai_enabled = False
        except Exception as e:
            print(f"⚠️ Ollama connection failed: {e}")
            self.ollama = None
            self.ai_enabled = False
        
    def start(self):
        """Start the syslog server"""
        try:
            self.socket.bind((self.host, self.port))
            self.running = True
            print(f"🔍 Switch Syslog Server listening on {self.host}:{self.port}")
            print("📡 Waiting for Cisco switch logs...")
            print(f"🤖 AI Analysis: {'Enabled' if self.ai_enabled else 'Disabled'}")
            print("💡 Configure your Cisco switch with: logging host <YOUR_VM_IP>")
            print("⚠️ Note: Port 514 requires sudo - run with: sudo python3 syslog_server.py")
            print("-" * 60)
            
            # Start monitoring thread
            monitor_thread = threading.Thread(target=self.monitor_events, daemon=True)
            monitor_thread.start()
            
            # Main receive loop
            while self.running:
                try:
                    data, addr = self.socket.recvfrom(1024)
                    message = data.decode('utf-8', errors='ignore')
                    self.process_switch_log(message, addr)
                except Exception as e:
                    if self.running:  # Only print errors if we're supposed to be running
                        print(f"Error receiving data: {e}")
                        
        except Exception as e:
            print(f"Failed to start server: {e}")
        finally:
            self.stop()
            
    def stop(self):
        """Stop the syslog server"""
        self.running = False
        try:
            self.socket.close()
            print("🛑 Syslog server stopped")
        except:
            pass
            
    def process_switch_log(self, message, addr):
        """Process incoming switch log message"""
        timestamp = datetime.now().isoformat()
        
        print(f"\n📥 Received log from {addr[0]}:")
        print(f"📝 {message}")
        
        # AI Analysis with Ollama
        if self.ai_enabled:
            threat_analysis = self.ai_analyze_threat(message)
        else:
            threat_analysis = self.basic_analyze_threat(message)
        
        event = {
            'timestamp': timestamp,
            'source_ip': addr[0],
            'message': message,
            'threat_level': threat_analysis['level'],
            'insights': threat_analysis.get('insights', ''),
            'recommendations': threat_analysis.get('recommendations', []),
            'ai_analyzed': self.ai_enabled
        }
        
        self.security_events.append(event)
        
        # Save to shared file for backend API
        self.save_to_shared_file(message, threat_analysis)
        
        # Display threat analysis
        print(f"🚨 Threat Level: {event['threat_level']}")
        if event['insights']:
            print(f"🤖 Analysis: {event['insights']}")
        if event['recommendations']:
            print(f"💡 Recommendations: {', '.join(event['recommendations'])}")
        print("-" * 60)
        
        # Alert on high threats
        if event['threat_level'] in ['HIGH', 'CRITICAL']:
            self.send_alert(event)
            
    def ai_analyze_threat(self, message):
        """Analyze threat using Ollama AI"""
        try:
            # Try different models in order of preference
            models_to_try = ['llama3.2:1b', 'llama3.2:3b', 'llama3.2', 'mistral:7b', 'mistral']
            
            for model_name in models_to_try:
                try:
                    prompt = f"""
                    Analyze this Cisco switch log message for security threats:
                    "{message}"
                    
                    Provide a clear, concise analysis in this format:
                    Threat Level: [LOW/MEDIUM/HIGH/CRITICAL]
                    Analysis: [Brief explanation of what this log means]
                    Recommendations: [Action1, Action2, Action3]
                    
                    Keep it simple and readable, no JSON formatting.
                    """
                    
                    response = self.ollama.chat(model=model_name, messages=[{'role': 'user', 'content': prompt}])
                    content = response['message']['content']
                    
                    # Parse the response to extract components
                    lines = content.split('\n')
                    level = 'MEDIUM'
                    insights = 'AI analysis completed'
                    recommendations = ['Continue monitoring']
                    
                    for line in lines:
                        line = line.strip()
                        if line.startswith('Threat Level:'):
                            level = line.replace('Threat Level:', '').strip()
                        elif line.startswith('Analysis:'):
                            insights = line.replace('Analysis:', '').strip()
                        elif line.startswith('Recommendations:'):
                            recs = line.replace('Recommendations:', '').strip()
                            recommendations = [r.strip() for r in recs.split(',')]
                    
                    return {
                        'level': level,
                        'insights': insights,
                        'recommendations': recommendations
                    }
                        
                except Exception as model_error:
                    print(f"Model {model_name} failed: {model_error}")
                    continue
            
            # If all models fail, use basic analysis
            print("All AI models failed, using basic threat analysis")
            return self.basic_analyze_threat(message)
                
        except Exception as e:
            print(f"AI Analysis Error: {e}")
            return self.basic_analyze_threat(message)
            
    def save_to_shared_file(self, log_data, threat_data):
        """Save log and threat data to shared file for backend API"""
        try:
            # Read existing data
            try:
                with open('syslog_data.json', 'r') as f:
                    shared_data = json.load(f)
            except FileNotFoundError:
                shared_data = {"logs": [], "threats": [], "alerts": [], "last_update": None}
            
            # Add new log
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "message": log_data,
                "level": "info",
                "source": "192.168.111.198"
            }
            shared_data["logs"].append(log_entry)
            
            # Add new threat if exists
            if threat_data:
                threat_entry = {
                    "timestamp": datetime.now().isoformat(),
                    "type": f"Interface State Change - {threat_data['level']}",
                    "severity": threat_data['level'].lower(),
                    "description": threat_data['insights'],
                    "source_ip": "192.168.111.198"
                }
                shared_data["threats"].append(threat_entry)
                
                # Create alert
                alert_entry = {
                    "timestamp": datetime.now().isoformat(),
                    "level": "Warning" if threat_data['level'] in ['MEDIUM', 'HIGH', 'CRITICAL'] else "Info",
                    "title": f"Interface State Change - {threat_data['level']}",
                    "message": log_data,
                    "recommendation": ", ".join(threat_data['recommendations']) if isinstance(threat_data['recommendations'], list) else str(threat_data['recommendations'])
                }
                shared_data["alerts"].append(alert_entry)
            
            # Keep only last 100 entries
            if len(shared_data["logs"]) > 100:
                shared_data["logs"] = shared_data["logs"][-100:]
            if len(shared_data["threats"]) > 50:
                shared_data["threats"] = shared_data["threats"][-50:]
            if len(shared_data["alerts"]) > 50:
                shared_data["alerts"] = shared_data["alerts"][-50:]
            
            shared_data["last_update"] = datetime.now().isoformat()
            
            # Write back to file
            with open('syslog_data.json', 'w') as f:
                json.dump(shared_data, f, indent=2)
                
        except Exception as e:
            print(f"❌ Failed to save to shared file: {e}")

    def basic_analyze_threat(self, message):
        """Basic threat analysis without AI - Enhanced for Cisco syslog"""
        message_lower = message.lower()
        
        # Cisco syslog specific patterns
        if any(word in message_lower for word in ['%sys-5-config_i', 'configured from console']):
            return {
                'level': 'LOW', 
                'insights': 'Configuration change via console - normal admin activity', 
                'recommendations': ['Verify authorized user', 'Monitor for unauthorized changes']
            }
        elif any(word in message_lower for word in ['%sys-6-logginghost_startstop', 'logging to host']):
            return {
                'level': 'LOW', 
                'insights': 'Syslog logging started - expected behavior', 
                'recommendations': ['Continue monitoring', 'Verify logging destination']
            }
        elif any(word in message_lower for word in ['%link-5-changed', 'interface', 'changed state to administratively down']):
            return {
                'level': 'MEDIUM', 
                'insights': 'Interface administratively shut down - this could indicate network maintenance or potential unauthorized access', 
                'recommendations': ['Verify authorized user', 'Check if change was expected', 'Monitor for patterns']
            }
        elif any(word in message_lower for word in ['%link-3-updown', 'interface', 'changed state to up']):
            return {
                'level': 'LOW', 
                'insights': 'Interface brought back up - normal admin action or recovery from previous shutdown', 
                'recommendations': ['Verify authorized user', 'Check interface status', 'Monitor for stability']
            }
        elif any(word in message_lower for word in ['%link-3-updown', 'interface', 'changed state to down']):
            return {
                'level': 'MEDIUM', 
                'insights': 'Interface went down unexpectedly - investigate for potential network issues or security concerns', 
                'recommendations': ['Check physical connection', 'Verify no unauthorized access', 'Monitor for patterns', 'Check switch logs']
            }
        elif any(word in message_lower for word in ['%sys-5-config_i', 'configured from']):
            return {
                'level': 'MEDIUM', 
                'insights': 'Configuration change detected', 
                'recommendations': ['Verify authorized user', 'Check what was changed']
            }
        elif any(word in message_lower for word in ['%sys-3-invalidpassword', 'invalid password']):
            return {
                'level': 'HIGH', 
                'insights': 'Invalid password attempt detected', 
                'recommendations': ['Check source IP', 'Monitor for brute force', 'Consider blocking source']
            }
        elif any(word in message_lower for word in ['%sys-3-authfail', 'authentication failed']):
            return {
                'level': 'HIGH', 
                'insights': 'Authentication failure detected', 
                'recommendations': ['Investigate source', 'Check user accounts', 'Monitor for escalation']
            }
        elif any(word in message_lower for word in ['%sys-3-accessdenied', 'access denied']):
            return {
                'level': 'HIGH', 
                'insights': 'Access denied - potential unauthorized access attempt', 
                'recommendations': ['Block source IP', 'Review access lists', 'Investigate immediately']
            }
        elif any(word in message_lower for word in ['%sys-4-interface', 'interface down', 'link down']):
            return {
                'level': 'MEDIUM', 
                'insights': 'Interface status change detected', 
                'recommendations': ['Check physical connection', 'Monitor for patterns', 'Verify expected behavior']
            }
        elif any(word in message_lower for word in ['%sys-2-crit', 'critical', 'fatal']):
            return {
                'level': 'CRITICAL', 
                'insights': 'Critical system event detected', 
                'recommendations': ['Immediate investigation required', 'Check system resources', 'Consider emergency procedures']
            }
        elif any(word in message_lower for word in ['%sys-1-emerg', 'emergency', 'panic']):
            return {
                'level': 'CRITICAL', 
                'insights': 'Emergency system condition', 
                'recommendations': ['Immediate action required', 'System may be compromised', 'Contact security team']
            }
        # High threat patterns (general)
        elif any(word in message_lower for word in ['denied', 'failed', 'invalid', 'attack', 'intrusion', 'brute force']):
            return {
                'level': 'HIGH', 
                'insights': 'Access denied or failed attempt detected', 
                'recommendations': ['Check source IP', 'Review access logs', 'Consider blocking source']
            }
        # Medium threat patterns
        elif any(word in message_lower for word in ['warning', 'error', 'unauthorized', 'authentication failed']):
            return {
                'level': 'MEDIUM', 
                'insights': 'Warning or authentication error detected', 
                'recommendations': ['Monitor for escalation', 'Check user credentials']
            }
        # Low threat patterns
        elif any(word in message_lower for word in ['link down', 'interface', 'configuration', 'console', 'logging']):
            return {
                'level': 'LOW', 
                'insights': 'Normal operational event', 
                'recommendations': ['Continue monitoring']
            }
        else:
            return {
                'level': 'LOW', 
                'insights': 'Unknown event type - review manually', 
                'recommendations': ['Review log message', 'Classify manually', 'Update detection rules']
            }
            
    def send_alert(self, event):
        """Send high-priority alert"""
        print(f"\n🚨🚨🚨 CRITICAL ALERT 🚨🚨🚨")
        print(f"⏰ Time: {event['timestamp']}")
        print(f"📡 Source: {event['source_ip']}")
        print(f"📝 Message: {event['message']}")
        print(f"🔍 Level: {event['threat_level']}")
        print(f"🤖 AI Analysis: {event['insights']}")
        print(f"💡 Actions: {', '.join(event['recommendations'])}")
        print("🚨🚨🚨 END ALERT 🚨🚨🚨\n")
        
    def monitor_events(self):
        """Monitor and display event statistics"""
        while self.running:
            time.sleep(30)  # Update every 30 seconds
            if self.security_events:
                print(f"\n📊 Statistics: {len(self.security_events)} events processed")
                
                # Count threat levels
                levels = {}
                for event in self.security_events:
                    level = event['threat_level']
                    levels[level] = levels.get(level, 0) + 1
                
                for level, count in levels.items():
                    print(f"   {level}: {count}")
                print("-" * 40)
                
    def get_status(self):
        """Get current server status"""
        return {
            'running': self.running,
            'host': self.host,
            'port': self.port,
            'ai_enabled': self.ai_enabled,
            'total_events': len(self.security_events),
            'recent_events': self.security_events[-10:] if self.security_events else []
        }

def main():
    """Main function"""
    print("🔍 Cisco Switch Syslog Server with AI Threat Detection")
    print("=" * 60)
    
    # Create and start server
    server = SwitchSyslogServer()
    
    try:
        server.start()
    except KeyboardInterrupt:
        print("\n⏹️ Shutting down...")
        server.stop()

if __name__ == "__main__":
    main() 