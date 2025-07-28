import sys
import json
import warnings
import paramiko

# Suppress deprecation warnings
warnings.filterwarnings("ignore", category=DeprecationWarning, module="cryptography")
warnings.filterwarnings("ignore", category=DeprecationWarning, module="paramiko")

# Usage: python3 run_mac_table.py <ip> <username> <password>
def get_mac_table(ip, username, password):
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(ip, username=username, password=password, look_for_keys=False, allow_agent=False, timeout=10)
        stdin, stdout, stderr = client.exec_command('show mac-address-table')
        output = stdout.read().decode(errors='ignore')
        client.close()

        lines = output.splitlines()
        mac_table = []
        for line in lines:
            # Skip header and separator lines
            if 'Destination Address' in line or '----' in line or not line.strip():
                continue
            parts = line.split()
            if len(parts) >= 4:
                mac, type_, vlan, port = parts[:4]
                # Try to convert vlan to int, fallback to string if not possible
                try:
                    vlan_val = int(vlan)
                except Exception:
                    vlan_val = vlan
                mac_table.append({
                    "mac": mac,
                    "type": type_,
                    "vlan": vlan_val,
                    "port": port
                })
        return mac_table
    except Exception as e:
        # Print error to stderr for debugging, but output empty array for frontend
        print(f"Error: {e}", file=sys.stderr)
        return []

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(json.dumps([]))
        sys.exit(0)
    ip = sys.argv[1]
    username = sys.argv[2]
    password = sys.argv[3]
    table = get_mac_table(ip, username, password)
    print(json.dumps(table)) 