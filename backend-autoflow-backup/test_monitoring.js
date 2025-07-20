import MonitoringService from './monitoring_service.js';

class MonitoringSimulator {
  constructor() {
    this.monitoringService = new MonitoringService();
    this.isRunning = false;
    this.simulationInterval = null;
  }

  // Simulate normal system operations
  simulateNormalOperations() {
    console.log('🟢 Starting normal operations simulation...');
    
    // Simulate regular info logs
    this.monitoringService.log('info', 'User login successful', { 
      user: 'admin', 
      ip: '192.168.1.100',
      timestamp: new Date().toISOString()
    });

    this.monitoringService.log('info', 'VLAN configuration updated', { 
      vlanId: 10, 
      action: 'create',
      switch: 'SW1-Core'
    });

    this.monitoringService.log('info', 'Backup completed successfully', { 
      type: 'full',
      size: '2.5GB',
      duration: '45s'
    });

    this.monitoringService.log('info', 'Device discovered on network', { 
      mac: '00:1A:2B:3C:4D:5E',
      ip: '192.168.1.50',
      port: 'Fa0/1'
    });

    console.log('✅ Normal operations logged');
  }

  // Simulate warning conditions
  simulateWarnings() {
    console.log('🟡 Starting warnings simulation...');
    
    this.monitoringService.log('warning', 'High CPU usage detected', { 
      cpuUsage: 85,
      loadAverage: 2.5,
      threshold: 80
    });

    this.monitoringService.log('warning', 'Memory usage approaching limit', { 
      memoryUsage: 78,
      available: '512MB',
      threshold: 80
    });

    this.monitoringService.log('warning', 'Backup directory getting full', { 
      usedSpace: '8.5GB',
      totalSpace: '10GB',
      freeSpace: '1.5GB'
    });

    this.monitoringService.log('warning', 'Multiple failed login attempts', { 
      user: 'unknown',
      ip: '192.168.1.200',
      attempts: 5,
      timeWindow: '5 minutes'
    });

    this.monitoringService.log('warning', 'Interface status changed', { 
      interface: 'Fa0/3',
      oldStatus: 'Up',
      newStatus: 'Down',
      duration: '2 minutes'
    });

    console.log('⚠️ Warnings logged');
  }

  // Simulate critical errors
  simulateErrors() {
    console.log('🔴 Starting errors simulation...');
    
    this.monitoringService.log('error', 'Database connection failed', { 
      error: 'Connection timeout',
      retries: 3,
      duration: '30s'
    });

    this.monitoringService.log('error', 'Flask API service crashed', { 
      error: 'Port 5001 already in use',
      pid: 12345,
      restartAttempts: 2
    });

    this.monitoringService.log('error', 'Backup operation failed', { 
      error: 'Insufficient disk space',
      required: '3GB',
      available: '1GB',
      backupType: 'full'
    });

    this.monitoringService.log('error', 'Network interface down', { 
      interface: 'Fa0/1',
      duration: '10 minutes',
      impact: 'VLAN 10 affected'
    });

    this.monitoringService.log('error', 'SSL certificate expired', { 
      certificate: 'server.cert',
      expiryDate: '2024-01-15',
      daysOverdue: 5
    });

    console.log('❌ Errors logged');
  }

  // Simulate security alerts
  simulateSecurityAlerts() {
    console.log('🚨 Starting security alerts simulation...');
    
    this.monitoringService.log('error', 'Unauthorized access attempt', { 
      ip: '203.0.113.45',
      port: 22,
      method: 'SSH brute force',
      attempts: 50
    });

    this.monitoringService.log('warning', 'Suspicious network activity', { 
      source: '192.168.1.100',
      destination: '203.0.113.100',
      protocol: 'TCP',
      port: 80,
      packets: 1000
    });

    this.monitoringService.log('error', 'Port scan detected', { 
      source: '198.51.100.25',
      ports: [22, 23, 80, 443, 8080],
      duration: '2 minutes'
    });

    this.monitoringService.log('warning', 'DHCP spoofing attempt', { 
      interface: 'Fa0/5',
      rogueServer: '192.168.1.254',
      legitimateServer: '192.168.1.1'
    });

    console.log('🔒 Security alerts logged');
  }

