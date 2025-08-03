#!/usr/bin/env python3
"""
FortiGate API Routes for AutoFlow Platform
Backend routes for FortiGate management
"""

from flask import Flask, request, jsonify
from fortigate_ssh_api import (
    get_fortigate_status,
    get_firewall_rules,
    create_firewall_rule,
    delete_firewall_rule,
    get_vpn_connections,
    get_security_profiles
)

app = Flask(__name__)

@app.route('/api/fortigate/status', methods=['GET'])
def fortigate_status():
    """Get FortiGate system status"""
    try:
        result = get_fortigate_status()
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/fortigate/firewall-rules', methods=['GET'])
def get_rules():
    """Get all firewall rules"""
    try:
        result = get_firewall_rules()
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/fortigate/firewall-rules', methods=['POST'])
def create_rule():
    """Create a new firewall rule"""
    try:
        rule_data = request.json
        result = create_firewall_rule(rule_data)
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/fortigate/firewall-rules/<rule_id>', methods=['DELETE'])
def delete_rule(rule_id):
    """Delete a firewall rule"""
    try:
        result = delete_firewall_rule(rule_id)
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/fortigate/vpn-connections', methods=['GET'])
def get_vpn():
    """Get VPN connections"""
    try:
        result = get_vpn_connections()
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/fortigate/security-profiles', methods=['GET'])
def get_profiles():
    """Get security profiles"""
    try:
        result = get_security_profiles()
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# JavaScript/Node.js equivalent routes for server.js
JAVASCRIPT_ROUTES = """
// FortiGate API Routes for server.js
const { spawn } = require('child_process');

// Get FortiGate status
app.get('/api/fortigate/status', async (req, res) => {
    try {
        const pythonProcess = spawn('python3', ['fortigate_ssh_api.py', 'status']);
        let result = '';
        
        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            console.error(`FortiGate Error: ${data}`);
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    const parsed = JSON.parse(result);
                    res.json(parsed);
                } catch (e) {
                    res.json({ status: 'success', output: result });
                }
            } else {
                res.status(500).json({ status: 'error', message: 'Failed to get status' });
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Get firewall rules
app.get('/api/fortigate/firewall-rules', async (req, res) => {
    try {
        const pythonProcess = spawn('python3', ['fortigate_ssh_api.py', 'rules']);
        let result = '';
        
        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    const parsed = JSON.parse(result);
                    res.json(parsed);
                } catch (e) {
                    res.json({ status: 'success', output: result });
                }
            } else {
                res.status(500).json({ status: 'error', message: 'Failed to get rules' });
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Create firewall rule
app.post('/api/fortigate/firewall-rules', async (req, res) => {
    try {
        const ruleData = req.body;
        const pythonProcess = spawn('python3', ['fortigate_ssh_api.py', 'create', JSON.stringify(ruleData)]);
        let result = '';
        
        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    const parsed = JSON.parse(result);
                    res.json(parsed);
                } catch (e) {
                    res.json({ status: 'success', output: result });
                }
            } else {
                res.status(500).json({ status: 'error', message: 'Failed to create rule' });
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Delete firewall rule
app.delete('/api/fortigate/firewall-rules/:id', async (req, res) => {
    try {
        const ruleId = req.params.id;
        const pythonProcess = spawn('python3', ['fortigate_ssh_api.py', 'delete', ruleId]);
        let result = '';
        
        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    const parsed = JSON.parse(result);
                    res.json(parsed);
                } catch (e) {
                    res.json({ status: 'success', output: result });
                }
            } else {
                res.status(500).json({ status: 'error', message: 'Failed to delete rule' });
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Get VPN connections
app.get('/api/fortigate/vpn-connections', async (req, res) => {
    try {
        const pythonProcess = spawn('python3', ['fortigate_ssh_api.py', 'vpn']);
        let result = '';
        
        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    const parsed = JSON.parse(result);
                    res.json(parsed);
                } catch (e) {
                    res.json({ status: 'success', output: result });
                }
            } else {
                res.status(500).json({ status: 'error', message: 'Failed to get VPN' });
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Get security profiles
app.get('/api/fortigate/security-profiles', async (req, res) => {
    try {
        const pythonProcess = spawn('python3', ['fortigate_ssh_api.py', 'profiles']);
        let result = '';
        
        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    const parsed = JSON.parse(result);
                    res.json(parsed);
                } catch (e) {
                    res.json({ status: 'success', output: result });
                }
            } else {
                res.status(500).json({ status: 'error', message: 'Failed to get profiles' });
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});
"""

if __name__ == "__main__":
    print("FortiGate API Routes")
    print("=" * 30)
    print("Available endpoints:")
    print("- GET  /api/fortigate/status")
    print("- GET  /api/fortigate/firewall-rules")
    print("- POST /api/fortigate/firewall-rules")
    print("- DELETE /api/fortigate/firewall-rules/:id")
    print("- GET  /api/fortigate/vpn-connections")
    print("- GET  /api/fortigate/security-profiles")
    print()
    print("JavaScript routes for server.js:")
    print(JAVASCRIPT_ROUTES) 