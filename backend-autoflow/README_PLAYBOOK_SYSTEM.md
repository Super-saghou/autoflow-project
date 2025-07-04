# AutoFlow Network Management Platform - Ansible Integration

This document describes the complete Ansible playbook integration system for the AutoFlow Network Management Platform.

## System Architecture

```
Frontend (React) → Node.js Server (Port 5000) → Python Flask API (Port 5001) → Ansible Playbooks → Network Devices
```

## Prerequisites

### 1. Install Ansible and Network Modules
```bash
# Install Ansible
pip3 install ansible

# Install network modules
pip3 install ansible[network]

# Install additional dependencies
pip3 install netmiko paramiko
```

### 2. Install Python Dependencies
```bash
pip3 install -r requirements.txt
```

### 3. Install Node.js Dependencies
```bash
npm install
```

## Quick Start

### 1. Test Connection to Your GNS3 Switch
```bash
# Test connectivity to your switch
python3 test_connection.py 192.168.111.198
```

### 2. Start All Services
```bash
# Make the startup script executable
chmod +x start_services.sh

# Start all services
./start_services.sh
```

### 3. Verify Services
```bash
# Check Flask API health
curl http://localhost:5001/api/health

# Check Node.js server
curl http://localhost:5000/api/test
```

## Supported Configuration Types

### 1. VLAN Configuration
Creates VLANs and optionally assigns interfaces to them.

**Frontend API Call:**
```javascript
const response = await fetch('http://localhost:5000/api/create-vlan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    vlanId: 10,
    vlanName: 'Engineering',
    switchIp: '192.168.111.198',
    interfaces: ['Fa1/0', 'Fa1/1'] // Optional
  })
});
```

**Direct API Call:**
```bash
curl -X POST http://localhost:5001/api/generate-and-execute \
  -H "Content-Type: application/json" \
  -d '{
    "action": "vlan",
    "target_ip": "192.168.111.198",
    "vlan_id": 10,
    "vlan_name": "Engineering",
    "interfaces": ["Fa1/0", "Fa1/1"]
  }'
```

### 2. SSH Configuration
Configures SSH access with custom port and allowed IPs.

**Frontend API Call:**
```javascript
const response = await fetch('http://localhost:5000/api/configure-ssh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    switchIp: '192.168.111.198',
    sshEnabled: true,
    sshPort: 22,
    allowedIps: ['192.168.1.0/24']
  })
});
```

### 3. DHCP Configuration
Configures DHCP pools for IP address assignment.

**Frontend API Call:**
```javascript
const response = await fetch('http://localhost:5000/api/configure-dhcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    switchIp: '192.168.111.198',
    enabled: true,
    dhcpPools: [{
      name: 'LAN_Pool',
      network: '192.168.1.0',
      subnet: '255.255.255.0',
      default_router: '192.168.1.1',
      dns_server: '8.8.8.8'
    }]
  })
});
```

### 4. NAT Configuration
Configures Network Address Translation rules.

**Frontend API Call:**
```javascript
const response = await fetch('http://localhost:5000/api/configure-nat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    switchIp: '192.168.111.198',
    enabled: true,
    natRules: [{
      name: 'Internet_Access',
      acl: '1',
      outside_interface: 'GigabitEthernet0/0'
    }]
  })
});
```

### 5. STP Configuration
Configures Spanning Tree Protocol settings.

**Frontend API Call:**
```javascript
const response = await fetch('http://localhost:5000/api/configure-stp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    switchIp: '192.168.111.198',
    enabled: true,
    mode: 'pvst',
    portConfigs: [{
      interface: 'Fa1/0',
      portfast: 'enable',
      cost: 100
    }]
  })
});
```

### 6. EtherChannel Configuration
Configures link aggregation groups.

**Frontend API Call:**
```javascript
const response = await fetch('http://localhost:5000/api/configure-etherchannel', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    switchIp: '192.168.111.198',
    enabled: true,
    groups: [{
      group_id: 1,
      protocol: 'lacp',
      mode: 'active',
      interfaces: ['Fa1/0', 'Fa1/1']
    }]
  })
});
```

### 7. Routing Configuration
Configures static routes and dynamic routing.

**Frontend API Call:**
```javascript
const response = await fetch('http://localhost:5000/api/configure-routing', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    switchIp: '192.168.111.198',
    staticRoutes: [{
      network: '192.168.2.0',
      subnet: '255.255.255.0',
      next_hop: '192.168.1.254'
    }],
    dynamicRouting: true
  })
});
```

