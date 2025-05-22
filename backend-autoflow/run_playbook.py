import sys
import subprocess

# Get the IP address from command-line arguments
ip = sys.argv[1]

# Replace these with your real SSH username and password
ssh_user = "your_ssh_user"
ssh_pass = "your_ssh_password"

# Write dynamic inventory file
with open('inventory.ini', 'w') as f:
    f.write(f"[targets]\n{ip} ansible_user={ssh_user} ansible_ssh_pass={ssh_pass}\n")

# Run the playbook
result = subprocess.run(
    ['ansible-playbook', '-i', 'inventory.ini', 'playbook.yml'],
    capture_output=True,
    text=True
)

# Print output for debugging
print(result.stdout)
print(result.stderr)

