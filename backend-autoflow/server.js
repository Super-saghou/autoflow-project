import express from "express";
import { config } from "dotenv";
import path from "path";
import { connectDB } from './config/db.js';
import Device from './models/Device.js';
import User from './models/User.js';
import Role from './models/Role.js';
import { exec } from 'child_process';
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import fs from "fs";
import BackupService from './backup_service.js';
import MonitoringService from './monitoring_service.js';
import authRoutes from './routes/auth.js';
import { authenticateToken, requireRole, requirePermission } from './middleware/auth.js';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config();

// Get Flask API URL from environment variable, default to localhost:5001
const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5001';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://192.168.111.201:31508', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
});

app.use(cors({
  origin: ['http://192.168.111.201:31508', 'http://localhost:3000'],
  credentials: true,
}));

// Connect to MongoDB
connectDB();

// Initialize backup service
const backupService = new BackupService();

// Initialize monitoring service
const monitoringService = new MonitoringService();

// Middleware to parse JSON
app.use(express.json());

// Initialize roles on startup
async function initializeRoles() {
  try {
    await Role.initializeRoles();
    console.log('Roles initialized successfully');
  } catch (error) {
    console.error('Error initializing roles:', error);
  }
}

// Initialize roles
initializeRoles();

// Auth routes
app.use('/api/auth', authRoutes);

// Test route to verify server is running
app.get('/api/test', (req, res) => {
  console.log('Test route hit');
  res.json({ message: 'Server is running' });
});

