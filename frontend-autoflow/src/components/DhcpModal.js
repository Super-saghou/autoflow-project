import React, { useState } from 'react';
import './DhcpModal.css';

const DhcpModal = ({ open, onClose, onCreateDhcp, onAssignToInterface }) => {
  const [dhcpConfig, setDhcpConfig] = useState({
    poolName: '',
    networkAddress: '',
    subnetMask: '',
    defaultGateway: '',
    dnsServer: '',
    startIp: '',
    endIp: '',
    leaseTime: '24'
  });
  const [isCreating, setIsCreating] = useState(false);
  const [response, setResponse] = useState('');

  if (!open) return null;

  const handleCreateDhcp = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ['poolName', 'networkAddress', 'subnetMask', 'defaultGateway', 'startIp', 'endIp'];
    const missingFields = requiredFields.filter(field => !dhcpConfig[field]);
    
    if (missingFields.length > 0) {
      setResponse(`❌ Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    setIsCreating(true);
    setResponse('Creating DHCP pool...');

    try {
      const response = await fetch('http://localhost:5001/api/create-dhcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...dhcpConfig,
          switchIp: '192.168.111.198'
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setResponse(`✅ DHCP pool "${dhcpConfig.poolName}" created successfully!`);
        console.log('DHCP creation result:', result);
      } else {
        setResponse(`❌ Error: ${result.error || 'Unknown error'}`);
        console.error('DHCP creation error:', result);
      }
    } catch (error) {
      setResponse(`❌ Network error: ${error.message}`);
      console.error('DHCP creation network error:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setDhcpConfig({
      poolName: '',
      networkAddress: '',
      subnetMask: '',
      defaultGateway: '',
      dnsServer: '',
      startIp: '',
      endIp: '',
      leaseTime: '24'
    });
    setResponse('');
    setIsCreating(false);
    onClose();
  };

  const updateConfig = (field, value) => {
    setDhcpConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="dhcp-modal-backdrop">
      <div className="dhcp-modal-container">
        <div className="dhcp-modal-header">
          <h2>Create DHCP Pool</h2>
          <button className="dhcp-modal-close" onClick={handleClose}>&times;</button>
        </div>
        
        <div className="dhcp-modal-content">
          <form onSubmit={handleCreateDhcp}>
            <div className="dhcp-form-row">
              <div className="dhcp-form-group">
                <label htmlFor="poolName">Pool Name *</label>
                <input
                  id="poolName"
                  type="text"
                  value={dhcpConfig.poolName}
                  onChange={(e) => updateConfig('poolName', e.target.value)}
                  placeholder="e.g., LAN_POOL"
                  required
                  disabled={isCreating}
                />
              </div>
              
              <div className="dhcp-form-group">
                <label htmlFor="leaseTime">Lease Time (hours)</label>
                <select
                  id="leaseTime"
                  value={dhcpConfig.leaseTime}
                  onChange={(e) => updateConfig('leaseTime', e.target.value)}
                  disabled={isCreating}
                >
                  <option value="1">1 hour</option>
                  <option value="6">6 hours</option>
                  <option value="12">12 hours</option>
                  <option value="24">24 hours</option>
                  <option value="48">48 hours</option>
                  <option value="168">1 week</option>
                </select>
              </div>
            </div>

            <div className="dhcp-form-row">
              <div className="dhcp-form-group">
                <label htmlFor="networkAddress">Network Address *</label>
                <input
                  id="networkAddress"
                  type="text"
                  value={dhcpConfig.networkAddress}
                  onChange={(e) => updateConfig('networkAddress', e.target.value)}
                  placeholder="e.g., 192.168.1.0"
                  required
                  disabled={isCreating}
                />
              </div>
              
              <div className="dhcp-form-group">
                <label htmlFor="subnetMask">Subnet Mask *</label>
                <input
                  id="subnetMask"
                  type="text"
                  value={dhcpConfig.subnetMask}
                  onChange={(e) => updateConfig('subnetMask', e.target.value)}
                  placeholder="e.g., 255.255.255.0"
                  required
                  disabled={isCreating}
                />
              </div>
            </div>

            <div className="dhcp-form-row">
              <div className="dhcp-form-group">
                <label htmlFor="defaultGateway">Default Gateway *</label>
                <input
                  id="defaultGateway"
                  type="text"
                  value={dhcpConfig.defaultGateway}
                  onChange={(e) => updateConfig('defaultGateway', e.target.value)}
                  placeholder="e.g., 192.168.1.1"
                  required
                  disabled={isCreating}
                />
              </div>
              
              <div className="dhcp-form-group">
                <label htmlFor="dnsServer">DNS Server</label>
                <input
                  id="dnsServer"
                  type="text"
                  value={dhcpConfig.dnsServer}
                  onChange={(e) => updateConfig('dnsServer', e.target.value)}
                  placeholder="e.g., 8.8.8.8"
                  disabled={isCreating}
                />
              </div>
            </div>

            <div className="dhcp-form-row">
              <div className="dhcp-form-group">
                <label htmlFor="startIp">Start IP *</label>
                <input
                  id="startIp"
                  type="text"
                  value={dhcpConfig.startIp}
                  onChange={(e) => updateConfig('startIp', e.target.value)}
                  placeholder="e.g., 192.168.1.10"
                  required
                  disabled={isCreating}
                />
              </div>
              
              <div className="dhcp-form-group">
                <label htmlFor="endIp">End IP *</label>
                <input
                  id="endIp"
                  type="text"
                  value={dhcpConfig.endIp}
                  onChange={(e) => updateConfig('endIp', e.target.value)}
                  placeholder="e.g., 192.168.1.100"
                  required
                  disabled={isCreating}
                />
              </div>
            </div>
            
            <div className="dhcp-button-group">
              <button 
                type="submit" 
                className="dhcp-btn dhcp-btn-primary"
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Create DHCP Pool'}
              </button>
              
              <button 
                type="button" 
                className="dhcp-btn dhcp-btn-secondary"
                onClick={handleClose}
                disabled={isCreating}
              >
                Cancel
              </button>
            </div>
          </form>
          
          {response && (
            <div className={`dhcp-response ${response.includes('✅') ? 'success' : 'error'}`}>
              {response}
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default DhcpModal; 