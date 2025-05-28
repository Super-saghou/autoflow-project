import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import Particles from '@tsparticles/react';
import type { Engine } from 'tsparticles-engine'; // Updated to type-only import
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
  const [userProfile, setUserProfile] = useState({ username: 'Sarra', email: 'sarra@example.com', role: 'Admin' });
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
        if (!response.ok) throw new Error('Erreur lors de la récupération des appareils');
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
      if (!response.ok) throw new Error((await response.json()).message || 'Erreur lors de l’ajout');
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
    setMessage('Profil mis à jour avec succès !');
  };
  const toggleSection = (section) => setExpandedSection(expandedSection === section ? null : section);
  const validateForm = () => {
    const errors = { name: '', ip: '' };
    let isValid = true;
    if (!newDevice.name) { errors.name = 'Le nom est requis'; isValid = false; }
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!newDevice.ip || !ipRegex.test(newDevice.ip)) { errors.ip = 'Adresse IP invalide'; isValid = false; }
    setFormErrors(errors);
    return isValid;
  };
  const fetchVersions = async (deviceName) => {
    try {
      const response = await fetch(`${API_URL}/api/devices/versions/${deviceName}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des versions');
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
    { target: '.sidebar', content: 'Naviguez avec cette barre latérale.' },
    { target: '.account-button', content: 'Accédez à votre profil ici.' },
    { target: '.nav-button:nth-child(2)', content: 'Gérez les configurations ici.' },
  ];

  return (
    <div className={`dashboard-container ${theme}`}>
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          background: { color: { value: 'transparent' } },
          fpsLimit: 60,
          particles: {
            number: { value: 50, density: { enable: true, value_area: 800 } },
            color: { value: '#DAA520' },
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
      <div className="sidebar" style={{ width: isMenuOpen ? '280px' : '80px' }}>
        <div className="sidebar-header">{isMenuOpen && <h3>Menu</h3>}<button onClick={toggleMenu} className="sidebar-toggle">{isMenuOpen ? '←' : '→'}</button></div>
        <ul className="nav-list">
          <li className="nav-item"><button onClick={() => setActiveSection('home')} className={`nav-button ${activeSection === 'home' ? 'active' : ''}`}><span className="nav-icon">🏠</span>{isMenuOpen && 'Home'}</button></li>
          {userProfile.role === 'Admin' && <li className="nav-item"><button onClick={() => setActiveSection('configuration')} className={`nav-button ${activeSection === 'configuration' ? 'active' : ''}`}><span className="nav-icon">⚙️</span>{isMenuOpen && 'Configuration'}</button></li>}
          <li className="nav-item"><button onClick={() => setActiveSection('devices')} className={`nav-button ${activeSection === 'devices' ? 'active' : ''}`}><span className="nav-icon">📡</span>{isMenuOpen && 'Devices'}</button></li>
          <li className="nav-item"><button onClick={() => setActiveSection('automation')} className={`nav-button ${activeSection === 'automation' ? 'active' : ''}`}><span className="nav-icon">🤖</span>{isMenuOpen && 'Automation'}</button></li>
          <li className="nav-item"><button onClick={() => setActiveSection('settings')} className={`nav-button ${activeSection === 'settings' ? 'active' : ''}`}><span className="nav-icon">🔧</span>{isMenuOpen && 'Settings'}</button></li>
          {userProfile.role === 'Admin' && <li className="nav-item"><button onClick={() => setActiveSection('audit')} className={`nav-button ${activeSection === 'audit' ? 'active' : ''}`}><span className="nav-icon">📜</span>{isMenuOpen && 'Audit Logs'}</button></li>}
          <li className="nav-item"><button onClick={() => setActiveSection('help')} className={`nav-button ${activeSection === 'help' ? 'active' : ''}`}><span className="nav-icon">❓</span>{isMenuOpen && 'Help'}</button></li>
          {userProfile.role === 'Developer' && <li className="nav-item"><button onClick={() => setActiveSection('developer')} className={`nav-button ${activeSection === 'developer' ? 'active' : ''}`}><span className="nav-icon">💻</span>{isMenuOpen && 'Developer'}</button></li>}
          <li className="nav-item"><button onClick={handleLogout} className="nav-button"><span className="nav-icon">🚪</span>{isMenuOpen && 'Logout'}</button></li>
        </ul>
      </div>
      <div className="main-content">
        <button
          onClick={toggleAccount}
          className="account-button"
          data-tooltip-id="main-tooltip"
          data-tooltip-content="Accéder à votre profil"
        >
          👤
        </button>
        {isAccountOpen && (
          <div className="account-panel">
            <h4>Mon Compte</h4>
            <p>Utilisateur : {userProfile.username}</p>
            <p>Email : {userProfile.email}</p>
            <p>Rôle : {userProfile.role}</p>
            <div className="form-group">
              <label>Thème :</label>
              <select value={theme} onChange={(e) => changeTheme(e.target.value)} className="form-input">
                <option value="default">Défaut</option>
                <option value="dark">Sombre</option>
                <option value="blue">Bleu</option>
                <option value="green">Vert</option>
              </select>
            </div>
            <button onClick={openProfileEdit} className="login-btn">Modifier le Profil</button>
          </div>
        )}
        {isProfileEditOpen && (
          <div className="profile-edit-panel">
            <div className="profile-edit-card">
              <h3>Modifier Mon Profil</h3>
              <form onSubmit={handleProfileUpdate}>
                <div className="form-group"><label>Nom :</label><input type="text" name="username" defaultValue={userProfile.username} className="form-input" /></div>
                <div className="form-group"><label>Email :</label><input type="email" name="email" defaultValue={userProfile.email} className="form-input" /></div>
                <div className="form-group"><label>Mot de passe :</label><input type="password" name="password" placeholder="Nouveau (facultatif)" className="form-input" /></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}><button type="submit" className="login-btn">Sauvegarder</button><button type="button" onClick={() => setIsProfileEditOpen(false)} className="login-btn" style={{ background: 'linear-gradient(45deg, #D2B48C, #8B4513)' }}>Annuler</button></div>
              </form>
            </div>
          </div>
        )}
        {activeSection === 'home' && (
          <div style={{ position: 'relative', minHeight: '80vh' }}>
            <h2 className="section-header">Tableau de Bord - Automatisation Réseau</h2>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: '40px', fontSize: '16px' }}>Bienvenue, {userProfile.username} !</p>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%', height: '200px', background: 'linear-gradient(45deg, #DAA520, #8B4513)', borderRadius: '20px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)', animation: 'pulse 2s ease-in-out infinite' }}>
              <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'url(https://media.giphy.com/media/l0HlRnAWXxn0MhKLK/giphy.gif) no-repeat center center', backgroundSize: 'contain', opacity: 0.7, animation: 'move 4s linear infinite' }} />
              <style>{`@keyframes pulse { 0%, 100% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, -50%) scale(1.05); } } @keyframes move { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}</style>
            </div>
          </div>
        )}
        {activeSection === 'configuration' && userProfile.role === 'Admin' && (
          <div><h2 className="section-header">Configuration</h2><div className="config-section"><h3 onClick={() => toggleSection('switching')}>Switching<span>{expandedSection === 'switching' ? '▼' : '▶'}</span></h3>{expandedSection === 'switching' && (<div><div className="config-subsection"><h4>Cisco Catalyst 2950</h4><form className="login-form"><div className="form-group"><label>Nom :</label><input type="text" className="form-input" placeholder="Ex: Switch-2950-1" /></div><div className="form-group"><label>IP :</label><input type="text" className="form-input" placeholder="Ex: 192.168.245.139" /></div><button type="submit" className="login-btn">Configurer</button></form></div><div className="config-subsection"><h4>Cisco Catalyst 3750</h4><form className="login-form"><div className="form-group"><label>Nom :</label><input type="text" className="form-input" placeholder="Ex: Switch-3750-1" /></div><div className="form-group"><label>IP :</label><input type="text" className="form-input" placeholder="Ex: 192.168.245.140" /></div><button type="submit" className="login-btn">Configurer</button></form></div><div className="config-subsection"><h4>Cisco Catalyst 9300</h4><form className="login-form"><div className="form-group"><label>Nom :</label><input type="text" className="form-input" placeholder="Ex: Switch-9300-1" /></div><div className="form-group"><label>IP :</label><input type="text" className="form-input" placeholder="Ex: 192.168.245.141" /></div><button type="submit" className="login-btn">Configurer</button></form></div></div>)}</div><div className="config-section"><h3 onClick={() => toggleSection('routing')}>Routing<span>{expandedSection === 'routing' ? '▼' : '▶'}</span></h3>{expandedSection === 'routing' && (<div><div className="config-subsection"><h4>Cisco ISR 1000</h4><form className="login-form"><div className="form-group"><label>Nom :</label><input type="text" className="form-input" placeholder="Ex: Router-ISR1000-1" /></div><div className="form-group"><label>IP :</label><input type="text" className="form-input" placeholder="Ex: 192.168.245.142" /></div><button type="submit" className="login-btn">Configurer</button></form></div><div className="config-subsection"><h4>Cisco ISR 4000</h4><form className="login-form"><div className="form-group"><label>Nom :</label><input type="text" className="form-input" placeholder="Ex: Router-ISR4000-1" /></div><div className="form-group"><label>IP :</label><input type="text" className="form-input" placeholder="Ex: 192.168.245.143" /></div><button type="submit" className="login-btn">Configurer</button></form></div><div className="config-subsection"><h4>Cisco ASR 1000</h4><form className="login-form"><div className="form-group"><label>Nom :</label><input type="text" className="form-input" placeholder="Ex: Router-ASR1000-1" /></div><div className="form-group"><label>IP :</label><input type="text" className="form-input" placeholder="Ex: 192.168.245.144" /></div><button type="submit" className="login-btn">Configurer</button></form></div></div>)}</div><div className="config-section"><h3 onClick={() => toggleSection('firewalling')}>Firewalling<span>{expandedSection === 'firewalling' ? '▼' : '▶'}</span></h3>{expandedSection === 'firewalling' && (<div><div className="config-subsection"><h4>Cisco ASA 5505</h4><form className="login-form"><div className="form-group"><label>Nom :</label><input type="text" className="form-input" placeholder="Ex: Firewall-ASA5505-1" /></div><div className="form-group"><label>IP :</label><input type="text" className="form-input" placeholder="Ex: 192.168.245.145" /></div><button type="submit" className="login-btn">Configurer</button></form></div><div className="config-subsection"><h4>Cisco Firepower 2100</h4><form className="login-form"><div className="form-group"><label>Nom :</label><input type="text" className="form-input" placeholder="Ex: Firewall-FP2100-1" /></div><div className="form-group"><label>IP :</label><input type="text" className="form-input" placeholder="Ex: 192.168.245.146" /></div><button type="submit" className="login-btn">Configurer</button></form></div><div className="config-subsection"><h4>Palo Alto PA-220</h4><form className="login-form"><div className="form-group"><label>Nom :</label><input type="text" className="form-input" placeholder="Ex: Firewall-PA220-1" /></div><div className="form-group"><label>IP :</label><input type="text" className="form-input" placeholder="Ex: 192.168.245.147" /></div><button type="submit" className="login-btn">Configurer</button></form></div></div>)}</div><div className="config-section"><h3 onClick={() => toggleSection('dhcp')}>DHCP<span>{expandedSection === 'dhcp' ? '▼' : '▶'}</span></h3>{expandedSection === 'dhcp' && (<div><div className="config-subsection"><h4>DHCP Server on Cisco Router</h4><form className="login-form"><div className="form-group"><label>Nom :</label><input type="text" className="form-input" placeholder="Ex: DHCP-Cisco-1" /></div><div className="form-group"><label>IP :</label><input type="text" className="form-input" placeholder="Ex: 192.168.245.148" /></div><button type="submit" className="login-btn">Configurer</button></form></div><div className="config-subsection"><h4>DHCP Server on Windows Server</h4><form className="login-form"><div className="form-group"><label>Nom :</label><input type="text" className="form-input" placeholder="Ex: DHCP-WinServer-1" /></div><div className="form-group"><label>IP :</label><input type="text" className="form-input" placeholder="Ex: 192.168.245.149" /></div><button type="submit" className="login-btn">Configurer</button></form></div></div>)}</div><div className="config-section"><h3 onClick={() => toggleSection('nat')}>NAT<span>{expandedSection === 'nat' ? '▼' : '▶'}</span></h3>{expandedSection === 'nat' && (<div><div className="config-subsection"><h4>NAT on Cisco Router</h4><form className="login-form"><div className="form-group"><label>Nom :</label><input type="text" className="form-input" placeholder="Ex: NAT-Cisco-1" /></div><div className="form-group"><label>IP :</label><input type="text" className="form-input" placeholder="Ex: 192.168.245.150" /></div><button type="submit" className="login-btn">Configurer</button></form></div><div className="config-subsection"><h4>NAT on Firewall</h4><form className="login-form"><div className="form-group"><label>Nom :</label><input type="text" className="form-input" placeholder="Ex: NAT-Firewall-1" /></div><div className="form-group"><label>IP :</label><input type="text" className="form-input" placeholder="Ex: 192.168.245.151" /></div><button type="submit" className="login-btn">Configurer</button></form></div></div>)}</div></div>
        )}
        {activeSection === 'devices' && (
          <div><h2 className="section-header">Appareils</h2><div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}><button className="login-btn" onClick={() => window.location.href = `${API_URL}/api/config/export`}>Exporter Configurations</button><label className="login-btn" style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>Importer Configurations<input type="file" accept=".json" style={{ display: 'none' }} onChange={async (e) => { const file = e.target.files[0]; const configs = JSON.parse(await file.text()); await fetch(`${API_URL}/api/config/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(configs) }); setMessage('Configurations importées'); }} /></label></div><div className="form-group"><h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Appareils Configurés</h3>{isLoading ? (<ul className="device-list">{[...Array(3)].map((_, index) => (<li key={index} className="device-item"><div className="skeleton skeleton-text" style={{ width: '60%' }}></div><div className="skeleton skeleton-button"></div></li>))}</ul>) : devices.length > 0 ? (<ul className="device-list">{devices.map((device, index) => (<li key={index} className="device-item"><span>{device.name} ({device.ip})</span><div style={{ display: 'flex', gap: '10px' }}><button data-tooltip-id="main-tooltip" data-tooltip-content="Voir l'historique" className="login-btn" style={{ padding: '8px 15px', fontSize: '14px' }} onClick={() => fetchVersions(device.name)}>Version History</button><button data-tooltip-id="main-tooltip" data-tooltip-content="Configurer" className="login-btn" style={{ padding: '8px 15px', fontSize: '14px' }} onClick={() => alert(`Configuration pour ${device.name}`)}>Configurer</button></div></li>))}</ul>) : (<p style={{ color: '#666', fontSize: '16px' }}>Aucun appareil.</p>)}{selectedDevice && (<div className="config-section"><h3>Version History for {selectedDevice}</h3><ul className="device-list">{versions.map((version, index) => (<li key={index} className="device-item"><span>Version {version.version} - {new Date(version.timestamp).toLocaleString()}</span><button className="login-btn" style={{ padding: '8px 15px', fontSize: '14px' }} onClick={() => alert(`Rollback to ${version.version}`)}>Rollback</button></li>))}</ul></div>)}</div><form onSubmit={handleAddDevice} className="login-form"><h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Ajouter un Appareil</h3><div className="form-group"><label>Nom :</label><input type="text" value={newDevice.name} onChange={(e) => { setNewDevice({ ...newDevice, name: e.target.value }); validateForm(); }} className={`form-input ${formErrors.name ? 'invalid' : newDevice.name ? 'valid' : ''}`} placeholder="Ex: Routeur 1" required /><p className="error-message">{formErrors.name}</p></div><div className="form-group"><label>IP :</label><input type="text" value={newDevice.ip} onChange={(e) => { setNewDevice({ ...newDevice, ip: e.target.value }); validateForm(); }} className={`form-input ${formErrors.ip ? 'invalid' : newDevice.ip ? 'valid' : ''}`} placeholder="Ex: 192.168.1.1" required /><p className="error-message">{formErrors.ip}</p></div>{message && <p style={{ color: '#2ecc71', fontSize: '14px' }}>{message}</p>}{error && <p style={{ color: '#e74c3c', fontSize: '14px' }}>{error}</p>}<button type="submit" className="login-btn">Ajouter</button></form></div>
        )}
        {activeSection === 'automation' && (
          <div><h2 className="section-header">Automatisation</h2><div className="config-section"><h3>Bibliothèque de Playbooks</h3><div className="config-subsection"><h4>Créer un VLAN</h4><form className="login-form"><div className="form-group"><label>VLAN ID :</label><input type="text" className="form-input" placeholder="Ex: 10" /></div><div className="form-group"><label>Nom :</label><input type="text" className="form-input" placeholder="Ex: VLAN_10" /></div><button type="submit" className="login-btn">Exécuter</button></form></div></div></div>
        )}
        {activeSection === 'settings' && (
          <div><h2 className="section-header">Paramètres</h2><p style={{ color: '#666', fontSize: '16px' }}>Section à développer.</p></div>
        )}
        {activeSection === 'audit' && userProfile.role === 'Admin' && (
          <div><h2 className="section-header">Audit Logs</h2><ul className="device-list">{[1, 2, 3].map(i => (<li key={i} className="device-item"><span>Utilisateur: Sarra - Action: Device Added - Détails: {JSON.stringify({ name: `Router-${i}`, ip: `192.168.1.${i}` })} at {new Date().toLocaleString()}</span></li>))}</ul></div>
        )}
        {activeSection === 'help' && (
          <div><h2 className="section-header">Aide</h2><div className="config-section"><h3>Tutoriel : Ajouter</h3><ol style={{ paddingLeft: '20px', color: '#666' }}><li>Allez à "Appareils".</li><li>Remplissez le formulaire.</li><li>Cliquez sur "Ajouter".</li></ol><a href="/docs/user-manual.pdf" target="_blank" className="login-btn" style={{ display: 'inline-block', marginTop: '15px' }}>Télécharger Manuel</a></div></div>
        )}
        {userProfile.role === 'Developer' && activeSection === 'developer' && (
          <div><h2 className="section-header">Developer Dashboard</h2><div className="config-section"><h3>System Health</h3>{health ? (<ul style={{ listStyle: 'none', padding: 0 }}><li>Server Uptime: {Math.floor(health.serverUptime)}s</li><li>MongoDB Status: {health.mongoStatus}</li><li>Kubernetes Pods: {health.kubernetesPods || 'N/A'}</li></ul>) : (<p>Loading...</p>)}</div><div className="config-section"><h3>API Testing</h3><div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}><button className="login-btn" onClick={() => testApi('/api/devices')}>Test /api/devices</button><button className="login-btn" onClick={() => testApi('/api/audit-logs')}>Test /api/audit-logs</button></div>{apiResponse && (<pre style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '10px', borderRadius: '10px', maxHeight: '300px', overflowY: 'auto' }}>{apiResponse}</pre>)}</div></div>
        )}
        <button onClick={() => setRunTour(true)} className="login-btn" style={{ position: 'absolute', top: '20px', left: '20px' }}>{theme === 'light' ? '🌙 Dark' : '☀️ Light'}</button>
      </div>
      <Tooltip id="main-tooltip" place="top" effect="solid" />
      <Joyride steps={steps} run={runTour} continuous showSkipButton styles={{ options: { primaryColor: '#DAA520', textColor: '#4A2C1A', backgroundColor: 'rgba(245, 245, 220, 0.9)', overlayColor: 'rgba(0, 0, 0, 0.5)' } }} callback={(data) => { if (data.action === 'close') setRunTour(false); }} />
    </div>
  );
};

export default Dashboard;
