import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import Device from './models/Device.js';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BackupService {
  constructor() {
    this.backupDir = process.env.BACKUP_DIR || './backups';
    this.ensureBackupDirectory();
  }

  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createDatabaseBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `db_backup_${timestamp}.json`;
      const filepath = path.join(this.backupDir, filename);

      // Get all devices from database
      const devices = await Device.find({});
      
      // Create backup object with metadata
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        type: 'database',
        devices: devices,
        metadata: {
          totalDevices: devices.length,
          backupCreatedBy: 'AutoFlow Backup Service'
        }
      };

      // Write backup to file
      fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
      
      console.log(`Database backup created: ${filepath}`);
      return {
        success: true,
        filename,
        filepath,
        size: fs.statSync(filepath).size,
        deviceCount: devices.length
      };
    } catch (error) {
      console.error('Database backup failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createConfigurationBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `config_backup_${timestamp}.json`;
      const filepath = path.join(this.backupDir, filename);

      // Collect configuration files
      const configFiles = [
        'package.json',
        'requirements.txt',
        'inventory.ini',
        'playbook.yml',
        'temp_inventory.yml'
      ];

      const configData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        type: 'configuration',
        files: {}
      };

      // Read each configuration file
      for (const file of configFiles) {
        const filepath = path.join(__dirname, file);
        if (fs.existsSync(filepath)) {
          configData.files[file] = fs.readFileSync(filepath, 'utf8');
        }
      }

      // Add environment variables (without sensitive data)
      configData.environment = {
        NODE_ENV: process.env.NODE_ENV,
        BACKUP_DIR: process.env.BACKUP_DIR,
        FLASK_API_URL: process.env.FLASK_API_URL,
        // Don't include sensitive data like MONGO_URL
      };

      // Write backup to file
      fs.writeFileSync(filepath, JSON.stringify(configData, null, 2));
      
      console.log(`Configuration backup created: ${filepath}`);
      return {
        success: true,
        filename,
        filepath,
        size: fs.statSync(filepath).size,
        fileCount: Object.keys(configData.files).length
      };
    } catch (error) {
      console.error('Configuration backup failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createFullBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `full_backup_${timestamp}.tar.gz`;
      const filepath = path.join(this.backupDir, filename);

      // Create a temporary directory for the backup
      const tempDir = path.join(this.backupDir, `temp_backup_${timestamp}`);
      fs.mkdirSync(tempDir, { recursive: true });

      // Create database backup
      const dbBackup = await this.createDatabaseBackup();
      if (dbBackup.success) {
        fs.copyFileSync(dbBackup.filepath, path.join(tempDir, 'database_backup.json'));
      }

      // Create configuration backup
      const configBackup = await this.createConfigurationBackup();
      if (configBackup.success) {
        fs.copyFileSync(configBackup.filepath, path.join(tempDir, 'config_backup.json'));
      }

      // Copy important files
      const importantFiles = [
        'server.js',
        'playbook_api.py',
        'playbook_generator.py',
        'models/Device.js',
        'config/db.js'
      ];

      for (const file of importantFiles) {
        const sourcePath = path.join(__dirname, file);
        if (fs.existsSync(sourcePath)) {
          const destPath = path.join(tempDir, file);
          fs.mkdirSync(path.dirname(destPath), { recursive: true });
          fs.copyFileSync(sourcePath, destPath);
        }
      }

      // Create tar.gz archive
      const tarCommand = `tar -czf "${filepath}" -C "${tempDir}" .`;
      await execAsync(tarCommand);

      // Clean up temporary directory
      fs.rmSync(tempDir, { recursive: true, force: true });

      console.log(`Full backup created: ${filepath}`);
      return {
        success: true,
        filename,
        filepath,
        size: fs.statSync(filepath).size,
        type: 'full'
      };
    } catch (error) {
      console.error('Full backup failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async restoreFromBackup(backupPath) {
    try {
      const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      
      if (backupData.type === 'database') {
        // Restore devices
        if (backupData.devices && Array.isArray(backupData.devices)) {
          // Clear existing devices
          await Device.deleteMany({});
          
          // Restore devices
          for (const device of backupData.devices) {
            const newDevice = new Device({
              name: device.name,
              ip: device.ip,
              createdAt: device.createdAt || new Date(),
              updatedAt: new Date()
            });
            await newDevice.save();
          }
        }
        
        return {
          success: true,
          message: `Restored ${backupData.devices?.length || 0} devices from backup`
        };
      } else if (backupData.type === 'configuration') {
        // Restore configuration files
        for (const [filename, content] of Object.entries(backupData.files)) {
          const filepath = path.join(__dirname, filename);
          fs.writeFileSync(filepath, content);
        }
        
        return {
          success: true,
          message: `Restored ${Object.keys(backupData.files).length} configuration files`
        };
      }
      
      return {
        success: false,
        error: 'Unsupported backup type'
      };
    } catch (error) {
      console.error('Restore failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async listBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const backups = [];

      for (const file of files) {
        const filepath = path.join(this.backupDir, file);
        const stats = fs.statSync(filepath);
        
        let backupType = 'unknown';
        if (file.includes('db_backup')) backupType = 'database';
        else if (file.includes('config_backup')) backupType = 'configuration';
        else if (file.includes('full_backup')) backupType = 'full';

        backups.push({
          filename: file,
          filepath,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          type: backupType
        });
      }

      // Sort by creation date (newest first)
      backups.sort((a, b) => new Date(b.created) - new Date(a.created));
      
      return backups;
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  async deleteBackup(filename) {
    try {
      const filepath = path.join(this.backupDir, filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return {
          success: true,
          message: `Backup ${filename} deleted successfully`
        };
      } else {
        return {
          success: false,
          error: 'Backup file not found'
        };
      }
    } catch (error) {
      console.error('Failed to delete backup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async cleanupOldBackups(retentionDays = 30) {
    try {
      const backups = await this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      let deletedCount = 0;
      
      for (const backup of backups) {
        if (new Date(backup.created) < cutoffDate) {
          const result = await this.deleteBackup(backup.filename);
          if (result.success) {
            deletedCount++;
          }
        }
      }
      
      return {
        success: true,
        message: `Cleaned up ${deletedCount} old backups`,
        deletedCount
      };
    } catch (error) {
      console.error('Cleanup failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getBackupStats() {
    try {
      const backups = await this.listBackups();
      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
      
      const stats = {
        totalBackups: backups.length,
        totalSize: totalSize,
        totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
        byType: {
          database: backups.filter(b => b.type === 'database').length,
          configuration: backups.filter(b => b.type === 'configuration').length,
          full: backups.filter(b => b.type === 'full').length
        },
        oldestBackup: backups.length > 0 ? backups[backups.length - 1].created : null,
        newestBackup: backups.length > 0 ? backups[0].created : null
      };
      
      return stats;
    } catch (error) {
      console.error('Failed to get backup stats:', error);
      return {
        totalBackups: 0,
        totalSize: 0,
        totalSizeMB: 0,
        byType: { database: 0, configuration: 0, full: 0 },
        oldestBackup: null,
        newestBackup: null
      };
    }
  }
}

export default BackupService; 