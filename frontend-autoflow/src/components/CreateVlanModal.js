import React, { useState, useEffect } from 'react';
import './CreateVlanModal.css';

const CreateVlanModal = ({ open, onClose, onAssignToInterface }) => {
  const [vlanId, setVlanId] = useState('');
  const [vlanName, setVlanName] = useState('');
  const [response, setResponse] = useState('');
  const [showAssignOption, setShowAssignOption] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  // VLAN list state
  const [vlans, setVlans] = useState([]);
  const [isLoadingVlans, setIsLoadingVlans] = useState(false);
  const [vlanError, setVlanError] = useState(null);

  // Fetch VLANs from backend
  const fetchVlans = async () => {
    setIsLoadingVlans(true);
    setVlanError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/list-vlans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ switchIp: '192.168.111.198' })
      });
      const data = await response.json();
      if (response.ok && data.vlans) {
        setVlans(data.vlans);
      } else {
        setVlanError(data.error || 'Failed to fetch VLANs');
      }
    } catch (err) {
      setVlanError(err.message);
    } finally {
      setIsLoadingVlans(false);
    }
  };

  // Delete VLAN
  const handleDeleteVlan = async (vlanId) => {
    if (!window.confirm(`Are you sure you want to delete VLAN ${vlanId}?`)) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/delete-vlan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ switchIp: '192.168.111.198', vlanId })
      });
      const data = await response.json();
      if (response.ok && data.message) {
        setVlans(vlans.filter(v => v.vlan_id !== vlanId));
        setResponse(`✅ VLAN ${vlanId} deleted successfully!`);
      } else {
        setResponse(`❌ Error deleting VLAN: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      setResponse(`❌ Network error: ${err.message}`);
    }
  };

  useEffect(() => {
    if (open) {
      fetchVlans();
    }
  }, [open]);

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
      const token = localStorage.getItem('token');
      const response = await fetch('/api/create-vlan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
          {/* VLAN List Table */}
          <div style={{
            marginTop: 32,
            background: '#f8fafc',
            borderRadius: 16,
            boxShadow: '0 2px 8px rgba(59,130,246,0.06)',
            padding: 18,
            maxHeight: 400,
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: '#3b82f6 #e0e7ef',
          }}>
            <style>{`
              .vlan-scrollbar::-webkit-scrollbar {
                width: 10px;
                background: #e0e7ef;
                border-radius: 8px;
              }
              .vlan-scrollbar::-webkit-scrollbar-thumb {
                background: linear-gradient(120deg, #3b82f6 0%, #1e3a8a 100%);
                border-radius: 8px;
              }
            `}</style>
            <div className="vlan-scrollbar" style={{ maxHeight: 350, overflowY: 'auto' }}>
              <h4 style={{ color: '#1e40af', fontWeight: 700, fontSize: 18, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>🗂️</span> Existing VLANs
                <button onClick={fetchVlans} style={{ marginLeft: 'auto', background: 'linear-gradient(90deg, #1e3a8a 0%, #3b82f6 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '4px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: '0 2px 8px rgba(59,130,246,0.10)' }}>Refresh</button>
              </h4>
              {isLoadingVlans ? (
                <div style={{ textAlign: 'center', padding: 16, color: '#1e3a8a', fontWeight: 600 }}>Loading VLANs...</div>
              ) : vlanError ? (
                <div style={{ color: '#dc2626', fontWeight: 600, padding: 8 }}>{vlanError}</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8, fontSize: 15 }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(90deg, #e0e7ef 0%, #c7d2fe 100%)' }}>
                      <th style={{ padding: '8px 8px', color: '#1e40af', fontWeight: 700 }}>VLAN ID</th>
                      <th style={{ padding: '8px 8px', color: '#1e40af', fontWeight: 700 }}>Name</th>
                      <th style={{ padding: '8px 8px', color: '#1e40af', fontWeight: 700 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vlans.length === 0 ? (
                      <tr><td colSpan={3} style={{ textAlign: 'center', color: '#64748b', fontWeight: 500, padding: 12 }}>No VLANs configured.</td></tr>
                    ) : (
                      vlans.map(vlan => (
                        <tr key={vlan.vlan_id} style={{ borderBottom: '1px solid #e0e7ef' }}>
                          <td style={{ padding: '8px 8px', color: '#ea580c', fontWeight: 700 }}>{vlan.vlan_id}</td>
                          <td style={{ padding: '8px 8px' }}>{vlan.vlan_name}</td>
                          <td style={{ padding: '8px 8px' }}>
                            <button
                              onClick={() => handleDeleteVlan(vlan.vlan_id)}
                              style={{ background: 'linear-gradient(90deg, #fbbf24 0%, #ea580c 100%)', color: '#fff', padding: '4px 12px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, boxShadow: '0 2px 8px rgba(251,191,36,0.10)', transition: 'all 0.2s', marginRight: 4 }}
                            >
                              🗑️ Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateVlanModal; 