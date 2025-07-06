import MonitoringService from './monitoring_service.js';

const monitoringService = new MonitoringService();

// Generate test data function
async function generateTestData() {
  console.log('🚀 Generating test monitoring data...\n');

  // Generate normal operations
  console.log('📝 Generating normal operations...');
  monitoringService.log('info', 'User login successful', { user: 'admin', ip: '192.168.1.100' });
  monitoringService.log('info', 'VLAN 10 created successfully', { vlanId: 10, name: 'Office' });
  monitoringService.log('info', 'Backup completed', { type: 'full', size: '2.1GB' });
  monitoringService.log('info', 'Device discovered', { mac: '00:1A:2B:3C:4D:5E', port: 'Fa0/1' });

  // Generate warnings
  console.log('⚠️ Generating warnings...');
  monitoringService.log('warning', 'High CPU usage detected', { cpuUsage: 85, threshold: 80 });
  monitoringService.log('warning', 'Memory usage high', { memoryUsage: 78, available: '512MB' });
  monitoringService.log('warning', 'Multiple failed logins', { user: 'unknown', attempts: 5 });

  // Generate errors
  console.log('❌ Generating errors...');
  monitoringService.log('error', 'Database connection timeout', { retries: 3, duration: '30s' });
  monitoringService.log('error', 'Interface Fa0/3 down', { duration: '5 minutes' });
  monitoringService.log('error', 'Backup failed - disk full', { required: '3GB', available: '1GB' });

  // Generate security alerts
  console.log('🚨 Generating security alerts...');
  monitoringService.log('error', 'Unauthorized access attempt', { ip: '203.0.113.45', port: 22 });
  monitoringService.log('warning', 'Port scan detected', { source: '198.51.100.25', ports: [22, 80, 443] });

  // Generate network events
  console.log('🌐 Generating network events...');
  monitoringService.log('info', 'DHCP lease assigned', { mac: '00:1A:2B:3C:4D:6F', ip: '192.168.10.150' });
  monitoringService.log('warning', 'STP topology change', { rootBridge: 'SW1-Core' });

  console.log('\n✅ Test data generated successfully!');
  console.log('📊 Check your monitoring dashboard now...');
}

// Run the test data generation
generateTestData().catch(console.error); 