import MonitoringService from './monitoring_service.js';

const monitoringService = new MonitoringService();

// Simulate a cyber attack scenario
async function simulateCyberAttack() {
  console.log('🚨 Starting Cyber Attack Simulation...\n');

  // Phase 1: Reconnaissance
  console.log('🔍 Phase 1: Reconnaissance Attack');
  monitoringService.log('warning', 'Port scan detected from suspicious IP', {
    source: '203.0.113.45',
    ports: [22, 23, 80, 443, 8080, 3306, 5432],
    duration: '5 minutes',
    scanType: 'TCP SYN scan'
  });

  monitoringService.log('warning', 'Multiple failed SSH login attempts', {
    source: '203.0.113.45',
    attempts: 25,
    usernames: ['admin', 'root', 'user', 'test'],
    timeWindow: '10 minutes'
  });

  // Phase 2: Initial Access
  console.log('🚪 Phase 2: Initial Access Attempt');
  monitoringService.log('error', 'Unauthorized access attempt detected', {
    source: '203.0.113.45',
    target: '192.168.1.100',
    method: 'SSH brute force',
    credentials: 'admin:password123',
    timestamp: new Date().toISOString()
  });

  monitoringService.log('error', 'Suspicious file upload detected', {
    filename: 'payload.php',
    size: '2.5MB',
    source: '203.0.113.45',
    destination: '/var/www/html/',
    hash: 'a1b2c3d4e5f6...'
  });

  // Phase 3: Lateral Movement
  console.log('🔄 Phase 3: Lateral Movement');
  monitoringService.log('error', 'Unusual network traffic detected', {
    source: '192.168.1.100',
    destination: '192.168.1.50',
    protocol: 'SMB',
    port: 445,
    dataSize: '15MB',
    pattern: 'lateral_movement'
  });

  monitoringService.log('warning', 'New admin user created', {
    username: 'backdoor_user',
    source: '192.168.1.100',
    timestamp: new Date().toISOString(),
    suspicious: true
  });

  // Phase 4: Data Exfiltration
  console.log('📤 Phase 4: Data Exfiltration');
  monitoringService.log('error', 'Large data transfer to external IP', {
    source: '192.168.1.100',
    destination: '203.0.113.45',
    dataSize: '500MB',
    files: ['database_backup.sql', 'config_files.tar.gz'],
    protocol: 'FTP'
  });

  monitoringService.log('error', 'Database dump detected', {
    database: 'autoflow_db',
    size: '250MB',
    destination: '203.0.113.45',
    timestamp: new Date().toISOString()
  });

  // Phase 5: System Compromise
  console.log('💥 Phase 5: System Compromise');
  monitoringService.log('error', 'Malware detected on system', {
    filename: 'crypto_miner.exe',
    location: '/tmp/',
    hash: 'malware_hash_123',
    type: 'cryptocurrency miner',
    source: '203.0.113.45'
  });

  monitoringService.log('error', 'System process killed unexpectedly', {
    process: 'nginx',
    pid: 1234,
    reason: 'unknown',
    suspicious: true
  });

  monitoringService.log('error', 'Firewall rules modified', {
    rule: 'DROP 203.0.113.45',
    action: 'deleted',
    source: '192.168.1.100',
    timestamp: new Date().toISOString()
  });

  // Phase 6: Persistence
  console.log('🔒 Phase 6: Persistence Mechanisms');
  monitoringService.log('error', 'Suspicious cron job added', {
    job: '*/5 * * * * /tmp/backdoor.sh',
    user: 'root',
    source: '192.168.1.100'
  });

  monitoringService.log('warning', 'New startup service detected', {
    service: 'systemd-backdoor',
    path: '/etc/systemd/system/',
    source: 'unknown'
  });

  console.log('\n✅ Cyber attack simulation completed!');
}

