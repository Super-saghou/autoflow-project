import { Client } from 'node-vault';
import crypto from 'crypto';

class VaultService {
    constructor() {
        this.vault = new Client({
            apiVersion: 'v1',
            endpoint: process.env.VAULT_ADDR || 'http://localhost:8200',
            token: process.env.VAULT_TOKEN
        });
        
        this.secretsPath = 'autoflow/secrets';
        this.networkDevicesPath = 'autoflow/network-devices';
        this.apiKeysPath = 'autoflow/api-keys';
    }

    /**
     * Initialize Vault connection
     */
    async initialize() {
        try {
            await this.vault.health();
            console.log('Vault connection established');
            return true;
        } catch (error) {
            console.error('Vault connection failed:', error.message);
            return false;
        }
    }

    /**
     * Store network device credentials securely
     */
    async storeDeviceCredentials(deviceId, credentials) {
        try {
            const encryptedCredentials = this.encryptCredentials(credentials);
            
            await this.vault.write(`${this.networkDevicesPath}/${deviceId}`, {
                host: credentials.host,
                port: credentials.port,
                username: credentials.username,
                encrypted_password: encryptedCredentials.password,
                encrypted_enable_password: encryptedCredentials.enablePassword,
                device_type: credentials.deviceType,
                last_updated: new Date().toISOString()
            });
            
            console.log(`Device credentials stored for ${deviceId}`);
            return true;
        } catch (error) {
            console.error('Failed to store device credentials:', error.message);
            return false;
        }
    }

    /**
     * Retrieve network device credentials
     */
    async getDeviceCredentials(deviceId) {
        try {
            const response = await this.vault.read(`${this.networkDevicesPath}/${deviceId}`);
            const credentials = response.data;
            
            return {
                host: credentials.host,
                port: credentials.port,
                username: credentials.username,
                password: this.decryptCredentials(credentials.encrypted_password),
                enablePassword: credentials.encrypted_enable_password ? 
                    this.decryptCredentials(credentials.encrypted_enable_password) : null,
                deviceType: credentials.device_type
            };
        } catch (error) {
            console.error(`Failed to retrieve credentials for ${deviceId}:`, error.message);
            return null;
        }
    }

    /**
     * Store API keys securely
     */
    async storeApiKey(serviceName, apiKey) {
        try {
            const encryptedKey = this.encryptCredentials({ key: apiKey });
            
            await this.vault.write(`${this.apiKeysPath}/${serviceName}`, {
                encrypted_key: encryptedKey.key,
                service_name: serviceName,
                created_at: new Date().toISOString(),
                last_used: null
            });
            
            console.log(`API key stored for ${serviceName}`);
            return true;
        } catch (error) {
            console.error('Failed to store API key:', error.message);
            return false;
        }
    }

    /**
     * Retrieve API key
     */
    async getApiKey(serviceName) {
        try {
            const response = await this.vault.read(`${this.apiKeysPath}/${serviceName}`);
            const apiKeyData = response.data;
            
            // Update last used timestamp
            await this.vault.write(`${this.apiKeysPath}/${serviceName}`, {
                ...apiKeyData,
                last_used: new Date().toISOString()
            });
            
            return this.decryptCredentials(apiKeyData.encrypted_key);
        } catch (error) {
            console.error(`Failed to retrieve API key for ${serviceName}:`, error.message);
            return null;
        }
    }

    /**
     * Store application secrets
     */
    async storeSecret(key, value, metadata = {}) {
        try {
            const encryptedValue = this.encryptCredentials({ value });
            
            await this.vault.write(`${this.secretsPath}/${key}`, {
                encrypted_value: encryptedValue.value,
                metadata: JSON.stringify(metadata),
                created_at: new Date().toISOString()
            });
            
            console.log(`Secret stored: ${key}`);
            return true;
        } catch (error) {
            console.error('Failed to store secret:', error.message);
            return false;
        }
    }

    /**
     * Retrieve application secret
     */
    async getSecret(key) {
        try {
            const response = await this.vault.read(`${this.secretsPath}/${key}`);
            const secretData = response.data;
            
            return {
                value: this.decryptCredentials(secretData.encrypted_value),
                metadata: JSON.parse(secretData.metadata || '{}'),
                createdAt: secretData.created_at
            };
        } catch (error) {
            console.error(`Failed to retrieve secret ${key}:`, error.message);
            return null;
        }
    }

