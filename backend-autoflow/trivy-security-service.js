import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

class TrivySecurityService {
    constructor() {
        this.scanResults = [];
        this.lastScanTime = null;
    }

    /**
     * Run Trivy vulnerability scan on the application
     */
    async runVulnerabilityScan() {
        try {
            console.log('Starting Trivy vulnerability scan...');
            
            // Scan container images
            await this.scanContainerImages();
            
            // Scan filesystem
            await this.scanFilesystem();
            
            // Scan dependencies
            await this.scanDependencies();
            
            // Scan secrets
            await this.scanSecrets();
            
            this.lastScanTime = new Date();
            console.log('Trivy scan completed successfully');
            
            return {
                success: true,
                timestamp: this.lastScanTime,
                results: this.scanResults
            };
        } catch (error) {
            console.error('Trivy scan failed:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date()
            };
        }
    }

    /**
     * Scan container images for vulnerabilities
     */
    async scanContainerImages() {
        try {
            const { stdout } = await execAsync('trivy image --format json backend-autoflow:latest');
            const results = JSON.parse(stdout);
            
            this.scanResults.push({
                type: 'container',
                image: 'backend-autoflow:latest',
                vulnerabilities: results.Results || [],
                timestamp: new Date()
            });
            
            console.log(`Container scan completed: ${results.Results?.length || 0} vulnerabilities found`);
        } catch (error) {
            console.error('Container scan failed:', error.message);
        }
    }

    /**
     * Scan filesystem for vulnerabilities
     */
    async scanFilesystem() {
        try {
            const { stdout } = await execAsync('trivy fs --format json .');
            const results = JSON.parse(stdout);
            
            this.scanResults.push({
                type: 'filesystem',
                vulnerabilities: results.Results || [],
                timestamp: new Date()
            });
            
            console.log(`Filesystem scan completed: ${results.Results?.length || 0} vulnerabilities found`);
        } catch (error) {
            console.error('Filesystem scan failed:', error.message);
        }
    }

    /**
     * Scan dependencies for vulnerabilities
     */
    async scanDependencies() {
        try {
            // Scan Node.js dependencies
            if (fs.existsSync('package.json')) {
                const { stdout } = await execAsync('trivy fs --format json .');
                const results = JSON.parse(stdout);
                
                this.scanResults.push({
                    type: 'dependencies',
                    language: 'nodejs',
                    vulnerabilities: results.Results || [],
                    timestamp: new Date()
                });
            }
            
            // Scan Python dependencies
            if (fs.existsSync('requirements.txt')) {
                const { stdout } = await execAsync('trivy fs --format json .');
                const results = JSON.parse(stdout);
                
                this.scanResults.push({
                    type: 'dependencies',
                    language: 'python',
                    vulnerabilities: results.Results || [],
                    timestamp: new Date()
                });
            }
        } catch (error) {
            console.error('Dependencies scan failed:', error.message);
        }
    }

    /**
     * Scan for secrets and sensitive data
     */
    async scanSecrets() {
        try {
            const { stdout } = await execAsync('trivy secret --format json .');
            const results = JSON.parse(stdout);
            
            this.scanResults.push({
                type: 'secrets',
                findings: results.Results || [],
                timestamp: new Date()
            });
            
            console.log(`Secrets scan completed: ${results.Results?.length || 0} findings`);
        } catch (error) {
            console.error('Secrets scan failed:', error.message);
        }
    }

    /**
     * Get scan results summary
     */
    getScanSummary() {
        const summary = {
            totalVulnerabilities: 0,
            criticalVulnerabilities: 0,
            highVulnerabilities: 0,
            mediumVulnerabilities: 0,
            lowVulnerabilities: 0,
            secretsFound: 0,
            lastScanTime: this.lastScanTime
        };

        this.scanResults.forEach(result => {
            if (result.vulnerabilities) {
                result.vulnerabilities.forEach(vuln => {
                    summary.totalVulnerabilities++;
                    switch (vuln.Severity) {
                        case 'CRITICAL':
                            summary.criticalVulnerabilities++;
                            break;
                        case 'HIGH':
                            summary.highVulnerabilities++;
                            break;
                        case 'MEDIUM':
                            summary.mediumVulnerabilities++;
                            break;
                        case 'LOW':
                            summary.lowVulnerabilities++;
                            break;
                    }
                });
            }
            
            if (result.type === 'secrets' && result.findings) {
                summary.secretsFound += result.findings.length;
            }
        });

        return summary;
    }

    /**
     * Generate security report
     */
    generateSecurityReport() {
        const summary = this.getScanSummary();
        
        return {
            report: {
                title: 'AutoFlow Security Scan Report',
                timestamp: new Date(),
                summary: summary,
                recommendations: this.generateRecommendations(summary),
                details: this.scanResults
            }
        };
    }

    /**
     * Generate security recommendations based on scan results
     */
    generateRecommendations(summary) {
        const recommendations = [];
        
        if (summary.criticalVulnerabilities > 0) {
            recommendations.push({
                priority: 'CRITICAL',
                action: 'Immediately patch critical vulnerabilities',
                description: `${summary.criticalVulnerabilities} critical vulnerabilities found that require immediate attention`
            });
        }
        
        if (summary.highVulnerabilities > 0) {
            recommendations.push({
                priority: 'HIGH',
                action: 'Update dependencies with high severity vulnerabilities',
                description: `${summary.highVulnerabilities} high severity vulnerabilities found`
            });
        }
        
        if (summary.secretsFound > 0) {
            recommendations.push({
                priority: 'HIGH',
                action: 'Review and remove exposed secrets',
                description: `${summary.secretsFound} potential secrets found in codebase`
            });
        }
        
        if (summary.totalVulnerabilities === 0) {
            recommendations.push({
                priority: 'INFO',
                action: 'No vulnerabilities found',
                description: 'Current codebase appears to be secure'
            });
        }
        
        return recommendations;
    }

    /**
     * Schedule regular security scans
     */
    scheduleRegularScans(intervalHours = 24) {
        setInterval(async () => {
            console.log('Running scheduled Trivy security scan...');
            await this.runVulnerabilityScan();
        }, intervalHours * 60 * 60 * 1000);
    }
}

export default TrivySecurityService; 