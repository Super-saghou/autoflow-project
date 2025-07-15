import time
import json
import os
import sys
import argparse
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
            )
        ]
    
    def setup_agent(self):
        """Initialize the AI agent"""
        self.agent = initialize_agent(
            tools=self.tools,
            llm=self.llm,
            agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
            verbose=True,
            handle_parsing_errors=True
        )
    
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
            
            Consider:
            1. Frequency of failed login attempts
            2. Patterns in usernames being targeted
            3. Geographic patterns in IP addresses
            4. Timing patterns (bursts vs. distributed)
            5. Whether this looks like automated attacks vs. manual attempts
            
            Provide a threat assessment with:
            - Threat level (Low/Medium/High/Critical)
            - Reasoning for the assessment
            - Recommended actions
            - Confidence level in your assessment
            """
        )
        
        chain = LLMChain(llm=self.llm, prompt=prompt)
        return chain.invoke({"log_data": log_data})
    
    def block_user(self, username):
        """Block a user account"""
        blocked = self.load_blocked()
        if username not in blocked['users']:
            blocked['users'].append(username)
            self.save_blocked(blocked)
            self.log_action(f"AI Agent blocked user: {username}")
            return f"Successfully blocked user: {username}"
        return f"User {username} is already blocked"
    
    def block_ip(self, ip_address):
        """Block an IP address"""
        blocked = self.load_blocked()
        if ip_address not in blocked['ips']:
            blocked['ips'].append(ip_address)
            self.save_blocked(blocked)
            self.log_action(f"AI Agent blocked IP: {ip_address}")
            return f"Successfully blocked IP: {ip_address}"
        return f"IP {ip_address} is already blocked"
    
    def load_blocked(self):
        """Load blocked users and IPs"""
        if os.path.exists(BLOCKED_FILE):
            with open(BLOCKED_FILE, 'r') as f:
                return json.load(f)
        return {'users': [], 'ips': []}
    
    def save_blocked(self, blocked):
        """Save blocked users and IPs"""
        with open(BLOCKED_FILE, 'w') as f:
            json.dump(blocked, f, indent=2)
    
    def log_action(self, action):
        """Log agent actions"""
        with open(AGENT_LOG, 'a') as f:
            f.write(f"{datetime.now().isoformat()} {action}\n")
    
    def get_failed_attempts(self):
        """Get failed login attempts in the last time window"""
        now = datetime.now()
        window_start = now - timedelta(minutes=TIME_WINDOW_MINUTES)
        failed_users = {}
        failed_ips = {}
        
        if not os.path.exists(AUDIT_LOG):
            return failed_users, failed_ips
        
        with open(AUDIT_LOG, 'r') as f:
            for line in f:
                if 'Failed login' in line:
                    try:
                        parts = line.strip().split()
                        timestamp = parts[0]
                        dt = datetime.fromisoformat(timestamp)
                        if dt < window_start:
                            continue
                        
                        user = None
                        ip = None
                        
                        for i, part in enumerate(parts):
                            if part == "user" and i + 1 < len(parts):
                                user = parts[i + 1].strip("'\"")
                            elif part == "from" and i + 1 < len(parts):
                                ip = parts[i + 1]
                        
                        if user:
                            failed_users[user] = failed_users.get(user, 0) + 1
                        if ip:
                            failed_ips[ip] = failed_ips.get(ip, 0) + 1
                            
                    except Exception as e:
                        continue
        
        return failed_users, failed_ips
    
    def ai_security_analysis(self):
        """Perform AI-powered security analysis"""
        try:
            # Get recent log data
            log_data = self.read_security_logs()
            
            # Get failed attempts
            failed_users, failed_ips = self.get_failed_attempts()
            
            if AI_ENABLED and self.llm:
                # Create analysis prompt
                analysis_prompt = f"""
                Security Analysis Request:
                
                Recent Log Data:
                {log_data}
                
                Failed Login Summary (Last {TIME_WINDOW_MINUTES} minutes):
                Users with failed attempts: {failed_users}
                IPs with failed attempts: {failed_ips}
                
                Please analyze this security data and determine:
                1. Is there a security threat present?
                2. What is the threat level (Low/Medium/High/Critical)?
                3. Should any users or IPs be blocked?
                4. What additional monitoring should be implemented?
                
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
        
        while True:
            try:
                print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Running AI security analysis...")
                self.ai_security_analysis()
                time.sleep(60)  # Run every minute
            except KeyboardInterrupt:
                print("\n[AI Security Agent] Shutting down...")
                break
            except Exception as e:
                print(f"[AI Security Agent] Error: {e}")
                time.sleep(60)

    def manual_analysis(self):
        """Run a single manual analysis"""
        print("[AI Security Agent] Running manual analysis...")
        try:
            self.ai_security_analysis()
            print("[AI Security Agent] Manual analysis completed successfully!")
            return True
        except Exception as e:
            print(f"[AI Security Agent] Manual analysis failed: {e}")
            return False

def main():
    """Main function with command line argument support"""
    parser = argparse.ArgumentParser(description='AI Security Agent')
    parser.add_argument('--manual-analysis', action='store_true', 
                       help='Run a single manual analysis and exit')
    
    args = parser.parse_args()
    
    agent = AISecurityAgent()
    
    if args.manual_analysis:
        # Run single analysis for manual trigger
        success = agent.manual_analysis()
        sys.exit(0 if success else 1)
    else:
        # Run continuous monitoring loop
        agent.run()

if __name__ == '__main__':
    main() 