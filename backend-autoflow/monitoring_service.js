import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MonitoringService {
  constructor() {
    this.alerts = [];
    this.metrics = {};
    this.logPath = path.join(__dirname, 'monitoring.log');
    this.alertPath = path.join(__dirname, 'alerts.log');
    this.ensureLogFiles();
  }

  ensureLogFiles() {
    if (!fs.existsSync(this.logPath)) {
      fs.writeFileSync(this.logPath, '');
    }
    if (!fs.existsSync(this.alertPath)) {
      fs.writeFileSync(this.alertPath, '');
    }
  }

  log(level, message, details = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      details,
      hostname: os.hostname(),
      pid: process.pid
    };

    const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message} ${JSON.stringify(details)}\n`;
    fs.appendFileSync(this.logPath, logLine);

    // Store in memory for recent logs
    this.alerts.unshift(logEntry);
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(0, 1000);
    }

    // Write to alerts file if it's an error or warning
    if (level === 'error' || level === 'warning') {
      fs.appendFileSync(this.alertPath, logLine);
    }

    return logEntry;
  }

  async getSystemMetrics() {
    try {
      const cpuUsage = os.loadavg();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const memUsage = ((totalMem - freeMem) / totalMem) * 100;

      // Get disk usage
      const diskUsage = await this.getDiskUsage();

      // Get network stats
      const networkStats = os.networkInterfaces();

      // Get process info
      const processInfo = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      };

      this.metrics = {
        timestamp: new Date().toISOString(),
        system: {
          hostname: os.hostname(),
          platform: os.platform(),
          arch: os.arch(),
          uptime: os.uptime(),
          cpu: {
            cores: os.cpus().length,
            loadAverage: cpuUsage,
            usage: processInfo.cpu
          },
          memory: {
            total: totalMem,
            free: freeMem,
            used: totalMem - freeMem,
            usagePercent: memUsage
          },
          disk: diskUsage,
          network: networkStats
        },
        process: processInfo
      };

      // Check for alerts
      this.checkAlerts();

      return this.metrics;
    } catch (error) {
      this.log('error', 'Failed to get system metrics', { error: error.message });
      throw error;
    }
  }

  async getDiskUsage() {
    try {
      const { stdout } = await execAsync('df -h .');
      const lines = stdout.trim().split('\n');
      const diskLine = lines[1];
      const parts = diskLine.split(/\s+/);
      
      return {
        total: parts[1],
        used: parts[2],
        available: parts[3],
        usagePercent: parseInt(parts[4].replace('%', ''))
      };
    } catch (error) {
      return { error: 'Could not get disk usage' };
    }
  }

  checkAlerts() {
    const alerts = [];

    // CPU usage alert
    if (this.metrics.system.cpu.loadAverage[0] > 2.0) {
      alerts.push({
        type: 'high_cpu',
        severity: 'warning',
        message: `High CPU load: ${this.metrics.system.cpu.loadAverage[0].toFixed(2)}`,
        value: this.metrics.system.cpu.loadAverage[0]
      });
    }

    // Memory usage alert
    if (this.metrics.system.memory.usagePercent > 85) {
      alerts.push({
        type: 'high_memory',
        severity: 'warning',
        message: `High memory usage: ${this.metrics.system.memory.usagePercent.toFixed(1)}%`,
        value: this.metrics.system.memory.usagePercent
      });
    }

    // Disk usage alert
    if (this.metrics.system.disk.usagePercent > 90) {
      alerts.push({
        type: 'high_disk',
        severity: 'critical',
        message: `High disk usage: ${this.metrics.system.disk.usagePercent}%`,
        value: this.metrics.system.disk.usagePercent
      });
    }

    // Log alerts
    alerts.forEach(alert => {
      this.log(alert.severity, alert.message, { alert });
    });

    return alerts;
  }

  async getRecentLogs(limit = 100, level = null) {
    try {
      const logContent = fs.readFileSync(this.logPath, 'utf8');
      const lines = logContent.trim().split('\n').filter(line => line.trim());
      
      let logs = lines.map(line => {
        const match = line.match(/\[(.*?)\] \[(.*?)\] (.*?)( \{.*\})?$/);
        if (match) {
          let details = {};
          if (match[4]) {
            try {
              details = JSON.parse(match[4]);
            } catch (e) {
              details = { raw: match[4] };
            }
          }
          return {
            timestamp: match[1],
            level: match[2],
            message: match[3],
            details: details
          };
        }
        return null;
      }).filter(log => log !== null);

      // Filter by level if specified
      if (level) {
        logs = logs.filter(log => log.level.toLowerCase() === level.toLowerCase());
      }

      // Return most recent logs
      return logs.slice(-limit);
    } catch (error) {
      this.log('error', 'Failed to read logs', { error: error.message });
      return [];
    }
  }

  async getAlerts(limit = 50) {
    try {
      const alertContent = fs.readFileSync(this.alertPath, 'utf8');
      const lines = alertContent.trim().split('\n').filter(line => line.trim());
      
      const alerts = lines.map(line => {
        const match = line.match(/\[(.*?)\] \[(.*?)\] (.*?)( \{.*\})?$/);
        if (match) {
          let details = {};
          if (match[4]) {
            try {
              details = JSON.parse(match[4]);
            } catch (e) {
              details = { raw: match[4] };
            }
          }
          return {
            timestamp: match[1],
            level: match[2],
            message: match[3],
            details: details
          };
        }
        return null;
      }).filter(alert => alert !== null);

      return alerts.slice(-limit);
    } catch (error) {
      this.log('error', 'Failed to read alerts', { error: error.message });
      return [];
    }
  }

  async getSystemHealth() {
    try {
      const metrics = await this.getSystemMetrics();
      const recentLogs = await this.getRecentLogs(20);
      const recentAlerts = await this.getAlerts(10);

      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        metrics,
        recentLogs,
        recentAlerts,
        summary: {
          totalLogs: recentLogs.length,
          totalAlerts: recentAlerts.length,
          errorCount: recentLogs.filter(log => log.level === 'ERROR').length,
          warningCount: recentLogs.filter(log => log.level === 'WARNING').length
        }
      };

      // Determine overall health status
      if (recentAlerts.some(alert => alert.level === 'CRITICAL')) {
        health.status = 'critical';
      } else if (recentAlerts.some(alert => alert.level === 'WARNING')) {
        health.status = 'warning';
      }

      return health;
    } catch (error) {
      this.log('error', 'Failed to get system health', { error: error.message });
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  // Custom monitoring functions
  monitorEndpoint(endpoint, method = 'GET') {
    return async () => {
      try {
        const startTime = Date.now();
        const response = await fetch(`http://localhost:5000${endpoint}`, { method });
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        if (response.ok) {
          this.log('info', `Endpoint ${method} ${endpoint} OK`, { 
            responseTime, 
            status: response.status 
          });
        } else {
          this.log('warning', `Endpoint ${method} ${endpoint} failed`, { 
            responseTime, 
            status: response.status 
          });
        }
      } catch (error) {
        this.log('error', `Endpoint ${method} ${endpoint} error`, { 
          error: error.message 
        });
      }
    };
  }

  monitorDatabase() {
    return async () => {
      try {
        // This would check your MongoDB connection
        // For now, we'll just log that we're monitoring
        this.log('info', 'Database health check', { 
          status: 'monitoring' 
        });
      } catch (error) {
        this.log('error', 'Database health check failed', { 
          error: error.message 
        });
      }
    };
  }

  monitorBackupSystem() {
    return async () => {
      try {
        const backupDir = './backups';
        if (fs.existsSync(backupDir)) {
          const files = fs.readdirSync(backupDir);
          const backupCount = files.length;
          const totalSize = files.reduce((size, file) => {
            const filePath = path.join(backupDir, file);
            const stats = fs.statSync(filePath);
            return size + stats.size;
          }, 0);

          this.log('info', 'Backup system check', { 
            backupCount, 
            totalSizeMB: (totalSize / 1024 / 1024).toFixed(2) 
          });
        } else {
          this.log('warning', 'Backup directory not found', { 
            path: backupDir 
          });
        }
      } catch (error) {
        this.log('error', 'Backup system check failed', { 
          error: error.message 
        });
      }
    };
  }
}

export default MonitoringService; 