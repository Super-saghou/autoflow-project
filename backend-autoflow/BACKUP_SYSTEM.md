# AutoFlow Backup System

## Overview
The AutoFlow platform now includes a comprehensive backup system that allows you to create, manage, and restore backups of your network configuration and data.

## Features

### 🔄 Backup Types
- **Full Backup**: Complete system backup including database, configuration files, and source code
- **Database Backup**: Only device and configuration data from MongoDB
- **Configuration Backup**: Configuration files and environment settings

### 📊 Backup Management
- **Automatic Backup Directory**: Backups are stored in `/var/backups/autoflow/`
- **Backup Statistics**: Track total backups, size, and types
- **Retention Management**: Automatically clean up old backups
- **Restore Functionality**: Restore from any backup file

## API Endpoints

### Create Backup
```bash
POST /api/backup/create
Content-Type: application/json

{
  "type": "full" | "database" | "configuration"
}
```

### List Backups
```bash
GET /api/backup/list
```

### Get Backup Statistics
```bash
GET /api/backup/stats
```

### Restore Backup
```bash
POST /api/backup/restore
Content-Type: application/json

{
  "filename": "backup_filename.json"
}
```

### Delete Backup
```bash
DELETE /api/backup/delete/:filename
```

### Cleanup Old Backups
```bash
POST /api/backup/cleanup
Content-Type: application/json

{
  "retentionDays": 30
}
```

## Usage Examples

### Test the Backup System
```bash
cd backend-autoflow
node test_backup.js
```

### Create a Full Backup via API
```bash
curl -X POST http://localhost:5000/api/backup/create \
  -H "Content-Type: application/json" \
  -d '{"type": "full"}'
```

### List All Backups
```bash
curl http://localhost:5000/api/backup/list
```

### Get Backup Statistics
```bash
curl http://localhost:5000/api/backup/stats
```

## Frontend Integration

The backup system is integrated into the Settings page in the frontend. Users can:

1. **View Backup Statistics**: See total backups, size, and latest backup date
2. **Create Backups**: Choose backup type and create manual backups
3. **Manage Backups**: View recent backups, restore, or delete them
4. **Cleanup**: Remove old backups automatically

## Backup File Structure

### Database Backup
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "version": "1.0",
  "type": "database",
  "devices": [...],
  "metadata": {
    "totalDevices": 5,
    "backupCreatedBy": "AutoFlow Backup Service"
  }
}
```

### Configuration Backup
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "version": "1.0",
  "type": "configuration",
  "files": {
    "package.json": "...",
    "requirements.txt": "...",
    "inventory.ini": "..."
  },
  "environment": {
    "NODE_ENV": "production",
    "BACKUP_DIR": "/var/backups/autoflow"
  }
}
```

### Full Backup
- Compressed tar.gz archive containing:
  - Database backup
  - Configuration backup
  - Source code files
  - Important configuration files

## Security Considerations

1. **Backup Directory**: Ensure `/var/backups/autoflow/` has proper permissions
2. **Sensitive Data**: Database backups may contain sensitive information
3. **Access Control**: Only authorized users should access backup files
4. **Encryption**: Consider encrypting backup files for additional security

## Monitoring

The backup system logs all activities to the audit log:
- Backup creation
- Backup restoration
- Backup deletion
- Cleanup operations

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure the backup directory is writable
2. **Disk Space**: Monitor available disk space for backup storage
3. **MongoDB Connection**: Ensure MongoDB is running for database backups
4. **File System**: Ensure tar command is available for full backups

### Logs
Check the audit log for backup-related activities:
```bash
tail -f audit.log | grep backup
```

## Configuration

### Environment Variables
- `BACKUP_DIR`: Backup storage directory (default: `/var/backups/autoflow`)
- `FLASK_API_URL`: Flask API URL for playbook generation

### Backup Retention
- Default retention: 30 days
- Configurable via API or settings
- Automatic cleanup of old backups

## Best Practices

1. **Regular Backups**: Schedule regular backups (daily/weekly)
2. **Test Restores**: Periodically test backup restoration
3. **Monitor Space**: Keep track of backup storage usage
4. **Secure Storage**: Store backups in a secure location
5. **Documentation**: Keep records of backup procedures and schedules 