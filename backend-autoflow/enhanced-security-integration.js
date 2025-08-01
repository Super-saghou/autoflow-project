import TrivySecurityService from './trivy-security-service.js';
import VaultService from './vault-integration.js';
import { spawn } from 'child_process';

class EnhancedSecurityIntegration {
    constructor() {
        this.trivyService = new TrivySecurityService();
        this.vaultService = new VaultService();
        this.securityAlerts = [];
        this.lastComprehensiveScan = null;
    }

    /**
     * Initialize all security services
     */
    async initialize() {
        console.log('Initializing enhanced security integration...');
        
        // Initialize Vault
        const vaultInitialized = await this.vaultService.initialize();
        if (!vaultInitialized) {
            console.warn('Vault not available, using fallback security');
        }
        
        // Schedule regular security scans
        this.scheduleSecurityScans();
        
        console.log('Enhanced security integration initialized');
    }

    /**
     * Run comprehensive security assessment
     */
    async runComprehensiveSecurityAssessment() {
        console.log('Starting comprehensive security assessment...');
        
        const assessment = {
            timestamp: new Date(),
            trivyScan: null,
            sonarQubeScan: null,
            vaultAudit: null,
            aiSecurityAnalysis: null,
            overallScore: 0,
            recommendations: []
        };

        try {
            // Run Trivy vulnerability scan
            assessment.trivyScan = await this.trivyService.runVulnerabilityScan();
            
            // Run SonarQube code analysis
            assessment.sonarQubeScan = await this.runSonarQubeAnalysis();
            
            // Audit Vault secrets
            assessment.vaultAudit = await this.auditVaultSecrets();
            
            // Run AI security analysis
            assessment.aiSecurityAnalysis = await this.runAISecurityAnalysis();
            
            // Calculate overall security score
            assessment.overallScore = this.calculateSecurityScore(assessment);
            
            // Generate recommendations
            assessment.recommendations = this.generateSecurityRecommendations(assessment);
            
            this.lastComprehensiveScan = assessment;
            
            // Store assessment results
            await this.storeSecurityAssessment(assessment);
            
            console.log(`Security assessment completed. Score: ${assessment.overallScore}/100`);
            
            return assessment;
        } catch (error) {
            console.error('Security assessment failed:', error);
            return { ...assessment, error: error.message };
        }
    }

    /**
     * Run SonarQube analysis
     */
    async runSonarQubeAnalysis() {
        return new Promise((resolve, reject) => {
            const sonarScanner = spawn('sonar-scanner', [
                '-Dsonar.projectKey=autoflow',
                '-Dsonar.projectName=AutoFlow',
                '-Dsonar.projectVersion=1.0',
                '-Dsonar.sources=.',
                '-Dsonar.exclusions=node_modules/**,venv/**,__pycache__/**,*.pyc',
                '-Dsonar.host.url=http://localhost:9000',
                '-Dsonar.login=admin',
                '-Dsonar.password=admin'
            ]);

            let output = '';
            let errorOutput = '';

            sonarScanner.stdout.on('data', (data) => {
                output += data.toString();
            });

            sonarScanner.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            sonarScanner.on('close', (code) => {
                if (code === 0) {
                    resolve({
                        success: true,
                        output: output,
                        timestamp: new Date()
                    });
                } else {
                    resolve({
                        success: false,
                        error: errorOutput,
                        timestamp: new Date()
                    });
                }
            });
        });
    }

    /**
     * Audit Vault secrets
     */
    async auditVaultSecrets() {
        try {
            const secrets = await this.vaultService.listSecrets();
            const audit = {
                totalSecrets: secrets.length,
                secretsWithMetadata: 0,
                expiredSecrets: 0,
                weakSecrets: 0,
                recommendations: []
            };

            for (const secretKey of secrets) {
                const secret = await this.vaultService.getSecret(secretKey);
                if (secret) {
                    if (secret.metadata) audit.secretsWithMetadata++;
                    if (this.isWeakSecret(secret.value)) audit.weakSecrets++;
                    if (this.isExpiredSecret(secret)) audit.expiredSecrets++;
                }
            }

            // Generate recommendations
            if (audit.weakSecrets > 0) {
                audit.recommendations.push('Strengthen weak secrets');
            }
            if (audit.expiredSecrets > 0) {
                audit.recommendations.push('Rotate expired secrets');
            }

            return audit;
        } catch (error) {
            return {
                error: error.message,
                timestamp: new Date()
            };
        }
    }

