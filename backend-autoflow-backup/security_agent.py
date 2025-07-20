import time
import json
import os
from datetime import datetime, timedelta

AUDIT_LOG = 'audit.log'
BLOCKED_FILE = 'blocked.json'
AGENT_LOG = 'security_agent.log'
FAILED_THRESHOLD = 5
TIME_WINDOW_MINUTES = 10

# Helper to load blocked users/IPs
def load_blocked():
    if os.path.exists(BLOCKED_FILE):
        with open(BLOCKED_FILE, 'r') as f:
            return json.load(f)
    return {'users': [], 'ips': []}

# Helper to save blocked users/IPs
def save_blocked(blocked):
    with open(BLOCKED_FILE, 'w') as f:
        json.dump(blocked, f, indent=2)

# Helper to log agent actions
def log_action(action):
    with open(AGENT_LOG, 'a') as f:
        f.write(f"{datetime.now().isoformat()} {action}\n")

# Parse audit.log for failed logins in the last TIME_WINDOW_MINUTES
def get_failed_attempts():
    now = datetime.now()
    window_start = now - timedelta(minutes=TIME_WINDOW_MINUTES)
    failed_users = {}
    failed_ips = {}
    if not os.path.exists(AUDIT_LOG):
        return failed_users, failed_ips
    with open(AUDIT_LOG, 'r') as f:
        for line in f:
            # Example log format: 2024-07-06T12:34:56 Failed login for user 'bob' from 1.2.3.4
            if 'Failed login' in line:
                try:
                    parts = line.strip().split()
                    timestamp = parts[0]
                    dt = datetime.fromisoformat(timestamp)
                    if dt < window_start:
                        continue
                    
                    # Find user and IP using more robust parsing
                    user = None
                    ip = None
                    
                    for i, part in enumerate(parts):
                        if part == "user" and i + 1 < len(parts):
                            # Extract username, removing quotes
                            user = parts[i + 1].strip("'\"")
                        elif part == "from" and i + 1 < len(parts):
                            ip = parts[i + 1]
                    
                    if user:
                        failed_users[user] = failed_users.get(user, 0) + 1
                    if ip:
                        failed_ips[ip] = failed_ips.get(ip, 0) + 1
                        
                except Exception as e:
                    print(f"Error parsing line: {line.strip()}, Error: {e}")
                    continue
    return failed_users, failed_ips

def main():
    print("[SecurityAgent] Starting agent loop...")
    while True:
        blocked = load_blocked()
        failed_users, failed_ips = get_failed_attempts()
        # Block users
        for user, count in failed_users.items():
            if count >= FAILED_THRESHOLD and user not in blocked['users']:
                blocked['users'].append(user)
                log_action(f"Blocked user: {user} after {count} failed attempts.")
                print(f"[SecurityAgent] Blocked user: {user}")
        # Block IPs
        for ip, count in failed_ips.items():
            if count >= FAILED_THRESHOLD and ip not in blocked['ips']:
                blocked['ips'].append(ip)
                log_action(f"Blocked IP: {ip} after {count} failed attempts.")
                print(f"[SecurityAgent] Blocked IP: {ip}")
        save_blocked(blocked)
        time.sleep(60)  # Run every minute

if __name__ == '__main__':
    main() 