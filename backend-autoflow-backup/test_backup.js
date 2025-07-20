import BackupService from './backup_service.js';

async function testBackupSystem() {
  console.log('🧪 Testing AutoFlow Backup System...\n');
  
  const backupService = new BackupService();
  
  try {
    // Test 1: Create database backup
    console.log('1️⃣ Creating database backup...');
    const dbBackup = await backupService.createDatabaseBackup();
    console.log('Result:', dbBackup.success ? '✅ Success' : '❌ Failed');
    if (dbBackup.success) {
      console.log(`   File: ${dbBackup.filename}`);
      console.log(`   Size: ${dbBackup.size} bytes`);
      console.log(`   Devices: ${dbBackup.deviceCount}`);
    }
    console.log('');
    
    // Test 2: Create configuration backup
    console.log('2️⃣ Creating configuration backup...');
    const configBackup = await backupService.createConfigurationBackup();
    console.log('Result:', configBackup.success ? '✅ Success' : '❌ Failed');
    if (configBackup.success) {
      console.log(`   File: ${configBackup.filename}`);
      console.log(`   Size: ${configBackup.size} bytes`);
      console.log(`   Files: ${configBackup.fileCount}`);
    }
    console.log('');
    
    // Test 3: Create full backup
    console.log('3️⃣ Creating full backup...');
    const fullBackup = await backupService.createFullBackup();
    console.log('Result:', fullBackup.success ? '✅ Success' : '❌ Failed');
    if (fullBackup.success) {
      console.log(`   File: ${fullBackup.filename}`);
      console.log(`   Size: ${fullBackup.size} bytes`);
    }
    console.log('');
    
    // Test 4: List backups
    console.log('4️⃣ Listing all backups...');
    const backups = await backupService.listBackups();
    console.log(`Found ${backups.length} backups:`);
    backups.forEach((backup, index) => {
      console.log(`   ${index + 1}. ${backup.filename} (${backup.type}) - ${new Date(backup.created).toLocaleString()}`);
    });
    console.log('');
    
    // Test 5: Get backup stats
    console.log('5️⃣ Getting backup statistics...');
    const stats = await backupService.getBackupStats();
    console.log('Backup Statistics:');
    console.log(`   Total backups: ${stats.totalBackups}`);
    console.log(`   Total size: ${stats.totalSizeMB} MB`);
    console.log(`   By type: ${JSON.stringify(stats.byType)}`);
    console.log('');
    
    console.log('🎉 Backup system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBackupSystem(); 