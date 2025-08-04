// Frontend Enhancement for "Agent" Section
// Add this to your existing Agent section in the frontend

class AIAgentEnhancement {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5007/api/ai-agent';
        this.isProcessing = false;
        this.executionHistory = [];
        
        // Initialize the enhancement
        this.init();
    }

    init() {
        // Add AI agent functionality to existing Agent section
        this.addAIAgentUI();
        this.bindEvents();
        this.loadExecutionHistory();
    }

    addAIAgentUI() {
        // Find the existing Agent section
        const agentSection = document.querySelector('[data-section="agent"]') || 
                           document.querySelector('.agent-section') ||
                           document.getElementById('agent-section');
        
        if (!agentSection) {
            console.error('Agent section not found');
            return;
        }

        // Add AI agent controls
        const aiControls = `
            <div class="ai-agent-controls" style="margin-top: 20px; padding: 20px; border: 2px solid #007bff; border-radius: 8px; background: #f8f9fa;">
                <h4 style="color: #007bff; margin-bottom: 15px;">
                    🤖 AI Agent Controls
                </h4>
                
                <div class="form-group">
                    <label for="aiRequestInput" style="font-weight: bold;">AI Agent Request:</label>
                    <textarea 
                        id="aiRequestInput" 
                        class="form-control" 
                        rows="3" 
                        placeholder="Enter your network configuration request (e.g., 'i wanna create a vlan 8 named Test8 on switch1 192.168.111.198')"
                        style="margin-bottom: 10px;"
                    ></textarea>
                </div>
                
                <div class="btn-group" style="margin-bottom: 15px;">
                    <button id="sendAIRequest" class="btn btn-primary" style="margin-right: 10px;">
                        🚀 Send to AI Agent
                    </button>
                    <button id="sendCrewAIRequest" class="btn btn-success" style="margin-right: 10px;">
                        🤖 Send to CrewAI
                    </button>
                    <button id="testAIAgent" class="btn btn-info">
                        🧪 Test AI Agent
                    </button>
                </div>
                
                <div id="aiAgentStatus" class="alert alert-info" style="display: none;">
                    <strong>Status:</strong> <span id="statusText">Ready</span>
                </div>
                
                <div id="aiAgentResult" class="mt-3" style="display: none;">
                    <h5 style="color: #28a745;">📊 AI Agent Results:</h5>
                    <div id="resultContent" style="background: white; padding: 15px; border-radius: 5px; border: 1px solid #ddd;">
                    </div>
                </div>
                
                <div id="aiAgentLogs" class="mt-3" style="display: none;">
                    <h5 style="color: #17a2b8;">📝 Execution Logs:</h5>
                    <pre id="logsContent" style="background: #f8f9fa; padding: 10px; border-radius: 5px; font-size: 12px; max-height: 200px; overflow-y: auto;">
                    </pre>
                </div>
                
                <div class="mt-3">
                    <button id="showHistory" class="btn btn-secondary btn-sm">
                        📋 Show Execution History
                    </button>
                    <button id="clearHistory" class="btn btn-warning btn-sm" style="margin-left: 10px;">
                        🗑️ Clear History
                    </button>
                </div>
                
                <div id="executionHistory" class="mt-3" style="display: none;">
                    <h5 style="color: #6c757d;">📋 Execution History:</h5>
                    <div id="historyContent" style="max-height: 300px; overflow-y: auto;">
                    </div>
                </div>
            </div>
        `;

        // Insert AI controls into the Agent section
        agentSection.insertAdjacentHTML('beforeend', aiControls);
    }

    bindEvents() {
        // Bind button events
        document.getElementById('sendAIRequest')?.addEventListener('click', () => this.sendAIRequest());
        document.getElementById('sendCrewAIRequest')?.addEventListener('click', () => this.sendCrewAIRequest());
        document.getElementById('testAIAgent')?.addEventListener('click', () => this.testAIAgent());
        document.getElementById('showHistory')?.addEventListener('click', () => this.toggleHistory());
        document.getElementById('clearHistory')?.addEventListener('click', () => this.clearHistory());
    }

    async sendAIRequest() {
        const requestInput = document.getElementById('aiRequestInput');
        const request = requestInput.value.trim();
        
        if (!request) {
            this.showAlert('Please enter a request', 'warning');
            return;
        }

        this.setProcessing(true);
        this.showStatus('Processing request with AI Agent...', 'info');

        try {
            const response = await fetch(`${this.apiBaseUrl}/process-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ request })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showStatus('✅ AI Agent request completed successfully!', 'success');
                this.displayResult(result);
                this.displayLogs(result.logs);
                this.addToHistory(result);
            } else {
                this.showStatus(`❌ AI Agent request failed: ${result.error}`, 'danger');
            }
        } catch (error) {
            this.showStatus(`❌ Error: ${error.message}`, 'danger');
        } finally {
            this.setProcessing(false);
        }
    }

    async sendCrewAIRequest() {
        const requestInput = document.getElementById('aiRequestInput');
        const request = requestInput.value.trim();
        
        if (!request) {
            this.showAlert('Please enter a request', 'warning');
            return;
        }

        this.setProcessing(true);
        this.showStatus('Processing request with CrewAI orchestration...', 'info');

        try {
            const response = await fetch(`${this.apiBaseUrl}/process-request-crewai`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ request })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showStatus('✅ CrewAI orchestration completed successfully!', 'success');
                this.displayResult(result);
                this.addToHistory(result);
            } else {
                this.showStatus(`❌ CrewAI request failed: ${result.error}`, 'danger');
            }
        } catch (error) {
            this.showStatus(`❌ Error: ${error.message}`, 'danger');
        } finally {
            this.setProcessing(false);
        }
    }

    async testAIAgent() {
        this.setProcessing(true);
        this.showStatus('Testing AI Agent...', 'info');

        try {
            const response = await fetch(`${this.apiBaseUrl}/test`);
            const result = await response.json();
            
            if (result.success) {
                this.showStatus('✅ AI Agent test completed successfully!', 'success');
                this.displayResult(result);
            } else {
                this.showStatus(`❌ AI Agent test failed: ${result.error}`, 'danger');
            }
        } catch (error) {
            this.showStatus(`❌ Test error: ${error.message}`, 'danger');
        } finally {
            this.setProcessing(false);
        }
    }

    displayResult(result) {
        const resultDiv = document.getElementById('aiAgentResult');
        const contentDiv = document.getElementById('resultContent');
        
        let content = `
            <div style="font-family: monospace;">
                <p><strong>Request:</strong> ${result.request}</p>
                <p><strong>Timestamp:</strong> ${result.timestamp}</p>
                <p><strong>Agent Type:</strong> ${result.agent_type}</p>
                <p><strong>Success:</strong> ${result.success ? '✅ Yes' : '❌ No'}</p>
        `;
        
        if (result.details) {
            content += `<p><strong>Details:</strong></p><pre>${JSON.stringify(result.details, null, 2)}</pre>`;
        }
        
        if (result.error) {
            content += `<p><strong>Error:</strong> ${result.error}</p>`;
        }
        
        content += '</div>';
        
        contentDiv.innerHTML = content;
        resultDiv.style.display = 'block';
    }

    displayLogs(logs) {
        const logsDiv = document.getElementById('aiAgentLogs');
        const logsContent = document.getElementById('logsContent');
        
        let logText = '';
        if (logs.stdout) {
            logText += `STDOUT:\n${logs.stdout}\n\n`;
        }
        if (logs.stderr) {
            logText += `STDERR:\n${logs.stderr}\n`;
        }
        
        if (logText) {
            logsContent.textContent = logText;
            logsDiv.style.display = 'block';
        }
    }

    showStatus(message, type) {
        const statusDiv = document.getElementById('aiAgentStatus');
        const statusText = document.getElementById('statusText');
        
        statusText.textContent = message;
        statusDiv.className = `alert alert-${type}`;
        statusDiv.style.display = 'block';
    }

    setProcessing(processing) {
        this.isProcessing = processing;
        const buttons = ['sendAIRequest', 'sendCrewAIRequest', 'testAIAgent'];
        
        buttons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.disabled = processing;
                button.textContent = processing ? '⏳ Processing...' : button.textContent.replace('⏳ Processing...', '');
            }
        });
    }

    addToHistory(result) {
        this.executionHistory.unshift({
            timestamp: result.timestamp,
            request: result.request,
            success: result.success,
            agent_type: result.agent_type
        });
        
        // Keep only last 10 entries
        if (this.executionHistory.length > 10) {
            this.executionHistory = this.executionHistory.slice(0, 10);
        }
        
        localStorage.setItem('aiAgentHistory', JSON.stringify(this.executionHistory));
    }

    loadExecutionHistory() {
        const saved = localStorage.getItem('aiAgentHistory');
        if (saved) {
            this.executionHistory = JSON.parse(saved);
        }
    }

    toggleHistory() {
        const historyDiv = document.getElementById('executionHistory');
        const historyContent = document.getElementById('historyContent');
        
        if (historyDiv.style.display === 'none') {
            let content = '';
            this.executionHistory.forEach((entry, index) => {
                content += `
                    <div style="padding: 10px; margin: 5px 0; border: 1px solid #ddd; border-radius: 5px; background: white;">
                        <strong>${index + 1}.</strong> ${entry.timestamp}<br>
                        <strong>Request:</strong> ${entry.request}<br>
                        <strong>Status:</strong> ${entry.success ? '✅ Success' : '❌ Failed'}<br>
                        <strong>Agent:</strong> ${entry.agent_type}
                    </div>
                `;
            });
            
            if (content === '') {
                content = '<p style="color: #6c757d;">No execution history yet.</p>';
            }
            
            historyContent.innerHTML = content;
            historyDiv.style.display = 'block';
        } else {
            historyDiv.style.display = 'none';
        }
    }

    clearHistory() {
        this.executionHistory = [];
        localStorage.removeItem('aiAgentHistory');
        this.showStatus('History cleared', 'info');
        document.getElementById('executionHistory').style.display = 'none';
    }

    showAlert(message, type) {
        // Create a simple alert
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="close" data-dismiss="alert">
                <span>&times;</span>
            </button>
        `;
        
        // Insert at the top of the agent section
        const agentSection = document.querySelector('.ai-agent-controls');
        agentSection.insertBefore(alertDiv, agentSection.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}

// Initialize the AI Agent enhancement when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for the existing Agent section to load
    setTimeout(() => {
        window.aiAgentEnhancement = new AIAgentEnhancement();
        console.log('🤖 AI Agent Enhancement loaded successfully!');
    }, 1000);
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIAgentEnhancement;
} 