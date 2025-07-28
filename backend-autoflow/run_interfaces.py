import subprocess
import json
import sys

def run_ansible_playbook(playbook_path, inventory_content):
    try:
        # Write inventory content to a temp file
        with open("temp_inventory.yml", "w") as f:
            f.write(inventory_content)
        print(f"Created temporary inventory: {inventory_content}", file=sys.stderr)
        # Use the password provided
        password = "sarra"  # Match your SSH password
        print(f"Executing ansible-playbook {playbook_path} with inventory temp_inventory.yml", file=sys.stderr)
        result = subprocess.run(
            ['ansible-playbook', playbook_path, '-i', 'temp_inventory.yml', '--extra-vars', f'ansible_password={password}'],
            capture_output=True,
            text=True,
            check=True
        )
        print("Ansible stdout:", result.stdout, file=sys.stderr)
        print("Ansible stderr:", result.stderr, file=sys.stderr)
        # Parse debug output
        lines = result.stdout.splitlines()
        interfaces = []
        for line in lines:
            if '"msg":' in line:
                try:
                    start_idx = line.index('"msg":') + 6
                    end_idx = line.index('"', start_idx)
                    msg = line[start_idx:end_idx].strip()
                    if ' - Admin Up: ' in msg:
                        parts = msg.split(' - Admin Up: ')
                        if len(parts) == 2:
                            interface = parts[0].strip()
                            status = parts[1].strip()
                            interfaces.append([interface, status])
                            print(f"Parsed interface: {interface}, status: {status}", file=sys.stderr)
                except (ValueError, IndexError) as e:
                    print(f"Error parsing line: {line} - {e}", file=sys.stderr)
        return interfaces
    except subprocess.CalledProcessError as e:
        print("Ansible stdout:", e.stdout, file=sys.stderr)
        print("Ansible stderr:", e.stderr if e.stderr else "No error message captured", file=sys.stderr)
        return []
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        return []

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 run_interfaces.py <switch_ip>", file=sys.stderr)
        sys.exit(1)
    switch_ip = sys.argv[1]
    inventory_content = f"""
    all:
      hosts:
        switch1:
          ansible_host: {switch_ip}
          ansible_port: 22
          ansible_user: sarra
          ansible_connection: ansible.netcommon.network_cli
          ansible_network_os: cisco.ios.ios
    """
    playbook_path = "/app/get_interfaces.yml"  # Updated path for container
    print(f"Using playbook path: {playbook_path}", file=sys.stderr)
    interfaces = run_ansible_playbook(playbook_path, inventory_content)
    print(json.dumps(interfaces)) 