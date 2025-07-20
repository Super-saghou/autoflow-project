from netmiko import ConnectHandler

# Update these values if needed
switch_ip = '192.168.111.198'
username = 'sarra'
password = 'sarra'
enable_password = 'sarra'  # Set to '' if not needed

device = {
    'device_type': 'cisco_ios',
    'host': switch_ip,
    'username': username,
    'password': password,
    'secret': enable_password,
}

try:
    print(f"Connecting to {switch_ip} as {username}...")
    net_connect = ConnectHandler(**device)
    if enable_password:
        net_connect.enable()
    output = net_connect.send_command('show vlan-switch brief')
    print("\n--- VLAN Output ---\n")
    print(output)
except Exception as e:
    print("\nError:", e) 