    /**
     * Generate dynamic credentials for temporary access
     */
    async generateDynamicCredentials(deviceId, duration = '1h') {
        try {
            const credentials = await this.getDeviceCredentials(deviceId);
            if (!credentials) {
                throw new Error('Device credentials not found');
            }
            
            // Generate temporary credentials
            const tempUsername = `temp_${deviceId}_${Date.now()}`;
            const tempPassword = this.generateSecurePassword();
            
            // Store temporary credentials
            await this.vault.write(`${this.networkDevicesPath}/temp/${deviceId}`, {
                host: credentials.host,
                port: credentials.port,
                username: tempUsername,
                password: tempPassword,
                expires_at: new Date(Date.now() + this.parseDuration(duration)).toISOString(),
                original_device_id: deviceId
            });
            
            return {
                host: credentials.host,
                port: credentials.port,
                username: tempUsername,
                password: tempPassword,
                expiresAt: new Date(Date.now() + this.parseDuration(duration)).toISOString()
            };
        } catch (error) {
            console.error('Failed to generate dynamic credentials:', error.message);
            return null;
        }
    }

    /**
     * Encrypt sensitive data
     */
    encryptCredentials(data) {
        const algorithm = 'aes-256-gcm';
        const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-32-chars-long', 'utf8');
        
        const encrypted = {};
        
        for (const [keyName, value] of Object.entries(data)) {
            if (value) {
                const iv = crypto.randomBytes(16);
                const cipher = crypto.createCipher(algorithm, key);
                cipher.setAAD(Buffer.from(keyName));
                
                let encryptedValue = cipher.update(value, 'utf8', 'hex');
                encryptedValue += cipher.final('hex');
                
                const authTag = cipher.getAuthTag();
                
                encrypted[keyName] = {
                    encrypted: encryptedValue,
                    iv: iv.toString('hex'),
                    authTag: authTag.toString('hex')
                };
            }
        }
        
        return encrypted;
    }

    /**
     * Decrypt sensitive data
     */
    decryptCredentials(encryptedData) {
        if (!encryptedData || typeof encryptedData === 'string') {
            return encryptedData;
        }
        
        const algorithm = 'aes-256-gcm';
        const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-32-chars-long', 'utf8');
        
        const decrypted = {};
        
        for (const [keyName, encryptedValue] of Object.entries(encryptedData)) {
            if (encryptedValue && encryptedValue.encrypted) {
                const decipher = crypto.createDecipher(algorithm, key);
                decipher.setAAD(Buffer.from(keyName));
                decipher.setAuthTag(Buffer.from(encryptedValue.authTag, 'hex'));
                
                let decryptedValue = decipher.update(encryptedValue.encrypted, 'hex', 'utf8');
                decryptedValue += decipher.final('utf8');
                
                decrypted[keyName] = decryptedValue;
            }
        }
        
        return decrypted.value || decrypted.password || decrypted.key || decrypted;
    }

    /**
     * Generate secure password
     */
    generateSecurePassword(length = 16) {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';
        
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        
        return password;
    }

    /**
     * Parse duration string to milliseconds
     */
    parseDuration(duration) {
        const units = {
            's': 1000,
            'm': 60 * 1000,
            'h': 60 * 60 * 1000,
            'd': 24 * 60 * 60 * 1000
        };
        
        const match = duration.match(/^(\d+)([smhd])$/);
        if (match) {
            const value = parseInt(match[1]);
            const unit = match[2];
            return value * units[unit];
        }
        
        return 60 * 60 * 1000; // Default to 1 hour
    }

    /**
     * List all stored secrets
     */
    async listSecrets() {
        try {
            const response = await this.vault.list(this.secretsPath);
            return response.data.keys || [];
        } catch (error) {
            console.error('Failed to list secrets:', error.message);
            return [];
        }
    }

    /**
     * Delete a secret
     */
    async deleteSecret(key) {
        try {
            await this.vault.delete(`${this.secretsPath}/${key}`);
            console.log(`Secret deleted: ${key}`);
            return true;
        } catch (error) {
            console.error(`Failed to delete secret ${key}:`, error.message);
            return false;
        }
    }

    /**
     * Rotate API keys
     */
    async rotateApiKey(serviceName, newApiKey) {
        try {
            // Store new key
            await this.storeApiKey(`${serviceName}_new`, newApiKey);
            
            // Update service to use new key
            await this.vault.write(`${this.apiKeysPath}/${serviceName}`, {
                encrypted_key: this.encryptCredentials({ key: newApiKey }).key,
                service_name: serviceName,
                rotated_at: new Date().toISOString()
            });
            
            console.log(`API key rotated for ${serviceName}`);
            return true;
        } catch (error) {
            console.error('Failed to rotate API key:', error.message);
            return false;
        }
    }
}

export default VaultService; 