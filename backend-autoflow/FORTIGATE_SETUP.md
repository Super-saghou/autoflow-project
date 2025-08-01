# 🔥 FortiGate Integration Guide for AutoFlow Platform

## 📋 **Table of Contents**
1. [Overview](#overview)
2. [FortiGate Benefits](#fortigate-benefits)
3. [Installation Steps](#installation-steps)
4. [Configuration](#configuration)
5. [GNS3 Integration](#gns3-integration)
6. [API Setup](#api-setup)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

## 🎯 **Overview**

This guide explains how to integrate FortiGate firewall with your AutoFlow platform, replacing the "Audit Logs" section with a comprehensive "Firewalling" management interface.

### **What's New:**
- ✅ **Firewalling Page**: Complete firewall management interface
- ✅ **FortiGate Integration**: Direct API communication with FortiGate
- ✅ **Rule Management**: Create, edit, delete firewall rules
- ✅ **VPN Management**: Monitor and manage VPN connections
- ✅ **Security Profiles**: Manage antivirus and web filtering profiles
- ✅ **Real-time Status**: Live connection status and monitoring

## 🚀 **FortiGate Benefits**

### **Why FortiGate?**
1. **Enterprise-Grade Security**: Industry-leading firewall technology
2. **Ansible Integration**: Native Ansible modules available
3. **REST API**: Full programmatic access
4. **GNS3 Compatible**: Perfect for lab environments
5. **Free VM Version**: Available for educational/personal use

### **Cost Analysis:**
- **FortiGate VM**: ✅ **FREE** for personal/educational use
- **FortiGate Cloud**: ✅ **FREE** tier available
- **Licenses**: 💰 Paid for advanced features (IPS, antivirus, etc.)

## 📦 **Installation Steps**

### **Step 1: Install Python Dependencies**
```bash
# Install required Python packages
pip install requests urllib3

# Or add to requirements.txt
echo "requests>=2.25.1" >> requirements.txt
echo "urllib3>=1.26.0" >> requirements.txt
```

### **Step 2: Download FortiGate VM**
```bash
# Option 1: FortiGate VM (Free)
# Visit: https://www.fortinet.com/support/product-downloads
# Download: FortiGate VM for VMware/Hyper-V

# Option 2: FortiGate Cloud (Free tier)
# Visit: https://fortigatecloud.com/
# Sign up for free account
```

### **Step 3: Deploy FortiGate in GNS3**
```bash
# 1. Download FortiGate VM image
# 2. Import into GNS3
# 3. Configure network interfaces
# 4. Set initial IP address (usually 192.168.1.99)
```

## ⚙️ **Configuration**

### **Step 1: Initial FortiGate Setup**
```bash
# Connect to FortiGate console
# Default credentials: admin / (empty password)

# Set hostname
config system global
    set hostname "AutoFlow-FortiGate"
end

# Configure management interface
config system interface
    edit "port1"
        set mode static
        set ip 192.168.1.99 255.255.255.0
        set allowaccess ping https ssh
    next
end

# Enable REST API
config system api-user
    edit "autoflow-api"
        set api-key "your-api-key-here"
        set accprofile "super_admin"
        set vdom "root"
    next
end
```

### **Step 2: API Token Generation**
```bash
# In FortiGate CLI
config system api-user
    edit "autoflow-api"
        set api-key "generate-new-key"
        set accprofile "super_admin"
        set vdom "root"
        set comments "AutoFlow Platform API User"
    next
end

# Save the generated API key for later use
```

### **Step 3: Network Configuration**
```bash
# Configure interfaces for your network
config system interface
    edit "port1"  # Management
        set mode static
        set ip 192.168.1.99 255.255.255.0
        set allowaccess ping https ssh
    next
    edit "port2"  # LAN
        set mode static
        set ip 192.168.10.1 255.255.255.0
    next
    edit "port3"  # WAN
        set mode dhcp
    next
end
```

## 🌐 **GNS3 Integration**

### **Step 1: GNS3 Topology Setup**
```
[Internet] -- [FortiGate WAN] -- [FortiGate LAN] -- [AutoFlow Platform]
                                    |
                              [GNS3 Network]
```

### **Step 2: Network Configuration**
```bash
# In GNS3, connect FortiGate interfaces:
# - port1 (management): 192.168.1.99
# - port2 (LAN): 192.168.10.1
# - port3 (WAN): DHCP from GNS3

# Configure routing
config router static
    edit 1
        set dst 0.0.0.0 0.0.0.0
        set gateway 192.168.1.1
        set device "port3"
    next
end
```

### **Step 3: Firewall Rules for AutoFlow**
```bash
# Allow AutoFlow platform access
config firewall policy
    edit 1
        set name "AutoFlow-Platform"
        set srcintf "port2"
        set dstintf "port1"
        set srcaddr "192.168.10.0/24"
        set dstaddr "192.168.1.99"
        set service "HTTPS"
        set action accept
        set status enable
    next
end
```

## 🔌 **API Setup**

### **Step 1: Test API Connection**
```bash
# Test from your AutoFlow server
curl -k -H "Authorization: Bearer YOUR_API_KEY" \
     https://192.168.1.99:443/api/v2/monitor/system/status
```

### **Step 2: Configure AutoFlow Platform**
```bash
# In your AutoFlow platform, set FortiGate configuration:
Host: 192.168.1.99
Port: 443
Username: admin
API Token: YOUR_API_KEY
```

### **Step 3: Verify Integration**
```bash
# Check if FortiGate API is accessible
python3 fortigate_api.py status
```

## 🧪 **Testing**

### **Step 1: Test Connection**
```bash
# Test FortiGate connection
python3 fortigate_cli.py status

# Expected output:
# {"status": "connected", "message": "FortiGate is connected"}
```

### **Step 2: Test Firewall Rules**
```bash
# Get existing firewall rules
python3 fortigate_cli.py get-rules

# Create a test rule
python3 fortigate_cli.py create-rule --rule-data '{
  "name": "Test-Rule",
  "source": "192.168.10.0/24",
  "destination": "any",
  "service": "HTTP",
  "action": "accept"
}'
```

### **Step 3: Test VPN Connections**
```bash
# Get VPN connections
python3 fortigate_cli.py get-vpn

# Expected output:
# {"status": "success", "connections": [...]}
```

## 🔧 **Troubleshooting**

### **Common Issues:**

#### **1. Connection Failed**
```bash
# Check network connectivity
ping 192.168.1.99

# Check HTTPS access
curl -k https://192.168.1.99:443

# Verify API token
curl -k -H "Authorization: Bearer YOUR_TOKEN" \
     https://192.168.1.99:443/api/v2/monitor/system/status
```

#### **2. SSL Certificate Issues**
```bash
# FortiGate uses self-signed certificates by default
# The API client is configured to ignore SSL verification
# If you have issues, check the certificate configuration
```

#### **3. API Permission Issues**
```bash
# Verify API user permissions
config system api-user
    show
end

# Ensure user has 'super_admin' profile
```

#### **4. Network Routing Issues**
```bash
# Check routing table
get router info routing-table all

# Verify interface configuration
get system interface
```

### **Debug Commands:**
```bash
# Enable debug logging
config system api-user
    edit "autoflow-api"
        set api-key "your-key"
        set accprofile "super_admin"
        set vdom "root"
        set comments "AutoFlow Platform API User"
        set trusthost "192.168.10.0/24"
    next
end

# Check API logs
get log api
```

## 📚 **Additional Resources**

### **FortiGate Documentation:**
- [FortiGate REST API Reference](https://docs.fortinet.com/document/fortigate/7.0.0/rest-api)
- [FortiGate VM Installation](https://docs.fortinet.com/document/fortigate/7.0.0/vm-installation)
- [FortiGate Ansible Modules](https://docs.ansible.com/ansible/latest/collections/fortinet/fortios/)

### **GNS3 Resources:**
- [GNS3 FortiGate Setup](https://gns3.com/marketplace/appliances/fortinet-fortigate)
- [GNS3 Network Configuration](https://docs.gns3.com/docs/)

### **AutoFlow Integration:**
- [API Documentation](./API.md)
- [Frontend Components](./frontend-autoflow/src/Pages/FirewallingPage.js)
- [Backend API](./fortigate_api.py)

## 🎉 **Success Criteria**

Your FortiGate integration is successful when:

1. ✅ **Connection**: AutoFlow can connect to FortiGate
2. ✅ **Rules**: Can create/delete firewall rules
3. ✅ **VPN**: Can monitor VPN connections
4. ✅ **Profiles**: Can manage security profiles
5. ✅ **UI**: Firewalling page displays correctly
6. ✅ **GNS3**: FortiGate runs in GNS3 environment

## 🚀 **Next Steps**

After successful integration:

1. **Create Default Rules**: Set up basic security policies
2. **Configure VPN**: Set up site-to-site VPN connections
3. **Security Profiles**: Configure antivirus and web filtering
4. **Monitoring**: Set up alerts and logging
5. **Automation**: Create Ansible playbooks for automation

---

**🎯 Ready to enhance your AutoFlow platform with enterprise-grade firewall management!** 