# AutoFlow Ansible Playbook Generation System

This system automatically generates and executes Ansible playbooks based on user inputs from the web application. It provides a seamless integration between your frontend interface and network device configuration.

## Overview

The system consists of two main components:

1. **Python Playbook Generator** (`playbook_generator.py`) - Generates Ansible playbooks dynamically
2. **Flask API** (`playbook_api.py`) - REST API for playbook generation and execution
3. **Enhanced Node.js Server** (`server.js`) - Integrates with the Python API

## Features

### Supported Network Configurations

- **VLAN Management**: Create VLANs and configure interfaces
- **SSH Configuration**: Enable/disable SSH, configure ports and allowed IPs
- **Port Security**: Configure port security settings per interface
- **DHCP Snooping**: Enable/disable DHCP snooping and manage trusted ports
- **Routing**: Configure static routes and dynamic routing
- **NAT**: Configure Network Address Translation rules
- **DHCP**: Configure DHCP pools and settings
- **Spanning Tree Protocol (STP)**: Configure STP modes and port settings
- **EtherChannel**: Configure link aggregation groups
- **Hostname & Management IP**: Set device hostname and management IP

## Installation

### Prerequisites

- Python 3.7+
- Node.js 14+
- Ansible 2.9+
- Network devices (Cisco IOS, etc.)

### Setup

1. **Install Python dependencies:**
   ```bash
   pip3 install -r requirements.txt
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Create the Ansible directory:**
   ```bash
   mkdir -p /home/sarra/ansible/generated_playbooks
   ```

## Usage

### Starting the Services

Use the provided startup script to run both services:

```bash
./start_services.sh
```

This will start:
- Python API on port 5001
- Node.js server on port 5000

## API Endpoints

### Node.js API (Port 5000)

#### VLAN Configuration
```http
POST /api/create-vlan
Content-Type: application/json

{
  "vlanId": "10",
  "vlanName": "Management",
  "switchIp": "192.168.1.1"
}
```

#### SSH Configuration
```http
POST /api/configure-ssh
Content-Type: application/json

{
  "switchIp": "192.168.1.1",
  "sshEnabled": true,
  "sshPort": 22,
  "allowedIps": ["192.168.1.100", "192.168.1.101"]
}
```

## Frontend Integration

The frontend can now call these API endpoints when users fill out configuration forms. For example:

### VLAN Creation Example

```javascript
// When user submits VLAN creation form
const createVlan = async (vlanData) => {
  try {
    const response = await fetch('/api/create-vlan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vlanId: vlanData.id,
        vlanName: vlanData.name,
        switchIp: vlanData.switchIp
      })
    });
    
    const result = await response.json();
    
    if (result.message) {
      // Show success message
      showNotification('VLAN created successfully!', 'success');
    } else {
      // Show error message
      showNotification('Failed to create VLAN', 'error');
    }
  } catch (error) {
    console.error('Error creating VLAN:', error);
    showNotification('Network error occurred', 'error');
  }
};
```

## Generated Playbooks

Playbooks are automatically generated and saved to `/home/sarra/ansible/generated_playbooks/` with timestamps. Each playbook includes:

- Proper Ansible syntax and structure
- Network device-specific configurations
- Error handling and validation
- Inventory file generation

## Troubleshooting

### Common Issues

1. **Python API not starting:**
   - Check if port 5001 is available
   - Verify Python dependencies are installed
   - Check logs for specific error messages

2. **Playbook execution fails:**
   - Verify network connectivity to target devices
   - Check device credentials
   - Ensure Ansible is properly configured

### Testing

Test the system with:

```bash
# Test Python API
curl -X POST http://localhost:5001/api/health

# Test Node.js server
curl -X GET http://localhost:5000/api/test

# Test VLAN creation
curl -X POST http://localhost:5000/api/create-vlan \
  -H "Content-Type: application/json" \
  -d '{"vlanId":"10","vlanName":"Test","switchIp":"192.168.1.1"}'
```