### 8. Port Security Configuration
Configures port security settings.

**Frontend API Call:**
```javascript
const response = await fetch('http://localhost:5000/api/configure-port-security', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    switchIp: '192.168.111.198',
    portConfigs: [{
      interface: 'Fa1/0',
      max_mac: 1,
      violation: 'shutdown'
    }]
  })
});
```

### 9. DHCP Snooping Configuration
Configures DHCP snooping for security.

**Frontend API Call:**
```javascript
const response = await fetch('http://localhost:5000/api/configure-dhcp-snooping', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    switchIp: '192.168.111.198',
    enabled: true,
    trustedPorts: ['Fa1/24']
  })
});
```

### 10. Hostname Configuration
Configures device hostname and management IP.

**Frontend API Call:**
```javascript
const response = await fetch('http://localhost:5000/api/configure-hostname', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    switchIp: '192.168.111.198',
    hostname: 'SW-CORE-01',
    managementIp: '192.168.111.198'
  })
});
```

## Testing Examples

### Test VLAN Creation
```bash
# Create VLAN 10 for Engineering
curl -X POST http://localhost:5001/api/generate-and-execute \
  -H "Content-Type: application/json" \
  -d '{
    "action": "vlan",
    "target_ip": "192.168.111.198",
    "vlan_id": 10,
    "vlan_name": "Engineering"
  }'
```

### Test SSH Configuration
```bash
# Configure SSH with custom port
curl -X POST http://localhost:5001/api/generate-and-execute \
  -H "Content-Type: application/json" \
  -d '{
    "action": "ssh",
    "target_ip": "192.168.111.198",
    "ssh_enabled": true,
    "ssh_port": 22
  }'
```

### Test DHCP Configuration
```bash
# Configure DHCP pool
curl -X POST http://localhost:5001/api/generate-and-execute \
  -H "Content-Type: application/json" \
  -d '{
    "action": "dhcp",
    "target_ip": "192.168.111.198",
    "enabled": true,
    "dhcp_pools": [{
      "name": "LAN_Pool",
      "network": "192.168.1.0",
      "subnet": "255.255.255.0",
      "default_router": "192.168.1.1",
      "dns_server": "8.8.8.8"
    }]
  }'
```

## File Structure

```
backend-autoflow/
├── server.js                 # Node.js backend server
├── playbook_api.py           # Python Flask API
├── playbook_generator.py     # Ansible playbook generator
├── test_connection.py        # Connection test script
├── start_services.sh         # Service startup script
├── inventory.ini             # Ansible inventory file
├── requirements.txt          # Python dependencies
├── package.json              # Node.js dependencies
└── generated_playbooks/      # Generated playbook files
```

## Troubleshooting

### 1. Connection Issues
```bash
# Test basic connectivity
ping 192.168.111.198

# Test SSH connection
ssh cisco@192.168.111.198

# Run comprehensive test
python3 test_connection.py 192.168.111.198
```

### 2. Ansible Issues
```bash
# Check Ansible installation
ansible --version

# Test Ansible connectivity
ansible targets -i inventory.ini -m ping

# Check generated playbooks
ls -la /home/sarra/ansible/generated_playbooks/
```

### 3. API Issues
```bash
# Check Flask API health
curl http://localhost:5001/api/health

# Check Node.js server
curl http://localhost:5000/api/test

# Check service logs
ps aux | grep python3
ps aux | grep node
```

### 4. Common Error Solutions

**SSH Connection Refused:**
- Verify SSH is enabled on the device
- Check username/password (cisco/cisco)
- Verify network connectivity

**Ansible Module Not Found:**
```bash
pip3 install ansible[network]
pip3 install netmiko paramiko
```

**Permission Denied:**
```bash
chmod +x start_services.sh
chmod 755 /home/sarra/ansible/generated_playbooks/
```

## Security Considerations

1. **Credentials**: Default credentials (cisco/cisco) should be changed in production
2. **Network Access**: Ensure proper firewall rules for management access
3. **SSH Keys**: Consider using SSH keys instead of passwords
4. **Inventory Security**: Keep inventory files secure and restrict access

## Production Deployment

1. **Environment Variables**: Use environment variables for sensitive data
2. **SSL/TLS**: Enable HTTPS for API endpoints
3. **Authentication**: Implement proper authentication for API access
4. **Logging**: Configure comprehensive logging for audit trails
5. **Backup**: Regular backup of configuration and generated playbooks

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review generated playbook files for syntax errors
3. Check Ansible logs for detailed error messages
4. Verify device compatibility with Cisco IOS modules
 