    /**
     * Run AI security analysis
     */
    async runAISecurityAnalysis() {
        try {
            const pythonProcess = spawn('python3', ['ai_security_agent.py', '--analysis']);
            
            return new Promise((resolve, reject) => {
                let output = '';
                
                pythonProcess.stdout.on('data', (data) => {
                    output += data.toString();
                });
                
                pythonProcess.stderr.on('data', (data) => {
                    console.error(`AI Security Agent error: ${data}`);
                });
                
                pythonProcess.on('close', (code) => {
                    try {
                        const analysis = JSON.parse(output);
                        resolve(analysis);
                    } catch (e) {
                        resolve({
                            success: false,
                            error: 'Failed to parse AI analysis',
                            rawOutput: output
                        });
                    }
                });
            });
        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date()
            };
        }
    }

    /**
     * Calculate overall security score
     */
    calculateSecurityScore(assessment) {
        let score = 100;
        
        // Deduct points for vulnerabilities
        if (assessment.trivyScan && assessment.trivyScan.success) {
            const summary = assessment.trivyService.getScanSummary();
            score -= summary.criticalVulnerabilities * 20;
            score -= summary.highVulnerabilities * 10;
            score -= summary.mediumVulnerabilities * 5;
            score -= summary.lowVulnerabilities * 1;
        }
        
        // Deduct points for Vault issues
        if (assessment.vaultAudit && !assessment.vaultAudit.error) {
            score -= assessment.vaultAudit.weakSecrets * 5;
            score -= assessment.vaultAudit.expiredSecrets * 3;
        }
        
        // Deduct points for SonarQube issues
        if (assessment.sonarQubeScan && !assessment.sonarQubeScan.success) {
            score -= 10;
        }
        
        return Math.max(0, Math.min(100, score));
    }

    /**
     * Generate security recommendations
     */
    generateSecurityRecommendations(assessment) {
        const recommendations = [];
        
        // Trivy recommendations
        if (assessment.trivyScan && assessment.trivyScan.success) {
            const summary = assessment.trivyService.getScanSummary();
            if (summary.criticalVulnerabilities > 0) {
                recommendations.push({
                    priority: 'CRITICAL',
                    action: 'Patch critical vulnerabilities immediately',
                    description: `${summary.criticalVulnerabilities} critical vulnerabilities found`
                });
            }
            if (summary.secretsFound > 0) {
                recommendations.push({
                    priority: 'HIGH',
                    action: 'Remove exposed secrets from codebase',
                    description: `${summary.secretsFound} secrets found in code`
                });
            }
        }
        
        // Vault recommendations
        if (assessment.vaultAudit && !assessment.vaultAudit.error) {
            if (assessment.vaultAudit.weakSecrets > 0) {
                recommendations.push({
                    priority: 'HIGH',
                    action: 'Strengthen weak secrets in Vault',
                    description: `${assessment.vaultAudit.weakSecrets} weak secrets detected`
                });
            }
            if (assessment.vaultAudit.expiredSecrets > 0) {
                recommendations.push({
                    priority: 'MEDIUM',
                    action: 'Rotate expired secrets',
                    description: `${assessment.vaultAudit.expiredSecrets} expired secrets found`
                });
            }
        }
        
        // SonarQube recommendations
        if (assessment.sonarQubeScan && !assessment.sonarQubeScan.success) {
            recommendations.push({
                priority: 'MEDIUM',
                action: 'Fix SonarQube analysis issues',
                description: 'Code quality analysis failed'
            });
        }
        
        return recommendations;
    }

    /**
     * Store security assessment results
     */
    async storeSecurityAssessment(assessment) {
        try {
            await this.vaultService.storeSecret('security_assessment', JSON.stringify(assessment), {
                type: 'security_assessment',
                score: assessment.overallScore,
                timestamp: assessment.timestamp.toISOString()
            });
        } catch (error) {
            console.error('Failed to store security assessment:', error);
        }
    }

    /**
     * Check if secret is weak
     */
    isWeakSecret(secret) {
        if (!secret || typeof secret !== 'string') return false;
        
        // Check length
        if (secret.length < 12) return true;
        
        // Check complexity
        const hasUpperCase = /[A-Z]/.test(secret);
        const hasLowerCase = /[a-z]/.test(secret);
        const hasNumbers = /\d/.test(secret);
        const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(secret);
        
        return !(hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChars);
    }

    /**
     * Check if secret is expired
     */
    isExpiredSecret(secret) {
        if (!secret.metadata || !secret.metadata.expiresAt) return false;
        
        const expiresAt = new Date(secret.metadata.expiresAt);
        return expiresAt < new Date();
    }

    /**
     * Schedule regular security scans
     */
    scheduleSecurityScans() {
        // Run comprehensive scan every 24 hours
        setInterval(async () => {
            console.log('Running scheduled comprehensive security scan...');
            await this.runComprehensiveSecurityAssessment();
        }, 24 * 60 * 60 * 1000);
        
        // Run Trivy scan every 6 hours
        setInterval(async () => {
            console.log('Running scheduled Trivy scan...');
            await this.trivyService.runVulnerabilityScan();
        }, 6 * 60 * 60 * 1000);
    }

    /**
     * Get security dashboard data
     */
    getSecurityDashboardData() {
        return {
            lastScan: this.lastComprehensiveScan,
            trivySummary: this.trivyService.getScanSummary(),
            securityScore: this.lastComprehensiveScan?.overallScore || 0,
            recommendations: this.lastComprehensiveScan?.recommendations || [],
            alerts: this.securityAlerts
        };
    }

    /**
     * Add security alert
     */
    addSecurityAlert(alert) {
        this.securityAlerts.push({
            ...alert,
            timestamp: new Date(),
            id: Date.now().toString()
        });
        
        // Keep only last 100 alerts
        if (this.securityAlerts.length > 100) {
            this.securityAlerts = this.securityAlerts.slice(-100);
        }
    }
}

export default EnhancedSecurityIntegration; 