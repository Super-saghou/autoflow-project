import express from 'express';
import EnhancedSecurityIntegration from './enhanced-security-integration.js';
import TrivySecurityService from './trivy-security-service.js';
import VaultService from './vault-integration.js';

const router = express.Router();
const securityIntegration = new EnhancedSecurityIntegration();
const trivyService = new TrivySecurityService();
const vaultService = new VaultService();

// Initialize security services
securityIntegration.initialize();

/**
 * Get security dashboard overview
 */
router.get('/dashboard/overview', async (req, res) => {
    try {
        const dashboardData = securityIntegration.getSecurityDashboardData();
        
        res.json({
            success: true,
            data: {
                ...dashboardData,
                lastUpdated: new Date(),
                systemStatus: {
                    trivy: dashboardData.trivySummary ? 'active' : 'inactive',
                    vault: await vaultService.initialize() ? 'active' : 'inactive',
                    sonarqube: 'configured',
                    aiAgent: 'active'
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Run comprehensive security scan
 */
router.post('/scan/comprehensive', async (req, res) => {
    try {
        const assessment = await securityIntegration.runComprehensiveSecurityAssessment();
        
        res.json({
            success: true,
            data: assessment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get Trivy scan results
 */
router.get('/scan/trivy', async (req, res) => {
    try {
        const summary = trivyService.getScanSummary();
        const lastScan = trivyService.lastScanTime;
        
        res.json({
            success: true,
            data: {
                summary,
                lastScan,
                recommendations: trivyService.generateSecurityReport().report.recommendations
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get Vault secrets audit
 */
router.get('/vault/audit', async (req, res) => {
    try {
        const audit = await securityIntegration.auditVaultSecrets();
        
        res.json({
            success: true,
            data: audit
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get security alerts
 */
router.get('/alerts', async (req, res) => {
    try {
        const alerts = securityIntegration.securityAlerts;
        
        res.json({
            success: true,
            data: {
                alerts,
                totalAlerts: alerts.length,
                criticalAlerts: alerts.filter(a => a.priority === 'CRITICAL').length,
                highAlerts: alerts.filter(a => a.priority === 'HIGH').length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get security recommendations
 */
router.get('/recommendations', async (req, res) => {
    try {
        const dashboardData = securityIntegration.getSecurityDashboardData();
        
        res.json({
            success: true,
            data: {
                recommendations: dashboardData.recommendations,
                priorityBreakdown: {
                    critical: dashboardData.recommendations.filter(r => r.priority === 'CRITICAL').length,
                    high: dashboardData.recommendations.filter(r => r.priority === 'HIGH').length,
                    medium: dashboardData.recommendations.filter(r => r.priority === 'MEDIUM').length,
                    low: dashboardData.recommendations.filter(r => r.priority === 'LOW').length
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get security metrics
 */
router.get('/metrics', async (req, res) => {
    try {
        const dashboardData = securityIntegration.getSecurityDashboardData();
        const trivySummary = dashboardData.trivySummary;
        
        const metrics = {
            securityScore: dashboardData.securityScore,
            vulnerabilityCount: {
                critical: trivySummary?.criticalVulnerabilities || 0,
                high: trivySummary?.highVulnerabilities || 0,
                medium: trivySummary?.mediumVulnerabilities || 0,
                low: trivySummary?.lowVulnerabilities || 0,
                total: trivySummary?.totalVulnerabilities || 0
            },
            secretsFound: trivySummary?.secretsFound || 0,
            lastScanTime: dashboardData.lastScan?.timestamp || null,
            scanFrequency: '24h',
            systemUptime: process.uptime()
        };
        
        res.json({
            success: true,
            data: metrics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get security configuration
 */
router.get('/config', async (req, res) => {
    try {
        const config = {
            trivy: {
                enabled: true,
                scanFrequency: '6h',
                severityThreshold: 'MEDIUM',
                failOnHigh: true
            },
            vault: {
                enabled: await vaultService.initialize(),
                secretsRotation: '30d',
                encryptionEnabled: true
            },
            sonarqube: {
                enabled: true,
                qualityGate: 'pass',
                coverageThreshold: 80
            },
            aiSecurity: {
                enabled: true,
                analysisFrequency: '1h',
                threatDetection: true
            },
            kubernetes: {
                networkPolicies: true,
                podSecurityPolicies: true,
                admissionWebhooks: true
            }
        };
        
        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Update security configuration
 */
router.put('/config', async (req, res) => {
    try {
        const { config } = req.body;
        
        // Validate configuration
        if (!config) {
            return res.status(400).json({
                success: false,
                error: 'Configuration is required'
            });
        }
        
        // Store configuration in Vault
        await vaultService.storeSecret('security_config', JSON.stringify(config), {
            type: 'configuration',
            updatedAt: new Date().toISOString()
        });
        
        res.json({
            success: true,
            message: 'Security configuration updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get security logs
 */
router.get('/logs', async (req, res) => {
    try {
        const { type = 'all', limit = 100 } = req.query;
        
        let logs = [];
        
        if (type === 'all' || type === 'security') {
            // Read security logs
            const fs = await import('fs');
            const securityLogs = fs.readFileSync('ai_security_agent.log', 'utf8')
                .split('\n')
                .filter(line => line.trim())
                .slice(-limit);
            
            logs.push(...securityLogs.map(log => ({
                type: 'security',
                message: log,
                timestamp: new Date()
            })));
        }
        
        if (type === 'all' || type === 'audit') {
            // Read audit logs
            const fs = await import('fs');
            const auditLogs = fs.readFileSync('audit.log', 'utf8')
                .split('\n')
                .filter(line => line.trim())
                .slice(-limit);
            
            logs.push(...auditLogs.map(log => ({
                type: 'audit',
                message: log,
                timestamp: new Date()
            })));
        }
        
        // Sort by timestamp
        logs.sort((a, b) => b.timestamp - a.timestamp);
        
        res.json({
            success: true,
            data: {
                logs: logs.slice(0, limit),
                totalLogs: logs.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Export security report
 */
router.get('/report/export', async (req, res) => {
    try {
        const { format = 'json' } = req.query;
        
        const dashboardData = securityIntegration.getSecurityDashboardData();
        const assessment = await securityIntegration.runComprehensiveSecurityAssessment();
        
        const report = {
            title: 'AutoFlow Security Report',
            generatedAt: new Date(),
            summary: {
                securityScore: assessment.overallScore,
                vulnerabilities: dashboardData.trivySummary,
                recommendations: assessment.recommendations
            },
            details: assessment,
            metadata: {
                version: '1.0',
                generatedBy: 'AutoFlow Security Integration'
            }
        };
        
        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename="autoflow-security-report.json"');
            res.json(report);
        } else {
            res.status(400).json({
                success: false,
                error: 'Unsupported format. Use "json"'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router; 