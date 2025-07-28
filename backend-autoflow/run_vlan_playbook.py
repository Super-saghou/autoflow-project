import subprocess
import os

PLAYBOOK_PATH = "playbook.yml"

# Write a simple VLAN creation playbook
playbook_content = '''
---
- name: Create VLAN 10 on switch1
  hosts: all
  gather_facts: no
  vars:
    ansible_network_os: ios
    ansible_connection: network_cli
    ansible_host: 192.168.111.198  # switch1 IP
    ansible_user: sarra
    ansible_password: sarra
    ansible_become: yes
    ansible_become_method: enable
    ansible_become_password: sarra
  tasks:
    - name: Ensure VLAN 10 exists
      ios_command:
        commands:
          - vlan database
          - vlan 10 name TestVLAN
          - exit
'''

def write_playbook():
    with open(PLAYBOOK_PATH, "w") as f:
        f.write(playbook_content)
    print(f"Wrote playbook to {PLAYBOOK_PATH}")

def run_playbook():
    print(f"Running: ansible-playbook {PLAYBOOK_PATH}\n")
    result = subprocess.run([
        'ansible-playbook', PLAYBOOK_PATH, '-v'
    ], capture_output=True, text=True)
    print("--- STDOUT ---\n" + result.stdout)
    print("--- STDERR ---\n" + result.stderr)
    if result.returncode == 0:
        print("\n✅ Playbook executed successfully.")
    else:
        print(f"\n❌ Playbook execution failed with return code {result.returncode}.")

if __name__ == "__main__":
    write_playbook()
    run_playbook() 