  // Simulate network events
  simulateNetworkEvents() {
    console.log('🌐 Starting network events simulation...');
    
    this.monitoringService.log('info', 'New VLAN created', { 
      vlanId: 30,
      name: 'Guest Network',
      ports: ['Fa0/7', 'Fa0/8']
    });

    this.monitoringService.log('info', 'DHCP lease assigned', { 
      mac: '00:1A:2B:3C:4D:6F',
      ip: '192.168.10.150',
      leaseTime: '24 hours'
    });

    this.monitoringService.log('warning', 'STP topology change', { 
      rootBridge: 'SW1-Core',
      affectedPorts: ['Fa0/2', 'Fa0/3'],
      duration: '30 seconds'
    });

    this.monitoringService.log('info', 'Port security violation', { 
      port: 'Fa0/4',
      mac: '00:1A:2B:3C:4D:70',
      action: 'shutdown'
    });

    console.log('🌐 Network events logged');
  }

  // Simulate system stress
  simulateSystemStress() {
    console.log('💥 Starting system stress simulation...');
    
    // Simulate high CPU
    this.monitoringService.log('warning', 'CPU load critically high', { 
      loadAverage: [4.2, 3.8, 3.5],
      cpuUsage: 95,
      processes: 150
    });

    // Simulate memory pressure
    this.monitoringService.log('error', 'Memory critically low', { 
      memoryUsage: 95,
      available: '100MB',
      swapUsage: 80
    });

    // Simulate disk space issues
    this.monitoringService.log('error', 'Disk space critical', { 
      usage: 98,
      freeSpace: '500MB',
      largestFiles: ['backup_2024-01-20.tar.gz', 'logs/app.log']
    });

    // Simulate network congestion
    this.monitoringService.log('warning', 'Network congestion detected', { 
      interface: 'Fa0/1',
      utilization: 95,
      droppedPackets: 150,
      errors: 25
    });

    console.log('💥 System stress logged');
  }

  // Run a complete simulation cycle
  async runSimulationCycle() {
    console.log('\n🔄 Starting monitoring simulation cycle...\n');
    
    // Normal operations (60% of the time)
    if (Math.random() < 0.6) {
      this.simulateNormalOperations();
    }
    
    // Warnings (25% of the time)
    if (Math.random() < 0.25) {
      this.simulateWarnings();
    }
    
    // Errors (10% of the time)
    if (Math.random() < 0.1) {
      this.simulateErrors();
    }
    
    // Security alerts (3% of the time)
    if (Math.random() < 0.03) {
      this.simulateSecurityAlerts();
    }
    
    // Network events (15% of the time)
    if (Math.random() < 0.15) {
      this.simulateNetworkEvents();
    }
    
    // System stress (5% of the time)
    if (Math.random() < 0.05) {
      this.simulateSystemStress();
    }

    // Get and display current metrics
    try {
      const metrics = await this.monitoringService.getSystemMetrics();
      console.log('\n📊 Current System Metrics:');
      console.log(`CPU Load: ${metrics.system?.cpu?.loadAverage?.[0]?.toFixed(2) || 'N/A'}`);
      console.log(`Memory Usage: ${metrics.system?.memory?.usagePercent?.toFixed(1) || 'N/A'}%`);
      console.log(`Uptime: ${Math.floor(metrics.system?.uptime / 3600)} hours`);
    } catch (error) {
      console.log('❌ Failed to get metrics:', error.message);
    }
  }

  // Start continuous simulation
  startContinuousSimulation(intervalSeconds = 10) {
    if (this.isRunning) {
      console.log('⚠️ Simulation is already running');
      return;
    }

    console.log(`🚀 Starting continuous monitoring simulation (${intervalSeconds}s intervals)...`);
    this.isRunning = true;
    
    // Run initial cycle
    this.runSimulationCycle();
    
    // Set up interval
    this.simulationInterval = setInterval(() => {
      this.runSimulationCycle();
    }, intervalSeconds * 1000);
  }

