import React, { useState } from 'react';
import './VlanModal.css';

const VlanModal = ({ open, onClose, interfaceName, switchType, onSave, onCreateVlan }) => {
  const [mode, setMode] = useState('access');
  const [accessVlan, setAccessVlan] = useState(1);
  const [trunkVlan, setTrunkVlan] = useState(1);
  const [newVlanId, setNewVlanId] = useState('');
  const [newVlanName, setNewVlanName] = useState('');
  const [vlanResponse, setVlanResponse] = useState('');

  if (!open) return null;

  const handleSave = () => {
    onSave({
      interfaceName,
      switchType,
      mode,
      vlanId: mode === 'access' ? accessVlan : trunkVlan,
    });
    onClose();
  };

  const handleCreateVlan = async (e) => {
    e.preventDefault();
    setVlanResponse('Creating VLAN...');
    try {
      await onCreateVlan({ vlanId: newVlanId, vlanName: newVlanName, switchType });
      setVlanResponse(`VLAN ${newVlanId} created successfully`);
      setNewVlanId('');
      setNewVlanName('');
    } catch (err) {
      setVlanResponse('Error: ' + err.message);
    }
  };

  return (
    <div className="vlan-modal-backdrop">
      <div className="vlan-modern-flex">
        <div className="vlan-modern-card">
          <h3>Configure VLAN - {interfaceName}</h3>
          <div>
            <label>VLAN Mode</label>
            <select value={mode} onChange={e => setMode(e.target.value)}>
              <option value="access">Access</option>
              <option value="trunk">Trunk</option>
            </select>
          </div>
          {mode === 'access' && (
            <div>
              <label>Access VLAN</label>
              <input type="number" min="1" max="4094" value={accessVlan} onChange={e => setAccessVlan(e.target.value)} />
            </div>
          )}
          {mode === 'trunk' && (
            <div>
              <label>Trunk VLAN</label>
              <input type="number" min="1" max="4094" value={trunkVlan} onChange={e => setTrunkVlan(e.target.value)} />
            </div>
          )}
          <button onClick={handleSave}>Save</button>
        </div>
        <div className="vlan-modern-divider"></div>
        <div className="vlan-modern-card">
          <h4>Create New VLAN</h4>
          <form onSubmit={handleCreateVlan}>
            <div>
              <label>VLAN ID</label>
              <input type="number" min="1" max="4094" value={newVlanId} onChange={e => setNewVlanId(e.target.value)} required />
            </div>
            <div>
              <label>VLAN Name</label>
              <input type="text" value={newVlanName} onChange={e => setNewVlanName(e.target.value)} required />
            </div>
            <button type="submit">Create VLAN</button>
          </form>
          <p id="vlanResponse">{vlanResponse}</p>
        </div>
      </div>
      <button className="vlan-modal-close" onClick={onClose}>&times;</button>
    </div>
  );
};

export default VlanModal; 