#!/usr/bin/env python3
import sys
import json
import threading
import time
import warnings
from netmiko import ConnectHandler

# Suppress deprecation warnings
warnings.filterwarnings("ignore", category=DeprecationWarning, module="cryptography")
warnings.filterwarnings("ignore", category=DeprecationWarning, module="paramiko")

# Switch configuration with improved timeout settings
SWITCH_CONFIG = {
    'device_type': 'cisco_ios',
    'ip': '192.168.111.198',
    'username': 'sarra',
    'password': 'sarra',
    'read_timeout_override': 30,
    'fast_cli': False,
    'conn_timeout': 30,  # Connection timeout
    'auth_timeout': 30,  # Authentication timeout
    'banner_timeout': 30,  # Banner timeout
    'blocking_timeout': 30,  # Blocking timeout
    'timeout': 30,  # General timeout
    'global_delay_factor': 2,  # Increase delay factor for stability
}

def connect_with_retry(max_retries=3):
    """Connect to switch with retry logic"""
    for attempt in range(max_retries):
        try:
            print(f"Connection attempt {attempt + 1}/{max_retries}...", flush=True)
            net_connect = ConnectHandler(**SWITCH_CONFIG)
            return net_connect
        except Exception as e:
            print(f"Connection attempt {attempt + 1} failed: {e}", flush=True)
            if attempt == max_retries - 1:
                raise e
            time.sleep(2)  # Wait before retry

def clean_output(output):
    """Clean and format the output for better display"""
    if not output:
        return ""
    
    # Remove extra whitespace and normalize line endings
    lines = output.strip().split('\n')
    cleaned_lines = []
    
    for line in lines:
        line = line.strip()
        if line:  # Only add non-empty lines
            cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines)

def main():
    try:
        # Connect to switch with retry logic
        print("Connecting to switch...", flush=True)
        net_connect = connect_with_retry()
        print("Connected to switch successfully!", flush=True)
        
        # Get initial prompt
        prompt = net_connect.find_prompt()
        print(f"\n{prompt}", flush=True)
        
        # Read commands from stdin and send to switch
        while True:
            try:
                command = input().strip()
                if not command:
                    continue
                    
                # Send command to switch using timing-based method with increased timeout
                output = net_connect.send_command_timing(
                    command, 
                    strip_prompt=False,
                    read_timeout=30  # Increased read timeout
                )
                
                # Clean and format the output
                cleaned_output = clean_output(output)
                if cleaned_output:
                    print(f"\n{cleaned_output}", flush=True)
                
                # Get the new prompt after command execution
                try:
                    new_prompt = net_connect.find_prompt()
                    print(f"\n{new_prompt}", flush=True)
                except Exception as e:
                    print(f"\nError getting prompt: {e}", flush=True)
                    print(f"\n{prompt}", flush=True)
                
            except EOFError:
                break
            except Exception as e:
                print(f"\nError executing command: {e}", flush=True)
                # Try to get prompt even after error
                try:
                    prompt = net_connect.find_prompt()
                    print(f"\n{prompt}", flush=True)
                except:
                    pass
                
    except Exception as e:
        print(f"Failed to connect to switch: {e}", flush=True)
        sys.exit(1)
    finally:
        try:
            net_connect.disconnect()
        except:
            pass

if __name__ == "__main__":
    main() 