// API to add a device and run playbook
app.post("/api/devices", authenticateToken, requirePermission('write_devices'), async (req, res) => {
  const { name, ip } = req.body;
  try {
    const device = new Device({ name, ip });
    await device.save();
    exec(`python3 /home/sarra/ansible/run_playbook.py ${ip}`, (error, stdout, stderr) => {
      if (error) {
        console.error("Playbook error:", error.message);
        return res.status(500).json({ message: "Playbook failed", error: error.message });
      }
      res.json({ message: "Device saved and playbook executed", output: stdout });
    });
  } catch (error) {
    console.error("Error saving device:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// API to fetch all devices
app.get("/api/devices", authenticateToken, requirePermission('read_devices'), async (req, res) => {
  try {
    const devices = await Device.find();
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: "Error fetching devices" });
  }
});

// Legacy login endpoint (for backward compatibility)
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check if user exists in new system
    const user = await User.findOne({ username });
    if (user) {
      // Use new authentication system
      const isPasswordValid = await user.comparePassword(password);
      if (isPasswordValid) {
        const { generateToken } = await import('./middleware/auth.js');
        const token = generateToken(user._id);
        
        const role = await Role.findOne({ name: user.role });
        const rolePermissions = role ? role.permissions : [];
        
        return res.json({
          message: "Login successful",
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            permissions: user.permissions,
            rolePermissions
          }
        });
      }
    }
    
    // Fallback to legacy authentication
    if (username === "sarra" && password === "sarra") {
      return res.json({ message: "Login successful" });
    } else {
      return res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// API for system health (Developer Dashboard)
app.get('/api/dev/health', authenticateToken, requireRole(['Admin', 'Developer']), async (req, res) => {
  const db = Device.db.db;
  const health = {
    serverUptime: process.uptime(),
    mongoStatus: await db.collection('devices').stats().then(() => 'Connected').catch(() => 'Disconnected'),
    kubernetesPods: 'N/A',
  };
  res.json(health);
});

// API to fetch topology edges (mocked for now)
app.get('/api/topology', async (req, res) => {
  try {
    const devices = await Device.find();
    const edges = devices.length > 1 ? [
      {
        data: {
          id: `${devices[0].name}-${devices[1].name}`,
          source: devices[0].name,
          target: devices[1].name,
        },
      },
    ] : [];
    res.json({ edges });
  } catch (error) {
    console.error("Error fetching topology:", error);
    res.status(500).json({ message: "Error fetching topology" });
  }
});

// API to fetch interfaces for a specific switch
app.get('/api/interfaces/:switchName', (req, res) => {
  const { switchName } = req.params;
  console.log(`Received request for /api/interfaces/${switchName} at ${new Date().toISOString()}`);
  console.log(`Current working directory: ${process.cwd()}`);

  let switchIp = switchName === 'Cisco 3725' ? '192.168.111.198' : 'localhost';
  console.log(`Executing command: python3 /home/sarra/ansible/run_interfaces.py ${switchIp}`);
  exec(`python3 /home/sarra/ansible/run_interfaces.py ${switchIp}`, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing run_interfaces.py: ${error.message}, Exit code: ${error.code}`);
      return res.status(500).json({ error: 'Failed to fetch interfaces', details: error.message });
    }
    console.log(`Raw stdout from script: ${stdout}`);
    try {
      let interfaces = [];
      if (stdout && stdout.trim()) {
        interfaces = JSON.parse(stdout);
      } else {
        console.warn('Empty or invalid stdout, using fallback');
        interfaces = [['Fa1/0', 'Down'], ['Fa1/1', 'Down'], ['Fa1/2', 'Down'], ['Fa1/3', 'Down'], ['Fa1/4', 'Down'], ['Fa1/5', 'Down'], ['Fa1/6', 'Down'], ['Fa1/7', 'Down'], ['Fa1/8', 'Down'], ['Fa1/9', 'Down'], ['Fa1/10', 'Down'], ['Fa1/11', 'Down'], ['Fa1/12', 'Down'], ['Fa1/13', 'Down'], ['Fa1/14', 'Down'], ['Fa1/15', 'Down']];
      }
      if (!Array.isArray(interfaces) || interfaces.length === 0) {
        console.warn(`No valid interfaces returned for ${switchName}, using fallback`);
        interfaces = [['Fa1/0', 'Down'], ['Fa1/1', 'Down'], ['Fa1/2', 'Down'], ['Fa1/3', 'Down'], ['Fa1/4', 'Down'], ['Fa1/5', 'Down'], ['Fa1/6', 'Down'], ['Fa1/7', 'Down'], ['Fa1/8', 'Down'], ['Fa1/9', 'Down'], ['Fa1/10', 'Down'], ['Fa1/11', 'Down'], ['Fa1/12', 'Down'], ['Fa1/13', 'Down'], ['Fa1/14', 'Down'], ['Fa1/15', 'Down']];
      }
      console.log(`Parsed interfaces for ${switchName}:`, interfaces);
      res.json(interfaces);
    } catch (parseError) {
      console.error(`Error parsing JSON: ${parseError.message}, Raw output: ${stdout}`);
      res.status(500).json({ error: 'Failed to parse interface data', details: stdout || 'No output' });
    }
  });
});

// API to create a VLAN
app.post('/api/create-vlan', authenticateToken, requirePermission('write_vlans'), async (req, res) => {
  const { vlanId, vlanName, switchIp } = req.body;
  if (!vlanId || !vlanName || !switchIp) {
    return res.status(400).json({ error: 'VLAN ID, VLAN Name, and Switch IP are required' });
  }
  if (!/^\d+$/.test(vlanId) || vlanId < 1 || vlanId > 4094) {
    return res.status(400).json({ error: 'Invalid VLAN ID' });
  }

  try {
    // Use the new playbook generation system
    const playbookData = {
      action: 'vlan',
      target_ip: switchIp,
      vlan_id: vlanId,
      vlan_name: vlanName,
      interfaces: [] // Can be extended to include specific interfaces
    };

    // Call the playbook generation API
    const generateResponse = await fetch(`${FLASK_API_URL}/api/generate-and-execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(playbookData)
    });

    const result = await generateResponse.json();
    
    if (result.success) {
      console.log("Playbook executed successfully:", result);
      res.json({ message: `VLAN ${vlanId} created successfully`, details: result });
    } else {
      console.error("Playbook execution failed:", result);
      res.status(500).json({ error: 'Failed to create VLAN', details: result });
    }
  } catch (err) {
    console.error('Execution error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// New API endpoint for SSH configuration
app.post('/api/configure-ssh', authenticateToken, requirePermission('configure_ssh'), async (req, res) => {
  const { switchIp, sshEnabled, sshPort, allowedIps } = req.body;
  
  if (!switchIp) {
    return res.status(400).json({ error: 'Switch IP is required' });
  }

  try {
    const playbookData = {
      action: 'ssh',
      target_ip: switchIp,
      ssh_enabled: sshEnabled !== undefined ? sshEnabled : true,
      ssh_port: sshPort || 22,
      allowed_ips: allowedIps || []
    };

    const generateResponse = await fetch(`${FLASK_API_URL}/api/generate-and-execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(playbookData)
    });

    const result = await generateResponse.json();
    
    if (result.success) {
      console.log("SSH configuration successful:", result);
      res.json({ message: 'SSH configuration applied successfully', details: result });
    } else {
      console.error("SSH configuration failed:", result);
      res.status(500).json({ error: 'Failed to configure SSH', details: result });
    }
  } catch (err) {
    console.error('SSH configuration error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// New API endpoint for port security configuration
app.post('/api/configure-port-security', authenticateToken, requirePermission('configure_security'), async (req, res) => {
  const { switchIp, portConfigs } = req.body;
  
  if (!switchIp || !portConfigs) {
    return res.status(400).json({ error: 'Switch IP and port configurations are required' });
  }

  try {
    const playbookData = {
      action: 'port_security',
      target_ip: switchIp,
      port_configs: portConfigs
    };

    const generateResponse = await fetch(`${FLASK_API_URL}/api/generate-and-execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(playbookData)
    });

    const result = await generateResponse.json();
    
    if (result.success) {
      console.log("Port security configuration successful:", result);
      res.json({ message: 'Port security configuration applied successfully', details: result });
    } else {
      console.error("Port security configuration failed:", result);
      res.status(500).json({ error: 'Failed to configure port security', details: result });
    }
  } catch (err) {
    console.error('Port security configuration error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// New API endpoint for DHCP snooping configuration
app.post('/api/configure-dhcp-snooping', authenticateToken, requirePermission('configure_security'), async (req, res) => {
  const { switchIp, enabled, trustedPorts } = req.body;
  
  if (!switchIp) {
    return res.status(400).json({ error: 'Switch IP is required' });
  }

  try {
    const playbookData = {
      action: 'dhcp_snooping',
      target_ip: switchIp,
      enabled: enabled !== undefined ? enabled : true,
      trusted_ports: trustedPorts || []
    };

    const generateResponse = await fetch(`${FLASK_API_URL}/api/generate-and-execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(playbookData)
    });

    const result = await generateResponse.json();
    
    if (result.success) {
      console.log("DHCP snooping configuration successful:", result);
      res.json({ message: 'DHCP snooping configuration applied successfully', details: result });
    } else {
      console.error("DHCP snooping configuration failed:", result);
      res.status(500).json({ error: 'Failed to configure DHCP snooping', details: result });
    }
  } catch (err) {
    console.error('DHCP snooping configuration error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// New API endpoint for hostname and management IP configuration
app.post('/api/configure-hostname', authenticateToken, requirePermission('write_devices'), async (req, res) => {
  const { switchIp, hostname, managementIp } = req.body;
  
  if (!switchIp || !hostname) {
    return res.status(400).json({ error: 'Switch IP and hostname are required' });
  }

  try {
    const playbookData = {
      action: 'hostname',
      target_ip: switchIp,
      hostname: hostname,
      management_ip: managementIp
    };

    const generateResponse = await fetch(`${FLASK_API_URL}/api/generate-and-execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(playbookData)
    });

    const result = await generateResponse.json();
    
    if (result.success) {
      console.log("Hostname configuration successful:", result);
      res.json({ message: 'Hostname and management IP configured successfully', details: result });
    } else {
      console.error("Hostname configuration failed:", result);
      res.status(500).json({ error: 'Failed to configure hostname', details: result });
    }
  } catch (err) {
    console.error('Hostname configuration error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// New API endpoint for routing configuration
app.post('/api/configure-routing', async (req, res) => {
  const { switchIp, staticRoutes, dynamicRouting } = req.body;
  
  if (!switchIp) {
    return res.status(400).json({ error: 'Switch IP is required' });
  }

  try {
    const playbookData = {
      action: 'routing',
      target_ip: switchIp,
      static_routes: staticRoutes || [],
      dynamic_routing: dynamicRouting || false
    };

    const generateResponse = await fetch(`${FLASK_API_URL}/api/generate-and-execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(playbookData)
    });

    const result = await generateResponse.json();
    
    if (result.success) {
      console.log("Routing configuration successful:", result);
      res.json({ message: 'Routing configuration applied successfully', details: result });
    } else {
      console.error("Routing configuration failed:", result);
      res.status(500).json({ error: 'Failed to configure routing', details: result });
    }
  } catch (err) {
    console.error('Routing configuration error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// New API endpoint for NAT configuration
app.post('/api/configure-nat', async (req, res) => {
  const { switchIp, natRules, enabled } = req.body;
  
  if (!switchIp) {
    return res.status(400).json({ error: 'Switch IP is required' });
  }

  try {
    const playbookData = {
      action: 'nat',
      target_ip: switchIp,
      nat_rules: natRules || [],
      enabled: enabled !== undefined ? enabled : true
    };

    const generateResponse = await fetch(`${FLASK_API_URL}/api/generate-and-execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(playbookData)
    });

    const result = await generateResponse.json();
    
    if (result.success) {
      console.log("NAT configuration successful:", result);
      res.json({ message: 'NAT configuration applied successfully', details: result });
    } else {
      console.error("NAT configuration failed:", result);
      res.status(500).json({ error: 'Failed to configure NAT', details: result });
    }
  } catch (err) {
    console.error('NAT configuration error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// New API endpoint for DHCP configuration
app.post('/api/configure-dhcp', async (req, res) => {
  const { switchIp, dhcpPools, enabled } = req.body;
  
  if (!switchIp) {
    return res.status(400).json({ error: 'Switch IP is required' });
  }

  try {
    const playbookData = {
      action: 'dhcp',
      target_ip: switchIp,
      dhcp_pools: dhcpPools || [],
      enabled: enabled !== undefined ? enabled : true
    };

    const generateResponse = await fetch(`${FLASK_API_URL}/api/generate-and-execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(playbookData)
    });

    const result = await generateResponse.json();
    
    if (result.success) {
      console.log("DHCP configuration successful:", result);
      res.json({ message: 'DHCP configuration applied successfully', details: result });
    } else {
      console.error("DHCP configuration failed:", result);
      res.status(500).json({ error: 'Failed to configure DHCP', details: result });
    }
  } catch (err) {
    console.error('DHCP configuration error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// New API endpoint for STP configuration
app.post('/api/configure-stp', async (req, res) => {
  const { switchIp, enabled, mode, portConfigs } = req.body;
  
  if (!switchIp) {
    return res.status(400).json({ error: 'Switch IP is required' });
  }

  try {
    const playbookData = {
      action: 'stp',
      target_ip: switchIp,
      enabled: enabled !== undefined ? enabled : true,
      mode: mode || 'pvst',
      port_configs: portConfigs || []
    };

    const generateResponse = await fetch(`${FLASK_API_URL}/api/generate-and-execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(playbookData)
    });

    const result = await generateResponse.json();
    
    if (result.success) {
      console.log("STP configuration successful:", result);
      res.json({ message: 'STP configuration applied successfully', details: result });
    } else {
      console.error("STP configuration failed:", result);
      res.status(500).json({ error: 'Failed to configure STP', details: result });
    }
  } catch (err) {
    console.error('STP configuration error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// New API endpoint for EtherChannel configuration
app.post('/api/configure-etherchannel', async (req, res) => {
  const { switchIp, enabled, groups } = req.body;
  
  if (!switchIp) {
    return res.status(400).json({ error: 'Switch IP is required' });
  }

  try {
    const playbookData = {
      action: 'etherchannel',
      target_ip: switchIp,
      enabled: enabled !== undefined ? enabled : true,
      groups: groups || []
    };

    const generateResponse = await fetch(`${FLASK_API_URL}/api/generate-and-execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(playbookData)
    });

    const result = await generateResponse.json();
    
    if (result.success) {
      console.log("EtherChannel configuration successful:", result);
      res.json({ message: 'EtherChannel configuration applied successfully', details: result });
    } else {
      console.error("EtherChannel configuration failed:", result);
      res.status(500).json({ error: 'Failed to configure EtherChannel', details: result });
    }
  } catch (err) {
    console.error('EtherChannel configuration error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// WebSocket for SSH terminal and device status
io.on('connection', (socket) => {
  console.log('Socket.IO client connected:', socket.id);

  socket.on('start-ssh', async ({ deviceId }) => {
    try {
      const device = await Device.findOne({ name: deviceId });
      if (!device) {
        socket.emit('terminal-output', { output: 'Device not found\n' });
        return;
      }

      // Note: SSH implementation removed as we're using playbooks now
      socket.emit('terminal-output', { output: 'SSH functionality disabled; using playbooks instead\n' });
    } catch (err) {
      socket.emit('terminal-output', { output: `Error: ${err.message}\n` });
    }
  });

  const statusInterval = setInterval(async () => {
    try {
      const devices = await Device.find();
      devices.forEach((device) => {
        socket.emit('device-status-update', {
          id: device.name,
          status: Math.random() > 0.2 ? 'online' : 'offline',
        });
      });
    } catch (error) {
      console.error('Error updating device status:', error);
    }
  }, 10000);

  socket.on('disconnect', () => {
    clearInterval(statusInterval);
    console.log('Socket.IO client disconnected:', socket.id);
  });
});

// Monitoring API endpoints
app.get('/api/monitoring/health', authenticateToken, requirePermission('read_monitoring'), async (req, res) => {
  try {
    const health = await monitoringService.getSystemHealth();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system health',
      error: error.message
    });
  }
});

app.get('/api/monitoring/metrics', authenticateToken, requirePermission('read_monitoring'), async (req, res) => {
  try {
    const metrics = await monitoringService.getSystemMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system metrics',
      error: error.message
    });
  }
});

app.get('/api/monitoring/logs', authenticateToken, requirePermission('read_monitoring'), async (req, res) => {
  try {
    const { limit = 100, level } = req.query;
    const logs = await monitoringService.getRecentLogs(parseInt(limit), level);
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get logs',
      error: error.message
    });
  }
});

app.get('/api/monitoring/alerts', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const alerts = await monitoringService.getAlerts(parseInt(limit));
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get alerts',
      error: error.message
    });
  }
});

// Backup API endpoints
app.post('/api/backup/create', async (req, res) => {
  try {
    const { type = 'full' } = req.body;
    let result;
    
    switch (type) {
      case 'database':
        result = await backupService.createDatabaseBackup();
        break;
      case 'configuration':
        result = await backupService.createConfigurationBackup();
        break;
      case 'full':
      default:
        result = await backupService.createFullBackup();
        break;
    }
    
    if (result.success) {
      appendAuditLog(`Backup created: ${result.filename} (${type})`);
      res.json({
        success: true,
        message: `${type} backup created successfully`,
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Backup creation failed',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Backup creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

app.get('/api/backup/list', async (req, res) => {
  try {
    const backups = await backupService.listBackups();
    res.json({
      success: true,
      data: backups
    });
  } catch (error) {
    console.error('Backup list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list backups',
      error: error.message
    });
  }
});

app.get('/api/backup/stats', async (req, res) => {
  try {
    const stats = await backupService.getBackupStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Backup stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get backup stats',
      error: error.message
    });
  }
});

app.post('/api/backup/restore', async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Filename is required'
      });
    }
    
    const filepath = path.join(backupService.backupDir, filename);
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found'
      });
    }
    
    const result = await backupService.restoreFromBackup(filepath);
    
    if (result.success) {
      appendAuditLog(`Backup restored: ${filename}`);
      res.json({
        success: true,
        message: 'Backup restored successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Backup restore failed',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Backup restore error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

app.delete('/api/backup/delete/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const result = await backupService.deleteBackup(filename);
    
    if (result.success) {
      appendAuditLog(`Backup deleted: ${filename}`);
      res.json({
        success: true,
        message: 'Backup deleted successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to delete backup',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Backup delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

app.post('/api/backup/cleanup', async (req, res) => {
  try {
    const { retentionDays = 30 } = req.body;
    const result = await backupService.cleanupOldBackups(retentionDays);
    
    if (result.success) {
      appendAuditLog(`Backup cleanup completed: ${result.deletedCount} files deleted`);
      res.json({
        success: true,
        message: 'Backup cleanup completed',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Backup cleanup failed',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Backup cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Basic API endpoint to get audit logs
app.get('/api/logs', (req, res) => {
  const logPath = path.join(__dirname, 'audit.log');
  if (!fs.existsSync(logPath)) {
    return res.json([]);
  }
  fs.readFile(logPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read log file' });
    }
    const lines = data.trim().split('\n');
    const last100 = lines.slice(-100);
    res.json(last100);
  });
});

// Handle unknown routes (404 JSON)
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

function appendAuditLog(entry) {
  const logPath = path.join(__dirname, 'audit.log');
  const timestamp = new Date().toISOString();
  fs.appendFile(logPath, `[${timestamp}] ${entry}\n`, err => {
    if (err) console.error('Failed to write audit log:', err);
  });
}

// In each relevant endpoint, add logging:

app.post('/api/generate-playbook', (req, res, next) => {
  appendAuditLog(`/api/generate-playbook called by ${req.ip}`);
  next();
});

app.post('/api/execute-playbook', (req, res, next) => {
  appendAuditLog(`/api/execute-playbook called by ${req.ip}`);
  next();
});

app.post('/api/generate-and-execute', (req, res, next) => {
  appendAuditLog(`/api/generate-and-execute called by ${req.ip}`);
  next();
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on http://0.0.0.0:${PORT}`);
});