  // Stop simulation
  stopSimulation() {
    if (!this.isRunning) {
      console.log('⚠️ No simulation running');
      return;
    }

    console.log('🛑 Stopping monitoring simulation...');
    this.isRunning = false;
    
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    
    console.log('✅ Simulation stopped');
  }

  // Run a quick test
  async runQuickTest() {
    console.log('🧪 Running quick monitoring test...\n');
    
    // Test all log types
    this.simulateNormalOperations();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.simulateWarnings();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.simulateErrors();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.simulateSecurityAlerts();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.simulateNetworkEvents();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test API endpoints
    console.log('\n🔍 Testing monitoring API endpoints...');
    
    try {
      const health = await this.monitoringService.getSystemHealth();
      console.log('✅ Health check:', health.status);
      
      const logs = await this.monitoringService.getRecentLogs(10);
      console.log(`✅ Recent logs: ${logs.length} entries`);
      
      const alerts = await this.monitoringService.getAlerts(5);
      console.log(`✅ Recent alerts: ${alerts.length} entries`);
      
      console.log('\n🎉 Quick test completed successfully!');
    } catch (error) {
      console.log('❌ Test failed:', error.message);
    }
  }

  // Display current monitoring status
  async showStatus() {
    console.log('\n📈 Current Monitoring Status:\n');
    
    try {
      const health = await this.monitoringService.getSystemHealth();
      const logs = await this.monitoringService.getRecentLogs(20);
      const alerts = await this.monitoringService.getAlerts(10);
      
      console.log(`System Status: ${health.status.toUpperCase()}`);
      console.log(`Total Logs: ${health.summary?.totalLogs || 0}`);
      console.log(`Active Alerts: ${health.summary?.totalAlerts || 0}`);
      console.log(`Errors: ${health.summary?.errorCount || 0}`);
      console.log(`Warnings: ${health.summary?.warningCount || 0}`);
      
      console.log('\n📋 Recent Logs:');
      logs.slice(-5).forEach(log => {
        const timestamp = new Date(log.timestamp).toLocaleTimeString();
        console.log(`[${timestamp}] [${log.level}] ${log.message}`);
      });
      
      console.log('\n🚨 Recent Alerts:');
      alerts.slice(-3).forEach(alert => {
        const timestamp = new Date(alert.timestamp).toLocaleTimeString();
        console.log(`[${timestamp}] [${alert.level}] ${alert.message}`);
      });
      
    } catch (error) {
      console.log('❌ Failed to get status:', error.message);
    }
  }
}

// Main execution
async function main() {
  const simulator = new MonitoringSimulator();
  
  // Check command line arguments
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'quick':
      await simulator.runQuickTest();
      break;
      
    case 'start':
      const interval = parseInt(args[1]) || 10;
      simulator.startContinuousSimulation(interval);
      
      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log('\n🛑 Received SIGINT, shutting down...');
        simulator.stopSimulation();
        process.exit(0);
      });
      break;
      
    case 'status':
      await simulator.showStatus();
      break;
      
    case 'test-all':
      console.log('🧪 Running comprehensive test...\n');
      simulator.simulateNormalOperations();
      simulator.simulateWarnings();
      simulator.simulateErrors();
      simulator.simulateSecurityAlerts();
      simulator.simulateNetworkEvents();
      simulator.simulateSystemStress();
      await simulator.showStatus();
      break;
      
    default:
      console.log(`
🎯 Monitoring System Simulator

Usage:
  node test_monitoring.js quick          - Run a quick test
  node test_monitoring.js start [sec]    - Start continuous simulation (default: 10s intervals)
  node test_monitoring.js status         - Show current monitoring status
  node test_monitoring.js test-all       - Run all simulation types once

Examples:
  node test_monitoring.js quick
  node test_monitoring.js start 5        - Run every 5 seconds
  node test_monitoring.js status
      `);
      break;
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default MonitoringSimulator; 