// Simulate system stress and failures
async function simulateSystemStress() {
  console.log('💥 Starting System Stress Simulation...\n');

  // CPU Stress
  console.log('🔥 Simulating CPU stress...');
  monitoringService.log('warning', 'CPU usage critically high', {
    cpuUsage: 95,
    loadAverage: [4.8, 4.2, 3.9],
    processes: 200,
    topProcesses: ['crypto_miner', 'nginx', 'node']
  });

  monitoringService.log('error', 'CPU temperature critical', {
    temperature: 85,
    threshold: 70,
    unit: 'celsius'
  });

  // Memory Stress
  console.log('🧠 Simulating memory stress...');
  monitoringService.log('error', 'Memory critically low', {
    memoryUsage: 98,
    available: '50MB',
    swapUsage: 95,
    oomKiller: true
  });

  monitoringService.log('warning', 'Memory leak detected', {
    process: 'node',
    memoryGrowth: '2GB/hour',
    duration: '3 hours'
  });

  // Disk Stress
  console.log('💾 Simulating disk stress...');
  monitoringService.log('error', 'Disk space critical', {
    usage: 99,
    freeSpace: '100MB',
    largestFiles: ['/var/log/attack.log', '/tmp/malware.exe']
  });

  monitoringService.log('warning', 'Disk I/O bottleneck', {
    readLatency: '500ms',
    writeLatency: '800ms',
    queueDepth: 50
  });

  // Network Stress
  console.log('🌐 Simulating network stress...');
  monitoringService.log('error', 'Network interface overloaded', {
    interface: 'eth0',
    utilization: 98,
    droppedPackets: 1000,
    errors: 150
  });

  monitoringService.log('warning', 'DDoS attack detected', {
    source: 'multiple',
    packets: 10000,
    duration: '30 minutes',
    type: 'SYN flood'
  });

  console.log('\n✅ System stress simulation completed!');
}

// Simulate network attacks
async function simulateNetworkAttacks() {
  console.log('🌐 Starting Network Attack Simulation...\n');

  // ARP Spoofing
  console.log('🎭 Simulating ARP spoofing...');
  monitoringService.log('error', 'ARP spoofing attack detected', {
    attacker: '192.168.1.200',
    target: '192.168.1.1',
    spoofedMac: '00:1A:2B:3C:4D:5E',
    packets: 500
  });

  // DHCP Snooping
  console.log('🏠 Simulating DHCP attacks...');
  monitoringService.log('error', 'Rogue DHCP server detected', {
    rogueServer: '192.168.1.254',
    legitimateServer: '192.168.1.1',
    leases: 15
  });

  // VLAN Hopping
  console.log('🔄 Simulating VLAN attacks...');
  monitoringService.log('warning', 'VLAN hopping attempt detected', {
    source: '192.168.1.100',
    targetVlan: 10,
    method: 'double tagging',
    packets: 25
  });

  // STP Attacks
  console.log('🌳 Simulating STP attacks...');
  monitoringService.log('error', 'STP root bridge takeover attempt', {
    attacker: '192.168.1.200',
    priority: 0,
    originalRoot: 'SW1-Core'
  });

  console.log('\n✅ Network attack simulation completed!');
}

// Simulate application layer attacks
async function simulateApplicationAttacks() {
  console.log('🔧 Starting Application Attack Simulation...\n');

  // SQL Injection
  console.log('💉 Simulating SQL injection...');
  monitoringService.log('error', 'SQL injection attempt detected', {
    source: '203.0.113.45',
    payload: "'; DROP TABLE users; --",
    target: '/api/users',
    blocked: true
  });

  // XSS Attack
  console.log('🎯 Simulating XSS attack...');
  monitoringService.log('warning', 'XSS attack attempt detected', {
    source: '203.0.113.45',
    payload: '<script>alert("XSS")</script>',
    target: '/api/comments',
    blocked: true
  });

  // Directory Traversal
  console.log('📁 Simulating directory traversal...');
  monitoringService.log('error', 'Directory traversal attempt detected', {
    source: '203.0.113.45',
    payload: '../../../etc/passwd',
    target: '/api/files',
    blocked: true
  });

  // API Abuse
  console.log('🔌 Simulating API abuse...');
  monitoringService.log('warning', 'API rate limit exceeded', {
    source: '203.0.113.45',
    endpoint: '/api/devices',
    requests: 1000,
    timeWindow: '1 minute',
    blocked: true
  });

  console.log('\n✅ Application attack simulation completed!');
}

// Main simulation function
async function runAttackSimulation() {
  console.log('🎭 Starting Comprehensive Attack Simulation...\n');
  
  // Run all attack simulations
  await simulateCyberAttack();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await simulateSystemStress();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await simulateNetworkAttacks();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await simulateApplicationAttacks();
  
  console.log('\n🎉 All attack simulations completed!');
  console.log('📊 Check your monitoring dashboard for alerts and logs...');
  
  // Show current status
  try {
    const health = await monitoringService.getSystemHealth();
    console.log('\n📈 Current System Status:', health.status);
    console.log('🚨 Total Alerts:', health.summary?.totalAlerts || 0);
    console.log('❌ Errors:', health.summary?.errorCount || 0);
    console.log('⚠️ Warnings:', health.summary?.warningCount || 0);
  } catch (error) {
    console.log('❌ Failed to get status:', error.message);
  }
}

// Run the simulation
runAttackSimulation().catch(console.error); 