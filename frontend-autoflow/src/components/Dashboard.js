import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import Particles from '@tsparticles/react';
import { loadFull } from 'tsparticles';
import { Tooltip } from 'react-tooltip';
import Joyride from 'react-joyride';
import Topology from './Topology';

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
  const [selectedSwitch, setSelectedSwitch] = useState(null);
  const [formErrors, setFormErrors] = useState({ name: '', ip: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [health, setHealth] = useState(null);
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

    if (activeSection === 'devices' || activeSection === 'developer' || activeSection === 'topology') {
      fetchDevices();
    }

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
      setSelectedSwitch(deviceName);
    } catch (err) {
      setError(err.message);
    }
  };
  const testApi = async (endpoint) => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`);
      const data = await response.json();
    } catch (err) {
    }
  };
  const changeTheme = (newTheme) => setTheme(newTheme);
  const particlesInit = async (engine) => {
    await loadFull(engine);
  };

  window.saveConfig = function(interfaceName, switchType) {
    const mode = document.getElementById('vlanMode').value;
    const vlanId = mode === 'access' ? document.getElementById('accessVlan').value : document.getElementById('trunkVlan').value;
    alert(`Configuration Saved for ${interfaceName} on ${switchType}: Mode=${mode}, VLAN=${vlanId}`);
  };

  const openSwitchDetails = async (switchType) => {
    const newTab = window.open('', '_blank');
    if (!newTab) {
      alert('Popup blocked! Please allow popups for this site and try again.');
      return;
    }
    try {
      console.log(`Fetching interfaces for ${switchType} from ${API_URL}/api/interfaces/${encodeURIComponent(switchType)}`);
      const response = await fetch(`${API_URL}/api/interfaces/${encodeURIComponent(switchType)}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      const interfacesData = await response.json();
      console.log('Received interfaces data:', interfacesData);

      if (!interfacesData || interfacesData.length === 0) {
        interfacesData = [['Fa1/0', 'Down'], ['Fa1/1', 'Down'], ['Fa1/2', 'Down'], ['Fa1/3', 'Down'], ['Fa1/4', 'Down'], ['Fa1/5', 'Down'], ['Fa1/6', 'Down'], ['Fa1/7', 'Down'], ['Fa1/8', 'Down'], ['Fa1/9', 'Down'], ['Fa1/10', 'Down'], ['Fa1/11', 'Down'], ['Fa1/12', 'Down'], ['Fa1/13', 'Down'], ['Fa1/14', 'Down'], ['Fa1/15', 'Down']]; // Fallback
        console.warn('No interfaces fetched, using fallback:', interfacesData);
      } else {
        console.log('Fetched interfaces:', interfacesData);
      }

      const styleContent = `
        body { font-family: Arial, sans-serif; background: #FAFAD2; color: #1A2A44; padding: 20px; }
        h2 { color: #3b82f6; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid rgba(26, 42, 68, 0.2); }
        th { background: rgba(59, 130, 246, 0.7); }
        td { background: rgba(250, 250, 210, 0.1); }
        .up, .down { color: #10b981; cursor: pointer; text-decoration: underline; }
      `;

      const editStyleContent = `
        body { font-family: Arial, sans-serif; background: #FAFAD2; color: #1A2A44; padding: 20px; }
        h3 { color: #3b82f6; }
        select, input { margin: 5px 0; padding: 5px; width: 100px; }
        button { padding: 5px 10px; background: #3b82f6; color: #fff; border: none; cursor: pointer; }
        .vlan-form { margin-top: 20px; }
      `;

      const interfacesHtml = interfacesData.map(([intf, status]) => `
        <tr>
          <td><span onclick="openEditWindow('${intf}', '${switchType}')" class="${status.toLowerCase()}">${intf}</span></td>
          <td class="${status.toLowerCase()}">${status}</td>
        </tr>
      `).join('');

      const editWindowHtml = `
        <html>
          <head>
            <title>Configure VLAN - {interfaceName}</title>
            <style>${editStyleContent}</style>
          </head>
          <body>
            <h3>Configure VLAN - {interfaceName}</h3>
            <div>
              <label>VLAN Mode: </label>
              <select id="vlanMode">
                <option value="access">Access</option>
                <option value="trunk">Trunk</option>
              </select>
            </div>
            <div id="vlanField" style="display: none;">
              <label>Access VLAN: </label>
              <input type="number" id="accessVlan" min="1" max="4094" value="1">
            </div>
            <div id="trunkField" style="display: none;">
              <label>Trunk VLAN: </label>
              <input type="number" id="trunkVlan" min="1" max="4094" value="1">
            </div>
            <button onclick="saveConfig('{interfaceName}', '{switchType}')">Save</button>
            <div class="vlan-form">
              <h4>Create New VLAN</h4>
              <form id="vlanCreateForm">
                <div>
                  <label>VLAN ID: </label>
                  <input type="number" id="newVlanId" min="1" max="4094" required>
                </div>
                <div>
                  <label>VLAN Name: </label>
                  <input type="text" id="newVlanName" required>
                </div>
                <button type="submit">Create VLAN</button>
              </form>
              <p id="vlanResponse"></p>
            </div>
            <script>
              console.log('Edit window script running');
              const vlanMode = document.getElementById('vlanMode');
              const accessField = document.getElementById('vlanField');
              const trunkField = document.getElementById('trunkField');
              vlanMode.addEventListener('change', function() {
                accessField.style.display = this.value === 'access' ? 'block' : 'none';
                trunkField.style.display = this.value === 'trunk' ? 'block' : 'none';
              });
              vlanMode.dispatchEvent(new Event('change'));

              document.getElementById('vlanCreateForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const vlanId = document.getElementById('newVlanId').value;
                const vlanName = document.getElementById('newVlanName').value;
                const responseElement = document.getElementById('vlanResponse');
                responseElement.style.color = 'initial';
                responseElement.textContent = 'Creating VLAN...';

                try {
                  const res = await fetch(`${window.location.origin.replace('3000', '5000')}/api/create-vlan`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ vlanId, vlanName, switchIp: '192.168.111.198' }) // Adjust IP as per GNS3 switch
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || 'Failed to create VLAN');
                  responseElement.style.color = 'green';
                  responseElement.textContent = `VLAN ${vlanId} created successfully`;
                } catch (err) {
                  responseElement.style.color = 'red';
                  responseElement.textContent = `Error: ${err.message}`;
                }
              });
            </script>
          </body>
        </html>
      `;

      const scriptContent = `
        function openEditWindow(interfaceName, switchType) {
          console.log('openEditWindow called with:', interfaceName, switchType);
          const editTab = window.open('', '_blank');
          if (editTab) {
            const htmlContent = \`${editWindowHtml.replace(/</g, '\\x3C').replace(/>/g, '\\x3E')}\`
              .replace('{interfaceName}', interfaceName)
              .replace('{switchType}', switchType);
            console.log('Generated HTML:', htmlContent);
            editTab.document.open();
            editTab.document.write(htmlContent);
            editTab.document.close();
            console.log('Edit window opened for:', interfaceName);
          } else {
            alert('Popup blocked for edit window! Please allow popups.');
          }
        }
      `.trim();

      newTab.document.open();
      newTab.document.write(`
        <html>
          <head>
            <title>${switchType} - Ports and Link Aggregation</title>
            <style>${styleContent}</style>
          </head>
          <body>
            <h2>${switchType} - Ports and Link Aggregation</h2>
            <table>
              <thead>
                <tr>
                  <th>Interface</th>
                  <th>Admin Up</th>
                </tr>
              </thead>
              <tbody>
                ${interfacesHtml}
              </tbody>
            </table>
            <script>${scriptContent}</script>
          </body>
        </html>
      `);
      newTab.document.close();
    } catch (error) {
      console.error('Fetch or write error:', error.message);
      newTab.document.write(`
        <html><body><h2>Error</h2><p>Failed to load: ${error.message}</p></body></html>
      `);
      newTab.document.close();
    }
  };

  const steps = [
    { target: '.sidebar', content: 'Navigate using this sidebar.' },
    { target: '.account-button', content: 'Access your profile here.' },
    { target: '.nav-button:nth-child(2)', content: 'Manage devices here.' },
    { target: '.nav-button:nth-child(4)', content: 'View and configure network topology here.' },
  ];

  return (
    <div
      className={`dashboard-container ${theme}`}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#FAFAD2',
        color: '#1A2A44',
      }}
    >
      <style>
        {`
          @keyframes gradientAnimation {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .nav-sub-button {
            display: block;
            width: 100%;
            padding: 10px;
            background: rgba(250, 250, 210, 0.1);
            border: none;
            color: #1A2A44;
            text-align: left;
            cursor: pointer;
            transition: background 0.3s;
          }
          .nav-sub-button:hover {
            background: rgba(250, 250, 210, 0.2);
          }
          .nav-sub-list {
            list-style: none;
            padding-left: 20px;
            margin: 0;
          }
          .account-panel h4,
          .account-panel p,
          .profile-edit-card,
          .section-header,
          .config-section h3,
          .config-subsection h4,
          .device-item {
            color: #1A2A44;
          }
          .login-btn {
            background: linear-gradient(45deg, #1e3a8a, #3b82f6);
            color: #fff;
          }
          .login-btn:hover {
            background: linear-gradient(45deg, #3b82f6, #1e3a8a);
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
          <div className="sidebar-header">{isMenuOpen && <h3>Menu</h3>}<button onClick={toggleMenu} className="sidebar-toggle">☰</button></div>
          <ul className="nav-list">
            <li className="nav-item"><button onClick={() => setActiveSection('home')} className={`nav-button ${activeSection === 'home' ? 'active' : ''}`}><span className="nav-icon">🏠</span>{isMenuOpen && 'Home'}</button></li>
            <li className="nav-item">
              <button onClick={() => toggleSection('devices')} className={`nav-button ${activeSection.startsWith('devices') ? 'active' : ''}`}><span className="nav-icon">💻</span>{isMenuOpen && 'Devices'}</button>
              {isMenuOpen && expandedSection === 'devices' && (
                <ul className="nav-sub-list">
                  <li className="nav-sub-item"><button onClick={() => setActiveSection('switching')} className="nav-sub-button">Switching</button></li>
                  <li className="nav-sub-item"><button onClick={() => setActiveSection('routing')} className="nav-sub-button">Routing</button></li>
                  <li className="nav-sub-item"><button onClick={() => setActiveSection('nat')} className="nav-sub-button">NAT</button></li>
                  <li className="nav-sub-item"><button onClick={() => setActiveSection('dhcp')} className="nav-sub-button">DHCP</button></li>
                </ul>
              )}
            </li>
            <li className="nav-item"><button onClick={() => setActiveSection('topology')} className={`nav-button ${activeSection === 'topology' ? 'active' : ''}`}><span className="nav-icon">🌐</span>{isMenuOpen && 'Topology'}</button></li>
            <li className="nav-item"><button onClick={() => setActiveSection('settings')} className={`nav-button ${activeSection === 'settings' ? 'active' : ''}`}><span className="nav-icon">⚙️</span>{isMenuOpen && 'Settings'}</button></li>
            {userProfile.role === 'Admin' && <li className="nav-item"><button onClick={() => setActiveSection('audit')} className={`nav-button ${activeSection === 'audit' ? 'active' : ''}`}><span className="nav-icon">📋</span>{isMenuOpen && 'Audit Logs'}</button></li>}
            <li className="nav-item"><button onClick={() => setActiveSection('help')} className={`nav-button ${activeSection === 'help' ? 'active' : ''}`}><span className="nav-icon">❓</span>{isMenuOpen && 'Help'}</button></li>
            {userProfile.role === 'Developer' && <li className="nav-item"><button onClick={() => setActiveSection('developer')} className={`nav-button ${activeSection === 'developer' ? 'active' : ''}`}><span className="nav-icon">👨‍💻</span>{isMenuOpen && 'Developer Dashboard'}</button></li>}
            <li className="nav-item"><button onClick={handleLogout} className="nav-button"><span className="nav-icon">🚪</span>{isMenuOpen && 'Logout'}</button></li>
          </ul>
        </div>
        <div className="main-content" style={{ flex: 1, padding: '40px', background: 'rgba(250, 250, 210, 0.05)', color: '#1A2A44' }}>
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
                  <div className="form-group"><label>Password:</label><input type="password" name="password" className="form-input" /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    <button type="submit" className="login-btn">Save</button>
                    <button type="button" onClick={() => setIsProfileEditOpen(false)} className="login-btn" style={{ background: '#ef4444' }}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {activeSection === 'home' && (
            <div style={{ position: 'relative', minHeight: '80vh' }}>
              <h2 className="section-header">Dashboard - Network Automation</h2>
              <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(250, 250, 210, 0.2)', borderRadius: '12px' }}>
                <p style={{ color: '#1A2A44', fontSize: '18px', marginBottom: '10px' }}>Welcome, {userProfile.username}!</p>
                <p style={{ color: 'rgba(26, 42, 68, 0.8)', fontSize: '16px' }}>This is your centralized hub for network management.</p>
              </div>
            </div>
          )}
          {activeSection === 'switching' && (
            <div>
              <h2 className="section-header">Switching</h2>
              <div className="config-section">
                <h3>Switch Types</h3>
                <ul className="device-list">
                  <li className="device-item" style={{ cursor: 'pointer' }} onClick={() => openSwitchDetails('Cisco 3725')}>
                    Cisco 3725
                  </li>
                </ul>
              </div>
            </div>
          )}
          {activeSection === 'routing' && (
            <div><h2 className="section-header">Routing</h2><p style={{ color: '#1A2A44', fontSize: '16px' }}>Content for routing configuration.</p></div>
          )}
          {activeSection === 'nat' && (
            <div><h2 className="section-header">NAT</h2><p style={{ color: '#1A2A44', fontSize: '16px' }}>Content for NAT configuration.</p></div>
          )}
          {activeSection === 'dhcp' && (
            <div><h2 className="section-header">DHCP</h2><p style={{ color: '#1A2A44', fontSize: '16px' }}>Content for DHCP configuration.</p></div>
          )}
          {activeSection === 'topology' && (
            <Topology
              devices={devices}
              theme={theme}
              API_URL={API_URL}
              setError={setError}
              setMessage={setMessage}
            />
          )}
          {activeSection === 'settings' && (
            <div><h2 className="section-header">Settings</h2><p style={{ color: '#1A2A44', fontSize: '16px' }}>Content for settings configuration.</p></div>
          )}
          {activeSection === 'audit' && userProfile.role === 'Admin' && (
            <div><h2 className="section-header">Audit Logs</h2><ul className="device-list">{[1, 2, 3].map((i) => <li key={i} className="device-item">Log Entry {i}</li>)}</ul></div>
          )}
          {activeSection === 'help' && (
            <div><h2 className="section-header">Help</h2><div className="config-section"><h3>Tutorials</h3><p style={{ color: '#1A2A44', fontSize: '16px' }}>Learn how to use the dashboard.</p></div></div>
          )}
          {userProfile.role === 'Developer' && activeSection === 'developer' && (
            <div><h2 className="section-header">Developer Dashboard</h2><div className="config-section"><h3>API Testing</h3><p style={{ color: '#1A2A44', fontSize: '16px' }}>Test your API endpoints here.</p></div></div>
          )}
        </div>
      </div>
      <Tooltip id="main-tooltip" place="top" effect="solid" />
      <Joyride steps={steps} run={runTour} continuous showSkipButton styles={{ options: { primaryColor: '#3b82f6' } }} />
    </div>
  );
};

export default Dashboard;
