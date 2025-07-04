import React, { useState } from 'react';
import './CreateVlanModal.css';

const CreateVlanModal = ({ open, onClose, onCreateVlan, onAssignToInterface }) => {
  const [vlanId, setVlanId] = useState('');
  const [vlanName, setVlanName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [response, setResponse] = useState('');
  const [showAssignOption, setShowAssignOption] = useState(false);

  if (!open) return null;

  const handleCreateVlan = async (e) => {
    e.preventDefault();
    if (!vlanId || !vlanName) {
      setResponse('❌ Please fill in all fields');
      return;
    }

    setIsCreating(true);
    setResponse('Creating VLAN...');

    try {
      const response = await fetch('http://localhost:5000/api/create-vlan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vlanId: parseInt(vlanId),
          vlanName: vlanName,
          switchIp: '192.168.111.198'
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setResponse(`✅ VLAN ${vlanId} (${vlanName}) created successfully!`);
        setShowAssignOption(true);
      } else {
        setResponse(`❌ Error: ${result.error || 'Unknown error'}`);
        setShowAssignOption(false);
      }
    } catch (error) {
      setResponse(`❌ Network error: ${error.message}`);
      setShowAssignOption(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAssignToInterface = () => {
    setResponse('🔄 Transitioning to interface selection...');
    setShowAssignOption(false);
    setTimeout(() => {
      onAssignToInterface();
      handleClose();
    }, 200);
  };

  const handleClose = () => {
    setVlanId('');
    setVlanName('');
    setResponse('');
    setShowAssignOption(false);
    setIsCreating(false);
    onClose();
  };

  return (
    <div className="create-vlan-modal-backdrop">
      <div className="create-vlan-modal-container">
        <div className="create-vlan-modal-header">
          <h2>Create New VLAN</h2>
          <button className="create-vlan-modal-close" onClick={handleClose}>&times;</button>
        </div>
        
        <div className="create-vlan-modal-content">
          <form onSubmit={handleCreateVlan}>
            <div className="create-vlan-form-group">
              <label htmlFor="vlanId">VLAN ID</label>
              <input
                id="vlanId"
                type="number"
                min="1"
                max="4094"
                value={vlanId}
                onChange={(e) => setVlanId(e.target.value)}
                placeholder="Enter VLAN ID (1-4094)"
                required
                disabled={isCreating}
              />
            </div>
            
            <div className="create-vlan-form-group">
              <label htmlFor="vlanName">VLAN Name</label>
              <input
                id="vlanName"
                type="text"
                value={vlanName}
                onChange={(e) => setVlanName(e.target.value)}
                placeholder="Enter VLAN name"
                required
                disabled={isCreating}
              />
            </div>
            
            <div className="create-vlan-button-group">
              <button 
                type="submit" 
                className="create-vlan-btn create-vlan-btn-primary"
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Create VLAN'}
              </button>
              
              <button 
                type="button" 
                className="create-vlan-btn create-vlan-btn-secondary"
                onClick={handleClose}
                disabled={isCreating}
              >
                Cancel
              </button>
            </div>
          </form>
          
          {response && (
            <div className={`create-vlan-response ${response.includes('✅') ? 'success' : 'error'}`}>
              {response}
            </div>
          )}
          
          {showAssignOption && (
            <div className="create-vlan-assign-section">
              <div className="create-vlan-divider"></div>
              <h3>What would you like to do next?</h3>
              <div className="create-vlan-assign-buttons">
                <button 
                  className="create-vlan-btn create-vlan-btn-success"
                  onClick={handleAssignToInterface}
                >
                  📋 Assign to Interface
                </button>
                <button 
                  className="create-vlan-btn create-vlan-btn-info"
                  onClick={handleClose}
                >
                  ✅ Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateVlanModal; 