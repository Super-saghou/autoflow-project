import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import Particles from '@tsparticles/react';
import type { Engine } from 'tsparticles-engine';
import { loadFull } from 'tsparticles';
import { Tooltip } from 'react-tooltip';
import Joyride from 'react-joyride';

const Dashboard = () => {
  const [devices, setDevices] = useState([]);
  const [newDevice, setNewDevice] = useState({ name: '', ip: '' });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [userProfile, setUserProfile] = useState({ username: 'Sarra', email: 'sarra.bngharbia@gmail.com', role: 'Admin' });
  const [expandedSection, setExpandedSection] = useState(null);
  const [theme, setTheme] = useState('default');
  const [runTour, setRunTour] = useState(true);
  const [versions, setVersions] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [formErrors, setFormErrors] = useState({ name: '', ip: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [health, setHealth] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchDevices = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/devices`);
        if (!response.ok) throw new Error('Error fetching devices');
        const data = await response.json();
        setDevices(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (activeSection === 'devices' || activeSection === 'developer') fetchDevices();

    if (activeSection === 'developer') {
      const fetchHealth = async () => {
        try {
          const response = await fetch(`${API_URL}/api/dev/health`);
          const data = await response.json();
          setHealth(data);
        } catch (err) {
          setError(err.message);
        }
      };
      fetchHealth();
    }
  }, [activeSection, API_URL]);

  const handleAddDevice = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const response = await fetch(`${API_URL}/api/devices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDevice),
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Error adding device');
      const data = await response.json();
      setMessage(data.message);
      setDevices([...devices, newDevice]);
      setNewDevice({ name: '', ip: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => navigate('/login');
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleAccount = () => setIsAccountOpen(!isAccountOpen);
  const openProfileEdit = () => { setIsProfileEditOpen(true); setIsAccountOpen(false); };
  const handleProfileUpdate = (e) => {
    e.preventDefault();
    const updatedProfile = { username: e.target.username.value || userProfile.username, email: e.target.email.value || userProfile.email, role: userProfile.role };
    setUserProfile(updatedProfile);
    setIsProfileEditOpen(false);
    setMessage('Profile updated successfully!');
  };
  const toggleSection = (section) => setExpandedSection(expandedSection === section ? null : section);
  const validateForm = () => {
    const errors = { name: '', ip: '' };
    let isValid = true;
    if (!newDevice.name) { errors.name = 'Name is required'; isValid = false; }
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!newDevice.ip || !ipRegex.test(newDevice.ip)) { errors.ip = 'Invalid IP address'; isValid = false; }
    setFormErrors(errors);
    return isValid;
  };
  const fetchVersions = async (deviceName) => {
    try {
      const response = await fetch(`${API_URL}/api/devices/versions/${deviceName}`);
      if (!response.ok) throw new Error('Error fetching versions');
      const data = await response.json();
      setVersions(data);
      setSelectedDevice(deviceName);
    } catch (err) {
      setError(err.message);
    }
  };
  const testApi = async (endpoint) => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`);
      const data = await response.json();
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setApiResponse(`Error: ${err.message}`);
    }
  };
  const changeTheme = (newTheme) => setTheme(newTheme);
  const particlesInit = async (engine: Engine) => {
    await loadFull(engine);
  };

  const steps = [
    { target: '.sidebar', content: 'Navigate using this sidebar.' },
    { target: '.account-button', content: 'Access your profile here.' },
    { target: '.nav-button:nth-child(2)', content: 'Manage configurations here.' },
  ];

  return (
    <div
      className={`dashboard-container ${theme}`}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: theme === 'light'
          ? '#F3E5AB' // Vanilla for light mode
          : theme === 'dark'
          ? '#1C2526' // Dark blue for dark mode
          : 'linear-gradient(45deg, #1E3A8A, #3B82F6, #40C4FF, #1E3A8A)', // Shades of blue for default
        backgroundSize: theme === 'default' ? '400%' : '100%',
        animation: theme === 'default' ? 'gradientAnimation 15s ease infinite' : 'none',
      }}
    >
      <style>
        {`
          @keyframes gradientAnimation {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          background: { color: { value: 'transparent' } },
          fpsLimit: 60,
          particles: {
            number: { value: 50, density: { enable: true, value_area: 800 } },
            color: { value: '#ff8c00' },
            shape: { type: 'circle' },
            opacity: { value: 0.5 },
            size: { value: 3, random: true },
            move: { enable: true, speed: 1, direction: 'none', random: true },
          },
          interactivity: {
            events: { onhover: { enable: true, mode: 'repulse' } },
            modes: { repulse: { distance: 100, duration: 0.4 } },
          },
        }}
        style={{ position: 'absolute', width: '100%', height: '100%', zIndex: -1 }}
      />
      <div style={{ display: 'flex', flex: 1 }}>
        <div className="sidebar" style={{ width: isMenuOpen ? '280px' : '80px' }}>
          <div className="sidebar-header">{isMenuOpen && <h3>Menu</h3>}<button onClick={toggleMenu} className="sidebar-toggle">{isMenuOpen ? '←' : '→'}</button></div>
          <ul className="nav-list">
            <li className="nav-item"><button onClick={() => setActiveSection('home')} className={`nav-button ${activeSection === 'home' ? 'active' : ''}`}><span className="nav-icon">🏠</span>{isMenuOpen && 'Home'}</button></li>
            {userProfile.role === 'Admin' && <li className="nav-item"><button onClick={() => setActiveSection('configuration')} className={`nav-button ${activeSection === 'configuration' ? 'active' : ''}`}><span className="nav-icon">⚙️</span>{isMenuOpen && 'Configuration'}</button></li>}
            <li className="nav-item"><button onClick={() => setActiveSection('devices')} className={`nav-button ${activeSection === 'devices' ? 'active' : ''}`}><span className="nav-icon">📡</span>{isMenuOpen && 'Devices'}</button></li>
            <li className="nav-item"><button onClick={() => setActiveSection('topology')} className={`nav-button ${activeSection === 'topology' ? 'active' : ''}`}><span className="nav-icon">🤖</span>{isMenuOpen && 'topology'}</button></li>
            <li className="nav-item"><button onClick={() => setActiveSection('settings')} className={`nav-button ${activeSection === 'settings' ? 'active' : ''}`}><span className="nav-icon">🔧</span>{isMenuOpen && 'Settings'}</button></li>
            {userProfile.role === 'Admin' && <li className="nav-item"><button onClick={() => setActiveSection('audit')} className={`nav-button ${activeSection === 'audit' ? 'active' : ''}`}><span className="nav-icon">📜</span>{isMenuOpen && 'Audit Logs'}</button></li>}
            <li className="nav-item"><button onClick={() => setActiveSection('help')} className={`nav-button ${activeSection === 'help' ? 'active' : ''}`}><span className="nav-icon">❓</span>{isMenuOpen && 'Help'}</button></li>
            {userProfile.role === 'Developer' && <li className="nav-item"><button onClick={() => setActiveSection('developer')} className={`nav-button ${activeSection === 'developer' ? 'active' : ''}`}><span className="nav-icon">💻</span>{isMenuOpen && 'Developer'}</button></li>}
            <li className="nav-item"><button onClick={handleLogout} className="nav-button"><span className="nav-icon">🚪</span>{isMenuOpen && 'Logout'}</button></li>
          </ul>
        </div>
        <div className="main-content" style={{ flex: 1 }}>
          <button
            onClick={toggleAccount}
            className="account-button"
            data-tooltip-id="main-tooltip"
            data-tooltip-content="Access your profile"
          >
            👤
          </button>
          {isAccountOpen && (
            <div className="account-panel">
              <h4>My Account</h4>
              <p>Username: {userProfile.username}</p>
              <p>Email: {userProfile.email}</p>
              <p>Role: {userProfile.role}</p>
              <div className="form-group">
                <label>Theme:</label>
                <select value={theme} onChange={(e) => changeTheme(e.target.value)} className="form-input">
                  <option value="default">Default</option>
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                </select>
              </div>
              <button onClick={openProfileEdit} className="login-btn">Edit Profile</button>
            </div>
          )}
          {isProfileEditOpen && (
            <div className="profile-edit-panel">
              <div className="profile-edit-card">
                <h3>Edit My Profile</h3>
                <form onSubmit={handleProfileUpdate}>
                  <div className="form-group"><label>Name:</label><input type="text" name="username" defaultValue={userProfile.username} className="form-input" /></div>
                  <div className="form-group"><label>Email:</label><input type="email" name="email" defaultValue={userProfile.email} className="form-input" /></div>
                  <div className="form-group"><label>Password:</label><input type="password" name="password" placeholder="New (optional)" className="form-input" /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}><button type="submit" className="login-btn">Save</button><button type="button" onClick={() => setIsProfileEditOpen(false)} className="login-btn" style={{ background: 'linear-gradient(45deg, #DAA520, #8B4513)' }}>Cancel</button></div>
                </form>
              </div>
            </div>
          )}
          {activeSection === 'home' && (
            <div style={{ position: 'relative', minHeight: '80vh' }}>
              <h2 className="section-header">Dashboard - Network Automation</h2>
              <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '15px', margin: '20px auto', maxWidth: '600px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)' }}>
                <p style={{ color: '#fff', fontSize: '18px', marginBottom: '10px' }}>Welcome, {userProfile.username}!</p>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px' }}>This is your centralized hub for managing network devices and automations. Explore the sidebar to get started.</p>
              </div>
            </div>
          )}
          {activeSection === 'configuration' && userProfile.role === 'Admin' && (
            <div><h2 className="section-header">Configuration</h2><div className="config-section"><h3 onClick={() => toggleSection('switching')}>Switching<span>{expandedSection === 'switching' ? '▼' : '▶'}</span></h3>{expandedSection === 'switching' && (<div><div className="config-subsection"><h4 style={{ color: '#1e3a8a', fontWeight: '700' }}>Cisco Catalyst 2950</h4><form className="login-form"><div className="form-group"><label>Name:</label><input type="text" className="form-input" placeholder="Ex: Switch-2950-1" /></div><div className="form-group"><label>IP:</label><input type="text" className="form-input" placeholder="Ex: 192.168.245.139" /></div><button type="submit" className="login-btn">Configure</button></form></div><div className="config-subsection"><h4 style={{ color: '#1e3a8a', fontWeight: '700' }}>Cisco Catalyst 3750</h4><form className="login-form"><div className="form-group"><label>Name:</label><input type="text" className="form-input" placeholder="Ex: Switch-3750-1" /></div><div className="form-group"><label>IP:</label><input type="text" className="form-input" placeholder="Ex: 192.168.245.140" /></div><button type="submit" className="login-btn">Configure</button></form></div><div className="config-subsection"><h4 style={{ color: '#1e3a8a', fontWeight: '700' }}>Cisco Catalyst 9300</h4><form className="login-form"><div className="form-group"><label>Name:</label><input type="text" className="form-input" placeholder="Ex: Switch-9300-1" /></div><div className="form-group"><label>IP:</label><input type="text" className="form-input" placeholder="Ex: 192.168.245.141" /></div><button type="submit" className="login-btn">Configure</button></form></div></div>)}</div><div className="config-section"><h3 onClick={() => toggleSection('routing')}>Routing<span>{expandedSection === 'routing' ? '▼' : '▶'}</span></h3>{expandedSection === 'routing' && (<div><div className="config-subsection"><h4 style={{ color: '#1e3a8a', fontWeight: '700' }}>Cisco ISR 1000</h4><form className="login-form"><div className="form-group"><label>Name:</label><input type="text" className="form-input" placeholder="Ex: Router-ISR1000-1" /></div><div className="form-group"><label>IP:</label><input type="text" className="form-input" placeholder="Ex: 192.168.245.142" /></div><button type="submit" className="login-btn">Configure</button></form></div><div className="config-subsection"><h4 style={{ color: '#1e3a8a', fontWeight: '700' }}>Cisco ISR 4000</h4><form className="login-form"><div className="form-group"><label>Name:</label><input type="text" className="form-input" placeholder="Ex: Router-ISR4000-1" /></div><div className="form-group"><label>IP:</label><input type="text" className="form-input" placeholder="Ex: 192.168.245.143" /></div><button type="submit" className="login-btn">Configure</button></form></div><div className="config-subsection"><h4 style={{ color: '#1e3a8a', fontWeight: '700' }}>Cisco ASR 1000</h4><form className="login-form"><div className="form-group"><label>Name:</label><input type="text" className="form-input" placeholder="Ex: Router-ASR1000-1" /></div><div className="form-group"><label>IP:</label><input type="text" className="form-input" placeholder="Ex: 192.168.245.144" /></div><button type="submit" className="login-btn">Configure</button></form></div></div>)}</div><div className="config-section"><h3 onClick={() => toggleSection('firewalling')}>Firewalling<span>{expandedSection === 'firewalling' ? '▼' : '▶'}</span></h3>{expandedSection === 'firewalling' && (<div><div className="config-subsection"><h4 style={{ color: '#1e3a8a', fontWeight: '700' }}>Cisco ASA 5505</h4><form className="login-form"><div className="form-group"><label>Name:</label><input type="text" className="form-input" placeholder="Ex: Firewall-ASA5505-1" /></div><div className="form-group"><label>IP:</label><input type="text" className="form-input" placeholder="Ex: 192.168.245.145" /></div><button type="submit" className="login-btn">Configure</button></form></div><div className="config-subsection"><h4 style={{ color: '#1e3a8a', fontWeight: '700' }}>Cisco Firepower 2100</h4><form className="login-form"><div className="form-group"><label>Name:</label><input type="text" className="form-input" placeholder="Ex: Firewall-FP2100-1" /></div><div className="form-group"><label>IP:</label><input type="text" className="form-input" placeholder="Ex: 192.168.245.146" /></div><button type="submit" className="login-btn">Configure</button></form></div><div className="config-subsection"><h4 style={{ color: '#1e3a8a', fontWeight: '700' }}>Palo Alto PA-220</h4><form className="login-form"><div className="form-group"><label>Name:</label><input type="text" className="form-input" placeholder="Ex: Firewall-PA220-1" /></div><div className="form-group"><label>IP:</label><input type="text" className="form-input" placeholder="Ex: 192.168.245.147" /></div><button type="submit" className="login-btn">Configure</button></form></div></div>)}</div><div className="config-section"><h3 onClick={() => toggleSection('dhcp')}>DHCP<span>{expandedSection === 'dhcp' ? '▼' : '▶'}</span></h3>{expandedSection === 'dhcp' && (<div><div className="config-subsection"><h4 style={{ color: '#1e3a8a', fontWeight: '700' }}>DHCP Server on Cisco Router</h4><form className="login-form"><div className="form-group"><label>Name:</label><input type="text" className="form-input" placeholder="Ex: DHCP-Cisco-1" /></div><div className="form-group"><label>IP:</label><input type="text" className="form-input" placeholder="Ex: 192.168.245.148" /></div><button type="submit" className="login-btn">Configure</button></form></div><div className="config-subsection"><h4 style={{ color: '#1e3a8a', fontWeight: '700' }}>DHCP Server on Windows Server</h4><form className="login-form"><div className="form-group"><label>Name:</label><input type="text" className="form-input" placeholder="Ex: DHCP-WinServer-1" /></div><div className="form-group"><label>IP:</label><input type="text" className="form-input" placeholder="Ex: 192.168.245.149" /></div><button type="submit" className="login-btn">Configure</button></form></div></div>)}</div><div className="config-section"><h3 onClick={() => toggleSection('nat')}>NAT<span>{expandedSection === 'nat' ? '▼' : '▶'}</span></h3>{expandedSection === 'nat' && (<div><div className="config-subsection"><h4 style={{ color: '#1e3a8a', fontWeight: '700' }}>NAT on Cisco Router</h4><form className="login-form"><div className="form-group"><label>Name:</label><input type="text" className="form-input" placeholder="Ex: NAT-Cisco-1" /></div><div className="form-group"><label>IP:</label><input type="text" className="form-input" placeholder="Ex: 192.168.245.150" /></div><button type="submit" className="login-btn">Configure</button></form></div><div className="config-subsection"><h4 style={{ color: '#1e3a8a', fontWeight: '700' }}>NAT on Firewall</h4><form className="login-form"><div className="form-group"><label>Name:</label><input type="text" className="form-input" placeholder="Ex: NAT-Firewall-1" /></div><div className="form-group"><label>IP:</label><input type="text" className="form-input" placeholder="Ex: 192.168.245.151" /></div><button type="submit" className="login-btn">Configure</button></form></div></div>)}</div></div>
          )}
          {activeSection === 'devices' && (
            <div><h2 className="section-header">Devices</h2><div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}><button className="login-btn" onClick={() => window.location.href = `${API_URL}/api/config/export`}>Export Configurations</button><label className="login-btn" style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>Import Configurations<input type="file" accept=".json" style={{ display: 'none' }} onChange={async (e) => { const file = e.target.files[0]; const configs = JSON.parse(await file.text()); await fetch(`${API_URL}/api/config/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(configs) }); setMessage('Configurations imported'); }} /></label></div><div className="form-group"><h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: '#4A2C1A' }}>Configured Devices</h3>{isLoading ? (<ul className="device-list">{[...Array(3)].map((_, index) => (<li key={index} className="device-item"><div className="skeleton skeleton-text" style={{ width: '60%' }}></div><div className="skeleton skeleton-button"></div></li>))}</ul>) : devices.length > 0 ? (<ul className="device-list">{devices.map((device, index) => (<li key={index} className="device-item"><span>{device.name} ({device.ip})</span><div style={{ display: 'flex', gap: '10px' }}><button data-tooltip-id="main-tooltip" data-tooltip-content="View History" className="login-btn" style={{ padding: '8px 15px', fontSize: '14px' }} onClick={() => fetchVersions(device.name)}>Version History</button><button data-tooltip-id="main-tooltip" data-tooltip-content="Configure" className="login-btn" style={{ padding: '8px 15px', fontSize: '14px' }} onClick={() => alert(`Configuration for ${device.name}`)}>Configure</button></div></li>))}</ul>) : (<p style={{ color: '#666', fontSize: '16px' }}>No devices.</p>)}{selectedDevice && (<div className="config-section"><h3>Version History for {selectedDevice}</h3><ul className="device-list">{versions.map((version, index) => (<li key={index} className="device-item"><span>Version {version.version} - {new Date(version.timestamp).toLocaleString()}</span><button className="login-btn" style={{ padding: '8px 15px', fontSize: '14px' }} onClick={() => alert(`Rollback to ${version.version}`)}>Rollback</button></li>))}</ul></div>)}</div><form onSubmit={handleAddDevice} className="login-form"><h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: '#4A2C1A' }}>Add Device</h3><div className="form-group"><label>Name:</label><input type="text" value={newDevice.name} onChange={(e) => { setNewDevice({ ...newDevice, name: e.target.value }); validateForm(); }} className={`form-input ${formErrors.name ? 'invalid' : newDevice.name ? 'valid' : ''}`} placeholder="Ex: Router 1" required /><p className="error-message">{formErrors.name}</p></div><div className="form-group"><label>IP:</label><input type="text" value={newDevice.ip} onChange={(e) => { setNewDevice({ ...newDevice, ip: e.target.value }); validateForm(); }} className={`form-input ${formErrors.ip ? 'invalid' : newDevice.ip ? 'valid' : ''}`} placeholder="Ex: 192.168.1.1" required /><p className="error-message">{formErrors.ip}</p></div>{message && <p style={{ color: '#2ecc71', fontSize: '14px' }}>{message}</p>}{error && <p style={{ color: '#e74c3c', fontSize: '14px' }}>{error}</p>}<button type="submit" className="login-btn">Add</button></form></div>
          )}
          {activeSection === 'topology' && (
            <div><h2 className="section-header">topology</h2><div className="config-section"><h3>Playbook Library</h3><div className="config-subsection"><h4 style={{ color: '#1e3a8a', fontWeight: '700' }}>Create VLAN</h4><form className="login-form"><div className="form-group"><label>VLAN ID:</label><input type="text" className="form-input" placeholder="Ex: 10" /></div><div className="form-group"><label>Name:</label><input type="text" className="form-input" placeholder="Ex: VLAN_10" /></div><button type="submit" className="login-btn">Execute</button></form></div></div></div>
          )}
          {activeSection === 'settings' && (
            <div><h2 className="section-header">Settings</h2><p style={{ color: '#666', fontSize: '16px' }}>Section to develop.</p></div>
          )}
          {activeSection === 'audit' && userProfile.role === 'Admin' && (
            <div><h2 className="section-header">Audit Logs</h2><ul className="device-list">{[1, 2, 3].map(i => (<li key={i} className="device-item"><span>User: Sarra - Action: Device Added - Details: {JSON.stringify({ name: `Router-${i}`, ip: `192.168.1.${i}` })} at {new Date().toLocaleString()}</span></li>))}</ul></div>
          )}
          {activeSection === 'help' && (
            <div><h2 className="section-header">Help</h2><div className="config-section"><h3>Tutorial: Add</h3><ol style={{ paddingLeft: '20px', color: '#666' }}><li>Go to "Devices".</li><li>Fill out the form.</li><li>Click "Add".</li></ol><a href="/docs/user-manual.pdf" target="_blank" className="login-btn" style={{ display: 'inline-block', marginTop: '15px' }}>Download Manual</a></div></div>
          )}
          {userProfile.role === 'Developer' && activeSection === 'developer' && (
            <div><h2 className="section-header">Developer Dashboard</h2><div className="config-section"><h3>System Health</h3>{health ? (<ul style={{ listStyle: 'none', padding: 0 }}><li>Server Uptime: {Math.floor(health.serverUptime)}s</li><li>MongoDB Status: {health.mongoStatus}</li><li>Kubernetes Pods: {health.kubernetesPods || 'N/A'}</li></ul>) : (<p>Loading...</p>)}</div><div className="config-section"><h3>API Testing</h3><div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}><button className="login-btn" onClick={() => testApi('/api/devices')}>Test /api/devices</button><button className="login-btn" onClick={() => testApi('/api/audit-logs')}>Test /api/audit-logs</button></div>{apiResponse && (<pre style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '10px', borderRadius: '10px', maxHeight: '300px', overflowY: 'auto' }}>{apiResponse}</pre>)}</div></div>
          )}
        </div>
      </div>
      <footer style={{ background: 'rgba(45, 55, 72, 0.9)', backdropFilter: 'blur(10px)', padding: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff', width: '100%' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h4>Company</h4>
            <p>Network Automation Solutions</p>
            <p>La Société tunisienne de l'électricité et du gaz</p>
            <p>Email: sarra.bngharbia@gmail.com.com</p>
            <p>Phone: +216 52.755.608</p>
          </div>
          <div>
            <h4>Quick Links</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li><a href="#home" style={{ color: '#DAA520', textDecoration: 'none' }}>Home</a></li>
              <li><a href="#devices" style={{ color: '#DAA520', textDecoration: 'none' }}>Devices</a></li>
              <li><a href="#configuration" style={{ color: '#DAA520', textDecoration: 'none' }}>Configuration</a></li>
              <li><a href="#help" style={{ color: '#DAA520', textDecoration: 'none' }}>Help</a></li>
            </ul>
          </div>
          <div>
            <h4>Legal</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li><a href="/privacy" style={{ color: '#DAA520', textDecoration: 'none' }}>Privacy Policy</a></li>
              <li><a href="/terms" style={{ color: '#DAA520', textDecoration: 'none' }}>Terms of Service</a></li>
              <li><a href="/compliance" style={{ color: '#DAA520', textDecoration: 'none' }}>Compliance</a></li>
            </ul>
          </div>
          <div>
            <h4>Follow Us</h4>
            <div style={{ display: 'flex', gap: '15px' }}>
              <a href="https://twitter.com/netautosol" style={{ color: '#DAA520', fontSize: '24px' }}>🐦</a>
              <a href="https://linkedin.com/company/netautosol" style={{ color: '#DAA520', fontSize: '24px' }}>💼</a>
              <a href="https://facebook.com/netautosol" style={{ color: '#DAA520', fontSize: '24px' }}>👍</a>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
          © 2025 Network Automation Solutions. All rights reserved.
        </div>
      </footer>
      <Tooltip id="main-tooltip" place="top" effect="solid" />
      <Joyride steps={steps} run={runTour} continuous showSkipButton styles={{ options: { primaryColor: '#DAA520', textColor: '#4A2C1A', backgroundColor: 'rgba(245, 245, 220, 0.9)', overlayColor: 'rgba(0, 0, 0, 0.5)' } }} callback={(data) => { if (data.action === 'close') setRunTour(false); }} />
    </div>
  );
};

export default Dashboard;
