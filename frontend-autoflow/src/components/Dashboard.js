import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import Particles from '@tsparticles/react';
import { loadFull } from 'tsparticles';
import { Tooltip } from 'react-tooltip';
import Joyride from 'react-joyride';
import Topology from './Topology';
import VlanModal from './VlanModal';
import InterfacesModal from './InterfacesModal';
import CreateVlanModal from './CreateVlanModal';
import DhcpModal from './DhcpModal';
import ReportsPage from '../Pages/ReportsPage';

const Dashboard = () => {
  const [devices, setDevices] = useState([]);
  const [newDevice, setNewDevice] = useState({ name: '', ip: '' });
  const [activeSection, setActiveSection] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [userProfile, setUserProfile] = useState({ username: 'Sarra', email: 'sarra.bngharbia@gmail.com', role: 'Admin' });
  const [expandedSection, setExpandedSection] = useState(null);
  const [theme, setTheme] = useState('default');
  const [runTour, setRunTour] = useState(true);
  const [modalInterfaceName, setModalInterfaceName] = useState('');
  const [modalSwitchType, setModalSwitchType] = useState('');
  const [createVlanModalOpen, setCreateVlanModalOpen] = useState(false);
  const [modalInterfaces, setModalInterfaces] = useState([]);
  const [isLoadingInterfaces, setIsLoadingInterfaces] = useState(false);
  const [dhcpModalOpen, setDhcpModalOpen] = useState(false);
  const [activeSwitchSubsection, setActiveSwitchSubsection] = useState(null);
  const [hostname, setHostname] = useState('');
  const [mgmtIp, setMgmtIp] = useState('');
  const [hostnameStatus, setHostnameStatus] = useState('');
  const [dhcpSnoopingEnabled, setDhcpSnoopingEnabled] = useState(false);
  const [trustedPorts, setTrustedPorts] = useState(['Fa0/1']);
  const [newTrustedPort, setNewTrustedPort] = useState('');
  const [dhcpSnoopStatus, setDhcpSnoopStatus] = useState('');
  const [sshEnabled, setSshEnabled] = useState(true);
  const [sshPort, setSshPort] = useState(22);
  const [sshAllowedIps, setSshAllowedIps] = useState(['192.168.1.100']);
  const [newSshIp, setNewSshIp] = useState('');
  const [sshStatusMsg, setSshStatusMsg] = useState('');
  const [portSecurityTable, setPortSecurityTable] = useState([
    { port: 'Fa0/1', enabled: true, maxMac: 2, violation: 'Shutdown' },
    { port: 'Fa0/2', enabled: false, maxMac: 1, violation: 'Restrict' },
    { port: 'Fa0/3', enabled: true, maxMac: 3, violation: 'Protect' },
  ]);
  const [portSecStatusMsg, setPortSecStatusMsg] = useState('');
  const [routingTable, setRoutingTable] = useState([
    { destination: '192.168.10.0/24', nextHop: '10.0.0.1', iface: 'Fa0/1', desc: 'Office LAN' },
    { destination: '10.10.0.0/16', nextHop: '10.0.0.2', iface: 'Fa0/2', desc: 'Data Center' },
  ]);
  const [newRoute, setNewRoute] = useState({ destination: '', nextHop: '', iface: '', desc: '' });
  const [dynamicRouting, setDynamicRouting] = useState(false);
  const [routingStatusMsg, setRoutingStatusMsg] = useState('');
  const [natTable, setNatTable] = useState([
    { type: 'Static', source: '192.168.10.10', dest: '203.0.113.10', translated: '203.0.113.10', desc: 'Server NAT' },
    { type: 'Dynamic', source: '192.168.10.0/24', dest: '203.0.113.0/24', translated: '203.0.113.100-200', desc: 'User NAT Pool' },
  ]);
  const [newNat, setNewNat] = useState({ type: 'Static', source: '', dest: '', translated: '', desc: '' });
  const [natEnabled, setNatEnabled] = useState(true);
  const [natStatusMsg, setNatStatusMsg] = useState('');
  const [dhcpEnabled, setDhcpEnabled] = useState(true);
  const [dhcpPools, setDhcpPools] = useState([
    { name: 'Office', network: '192.168.10.0/24', range: '192.168.10.100-200', gateway: '192.168.10.1', dns: '8.8.8.8', leases: 12 },
    { name: 'Lab', network: '10.10.0.0/16', range: '10.10.0.100-250', gateway: '10.10.0.1', dns: '1.1.1.1', leases: 5 },
  ]);
  const [newDhcpPool, setNewDhcpPool] = useState({ name: '', network: '', range: '', gateway: '', dns: '', leases: 0 });
  const [dhcpStatusMsg, setDhcpStatusMsg] = useState('');
  const [stpEnabled, setStpEnabled] = useState(true);
  const [stpMode, setStpMode] = useState('PVST');
  const [stpPorts, setStpPorts] = useState([
    { port: 'Fa0/1', role: 'Root', state: 'Forwarding', edge: true },
    { port: 'Fa0/2', role: 'Designated', state: 'Forwarding', edge: false },
    { port: 'Fa0/3', role: 'Alternate', state: 'Blocking', edge: false },
  ]);
  const [stpStatusMsg, setStpStatusMsg] = useState('');
  const [etherChannelEnabled, setEtherChannelEnabled] = useState(true);
  const [etherChannelMode, setEtherChannelMode] = useState('LACP');
  const [etherChannelGroups, setEtherChannelGroups] = useState([
    { id: 1, name: 'Po1', mode: 'LACP', ports: ['Fa0/1', 'Fa0/2'], status: 'Up' },
    { id: 2, name: 'Po2', mode: 'PAgP', ports: ['Fa0/3', 'Fa0/4'], status: 'Down' },
  ]);
  const [newEtherChannel, setNewEtherChannel] = useState({ name: '', mode: 'LACP', ports: [] });
  const [etherChannelStatusMsg, setEtherChannelStatusMsg] = useState('');
  const [vlanModalOpen, setVlanModalOpen] = useState(false);
  const [interfacesModalOpen, setInterfacesModalOpen] = useState(false);
  const [availablePorts, setAvailablePorts] = useState(['Fa0/5', 'Fa0/6', 'Fa0/7', 'Fa0/8']);
  const deviceSubsections = [
    { key: 'vlans', title: 'VLANs (Virtual LANs)' },
    { key: 'ports', title: 'Access and Trunk Ports' },
    { key: 'stp', title: 'Spanning Tree Protocol (STP) Settings' },
    { key: 'portSecurity', title: 'Port Security' },
    { key: 'etherchannel', title: 'EtherChannel (Link Aggregation)' },
    { key: 'macTable', title: 'MAC Address Table Management' },
    { key: 'hostname', title: 'Switch Hostname and Management IP' },
    { key: 'ssh', title: 'SSH and Remote Access' },
    { key: 'dhcpSnooping', title: 'DHCP Snooping (Basic Security)' },
    { key: 'routing', title: 'Routing' },
    { key: 'nat', title: 'NAT' },
    { key: 'dhcp', title: 'DHCP' },
  ];
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const [error, setError] = useState(null);
  const [health, setHealth] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchDevices = async () => {
      setIsLoadingInterfaces(true);
      try {
        const response = await fetch(`${API_URL}/api/devices`);
        if (!response.ok) throw new Error('Error fetching devices');
        const data = await response.json();
        setDevices(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoadingInterfaces(false);
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
  const changeTheme = (newTheme) => setTheme(newTheme);
  const particlesInit = async (engine) => {
    await loadFull(engine);
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
        body {
          font-family: 'Inter', 'Poppins', 'Roboto', Arial, sans-serif;
          background: #F5F5F7;
          color: #1A2A44;
          padding: 0;
          margin: 0;
          min-height: 100vh;
        }
        .interfaces-container {
          background: #F5F5F7;
          border-radius: 24px;
          box-shadow: 0 8px 32px rgba(30, 58, 138, 0.08);
          padding: 40px 32px;
          margin: 40px auto;
          max-width: 900px;
        }
        h2 {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 32px;
          background: linear-gradient(45deg, #1e3a8a, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-align: left;
        }
        table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(30, 58, 138, 0.04);
        }
        th, td {
          padding: 16px 18px;
          text-align: left;
        }
        th {
          background: #F5F5F7;
          color: #1e3a8a;
          font-size: 16px;
          font-weight: 700;
          border-bottom: 2px solid #e0e0e0;
        }
        td {
          background: #fff;
          color: #1A2A44;
          border-bottom: 1px solid #f0f0f0;
        }
        tr:last-child td {
          border-bottom: none;
        }
        .up, .down {
          color: #10b981;
          cursor: pointer;
          text-decoration: underline;
          font-weight: 600;
        }
        .up:hover, .down:hover {
          color: #f97316;
        }
      `;

      const editStyleContent = `
        body {
          font-family: 'Inter', 'Poppins', 'Roboto', Arial, sans-serif;
          background: #F5F5F7;
          color: #1A2A44;
          padding: 0;
          margin: 0;
          min-height: 100vh;
        }
        .vlan-modern-flex {
          display: flex;
          flex-direction: row;
          gap: 40px;
          align-items: flex-start;
          margin: 48px auto;
          max-width: 1100px;
        }
        .vlan-modern-card {
          background: rgba(255,255,255,0.85);
          border-radius: 28px;
          box-shadow: 0 8px 32px rgba(30, 58, 138, 0.10);
          padding: 48px 40px;
          width: 480px;
          border: 1.5px solid rgba(30, 58, 138, 0.08);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .vlan-modern-card h3, .vlan-modern-card h4 {
          font-size: 26px;
          font-weight: 700;
          margin-bottom: 28px;
          background: linear-gradient(45deg, #1e3a8a, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-align: left;
        }
        .vlan-modern-card label {
          font-size: 16px;
          font-weight: 600;
          color: #1A2A44;
          margin-bottom: 10px;
          display: block;
        }
        .vlan-modern-card select, .vlan-modern-card input[type="number"], .vlan-modern-card input[type="text"] {
          width: 100%;
          height: 48px;
          padding: 12px 16px;
          border: 1.5px solid rgba(30, 58, 138, 0.10);
          border-radius: 16px;
          font-size: 18px;
          background: rgba(245, 245, 247, 0.7);
          color: #1A2A44;
          margin-bottom: 22px;
          transition: all 0.3s ease;
          box-shadow: inset 0 2px 4px rgba(30, 58, 138, 0.03);
        }
        .vlan-modern-card select:focus, .vlan-modern-card input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.15);
          background: #fff;
        }
        .vlan-modern-card button {
          background: linear-gradient(90deg, #1e3a8a 0%, #3b82f6 100%);
          color: #fff;
          padding: 16px 0;
          border: none;
          border-radius: 16px;
          cursor: pointer;
          font-size: 18px;
          font-weight: 700;
          transition: all 0.2s;
          box-shadow: 0 4px 15px rgba(30, 58, 138, 0.10);
          width: 100%;
          margin-top: 12px;
        }
        .vlan-modern-card button:hover {
          background: linear-gradient(90deg, #3b82f6 0%, #1e3a8a 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(30, 58, 138, 0.18);
        }
        .vlan-modern-divider {
          width: 2px;
          background: linear-gradient(180deg, #e0e7ef 0%, #c7d2fe 100%);
          height: 340px;
          border-radius: 1px;
          margin: 0 24px;
        }
        #vlanResponse {
          margin-top: 12px;
          font-size: 16px;
        }
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
            <div class="vlan-modern-flex">
              <div class="vlan-modern-card">
            <h3>Configure VLAN - {interfaceName}</h3>
            <div>
                  <label>VLAN Mode</label>
              <select id="vlanMode">
                <option value="access">Access</option>
                <option value="trunk">Trunk</option>
              </select>
            </div>
            <div id="vlanField" style="display: none;">
                  <label>Access VLAN</label>
              <input type="number" id="accessVlan" min="1" max="4094" value="1">
            </div>
            <div id="trunkField" style="display: none;">
                  <label>Trunk VLAN</label>
              <input type="number" id="trunkVlan" min="1" max="4094" value="1">
            </div>
            <button onclick="saveConfig('{interfaceName}', '{switchType}')">Save</button>
              </div>
              <div class="vlan-modern-divider"></div>
              <div class="vlan-modern-card">
              <h4>Create New VLAN</h4>
              <form id="vlanCreateForm">
                <div>
                    <label>VLAN ID</label>
                  <input type="number" id="newVlanId" min="1" max="4094" required>
                </div>
                <div>
                    <label>VLAN Name</label>
                  <input type="text" id="newVlanName" required>
                </div>
                <button type="submit">Create VLAN</button>
              </form>
              <p id="vlanResponse"></p>
              </div>
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

              document.getElementById('vlanCreateForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                const vlanId = document.getElementById('newVlanId').value;
                const vlanName = document.getElementById('newVlanName').value;
                const responseElement = document.getElementById('vlanResponse');
                responseElement.style.color = 'initial';
                responseElement.textContent = 'Creating VLAN...';
                try {
                  const res = await fetch(window.location.origin.replace('3000', '5000') + '/api/create-vlan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ vlanId: vlanId, vlanName: vlanName, switchIp: '192.168.111.198' }) // Adjust IP as per GNS3 switch
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || 'Failed to create VLAN');
                  responseElement.style.color = 'green';
                  responseElement.textContent = 'VLAN ' + vlanId + ' created successfully';
                } catch (err) {
                  responseElement.style.color = 'red';
                  responseElement.textContent = 'Error: ' + err.message;
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

  const handleAssignToInterface = async () => {
    console.log('handleAssignToInterface called');
    setCreateVlanModalOpen(false);
    
    // If we already have interfaces from pre-fetch, use them immediately
    if (modalInterfaces.length > 0) {
      console.log('Using pre-fetched interfaces:', modalInterfaces);
      setInterfacesModalOpen(true);
      return;
    }
    
    // Otherwise, fetch them now
    setIsLoadingInterfaces(true);
    
    try {
      console.log('Fetching real interfaces for assignment...');
      const response = await fetch(`${API_URL}/api/interfaces/Cisco%203725`);
      console.log('Response status:', response.status);
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const interfacesData = await response.json();
      console.log('Real interfaces data:', interfacesData);
      
      // Convert the data format to match what InterfacesModal expects
      const formattedInterfaces = interfacesData.map(([name, status]) => ({
        name: name,
        status: status
      }));
      
      console.log('Formatted interfaces:', formattedInterfaces);
      setModalInterfaces(formattedInterfaces);
      console.log('Setting interfaces modal open...');
      setInterfacesModalOpen(true);
    } catch (error) {
      console.error('Error fetching interfaces:', error);
      // Fallback to default interfaces if API fails
      const fallbackInterfaces = [
        { name: 'Fa0/1', status: 'Down' },
        { name: 'Fa0/2', status: 'Down' },
        { name: 'Fa0/3', status: 'Down' },
        { name: 'Fa0/4', status: 'Down' },
      ];
      console.log('Using fallback interfaces:', fallbackInterfaces);
      setModalInterfaces(fallbackInterfaces);
      console.log('Setting interfaces modal open (fallback)...');
      setInterfacesModalOpen(true);
    } finally {
      setIsLoadingInterfaces(false);
      console.log('Loading finished, interfacesModalOpen should be:', true);
    }
  };

  const handleDhcpAssignToInterface = async () => {
    setDhcpModalOpen(false);
    setIsLoadingInterfaces(true);
    
    try {
      console.log('Fetching real interfaces for DHCP assignment...');
      const response = await fetch(`${API_URL}/api/interfaces/Cisco%203725`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const interfacesData = await response.json();
      const formattedInterfaces = interfacesData.map(([name, status]) => ({
        name: name,
        status: status
      }));
      
      setModalInterfaces(formattedInterfaces);
      setInterfacesModalOpen(true);
    } catch (error) {
      console.error('Error fetching interfaces:', error);
      setModalInterfaces([
        { name: 'Fa0/1', status: 'Down' },
        { name: 'Fa0/2', status: 'Down' },
        { name: 'Fa0/3', status: 'Down' },
        { name: 'Fa0/4', status: 'Down' },
      ]);
      setInterfacesModalOpen(true);
    } finally {
      setIsLoadingInterfaces(false);
    }
  };

  const handleVlanSave = (data) => {
    // TODO: call API to save VLAN config
    alert('Saved VLAN config: ' + JSON.stringify(data));
  };

  const handleVlanCreate = async ({ vlanId, vlanName, switchType }) => {
    try {
      const response = await fetch('http://localhost:5000/api/create-vlan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vlanId: parseInt(vlanId),
          vlanName: vlanName,
          switchIp: '192.168.111.198' // Your GNS3 switch IP
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(`✅ VLAN ${vlanId} (${vlanName}) created successfully on ${switchType}!`);
        console.log('VLAN creation result:', result);
      } else {
        alert(`❌ Error creating VLAN: ${result.error || 'Unknown error'}`);
        console.error('VLAN creation error:', result);
      }
    } catch (error) {
      alert(`❌ Network error: ${error.message}`);
      console.error('VLAN creation network error:', error);
    }
  };

  const handleInterfaceEdit = (interfaceName) => {
    setModalInterfaceName(interfaceName);
    setVlanModalOpen(true);
  };

  const openCreateVlanModal = (switchType = 'Cisco 3725') => {
    setModalSwitchType(switchType);
    setCreateVlanModalOpen(true);
  };

  const openDhcpModal = () => setDhcpModalOpen(true);

  return (
    <div
      className={`dashboard-container ${theme}`}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#F5F5F7',
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
                  <li className="nav-sub-item"><button onClick={() => setActiveSection('switching')} className="nav-sub-button">VLANs</button></li>
                  <li className="nav-sub-item"><button onClick={() => setActiveSection('ssh')} className="nav-sub-button">SSH and remote access</button></li>
                  <li className="nav-sub-item"><button onClick={() => setActiveSection('dhcpSnooping')} className="nav-sub-button">DHCP snooping (basic security)</button></li>
                  <li className="nav-sub-item"><button onClick={() => setActiveSection('macTable')} className="nav-sub-button">MAC address table management</button></li>
                  <li className="nav-sub-item"><button onClick={() => setActiveSection('hostname')} className="nav-sub-button">Switch hostname and management IP</button></li>
                  <li className="nav-sub-item"><button onClick={() => setActiveSection('stp')} className="nav-sub-button">Spanning Tree Protocol (STP) settings</button></li>
                  <li className="nav-sub-item"><button onClick={() => setActiveSection('portSecurity')} className="nav-sub-button">Port security</button></li>
                  <li className="nav-sub-item"><button onClick={() => setActiveSection('etherchannel')} className="nav-sub-button">EtherChannel (link aggregation)</button></li>
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
        <div className="main-content" style={{ flex: 1, padding: '40px', background: 'rgba(245,245,247,0.05)', color: '#1A2A44' }}>
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
            <div style={{ width: '100%', minHeight: '80vh', background: '#f7fafc', padding: '0 0 48px 0' }}>
              <div style={{
                background: 'linear-gradient(120deg, #f0f9ff 0%, #fef9c3 100%)',
                borderRadius: 36,
                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.08)',
                padding: '48px 64px',
                maxWidth: '1400px',
                margin: '48px auto 0 auto',
                color: '#1e40af',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 32,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 18 }}>
                  <div style={{ fontSize: 54, color: '#fbbf24', marginRight: 12 }}>🏠</div>
                  <div>
                    <h2 style={{ fontSize: 34, fontWeight: 800, margin: 0, color: '#1e40af', letterSpacing: 1 }}>Welcome, {userProfile.username}!</h2>
                    <p style={{ color: '#ea580c', fontSize: 18, margin: 0, marginTop: 6, maxWidth: 700 }}>
                      Your centralized hub for network management and automation. Monitor your network, configure devices, and manage your infrastructure from one place.
                    </p>
                  </div>
                </div>
                {/* First Row - 3 widgets distributed evenly */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32, marginBottom: 32 }}>
                  {/* Quick Stats */}
                  <div style={{ background: '#fff', borderRadius: 20, padding: '28px', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.06)' }}>
                    <h3 style={{ color: '#1e40af', fontWeight: 700, fontSize: 20, margin: '0 0 16px 0' }}>Quick Stats</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#ea580c', fontWeight: 600 }}>Total Devices</span>
                        <span style={{ color: '#1e40af', fontWeight: 700, fontSize: 18 }}>{devices.length}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#ea580c', fontWeight: 600 }}>Active Connections</span>
                        <span style={{ color: '#1e40af', fontWeight: 700, fontSize: 18 }}>3</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#ea580c', fontWeight: 600 }}>VLANs Configured</span>
                        <span style={{ color: '#1e40af', fontWeight: 700, fontSize: 18 }}>5</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#ea580c', fontWeight: 600 }}>System Status</span>
                        <span style={{ color: '#10b981', fontWeight: 700, fontSize: 18 }}>Healthy</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div style={{ background: '#fff', borderRadius: 20, padding: '28px', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.06)' }}>
                    <h3 style={{ color: '#1e40af', fontWeight: 700, fontSize: 20, margin: '0 0 16px 0' }}>Quick Actions</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <button
                        onClick={() => setActiveSection('topology')}
                        style={{
                          background: 'linear-gradient(90deg, #1e40af 0%, #fbbf24 100%)',
                          color: '#fff',
                          padding: '10px 16px',
                          border: 'none',
                          borderRadius: 12,
                          cursor: 'pointer',
                          fontSize: 16,
                          fontWeight: 600,
                          textAlign: 'left',
                          transition: 'all 0.2s',
                        }}
                      >
                        🌐 View Network Topology
                      </button>
                      <button
                        onClick={() => setActiveSection('switching')}
                        style={{
                          background: 'linear-gradient(90deg, #fbbf24 0%, #1e40af 100%)',
                          color: '#fff',
                          padding: '10px 16px',
                          border: 'none',
                          borderRadius: 12,
                          cursor: 'pointer',
                          fontSize: 16,
                          fontWeight: 600,
                          textAlign: 'left',
                          transition: 'all 0.2s',
                        }}
                      >
                        🔀 Configure VLANs
                      </button>
                      <button
                        onClick={() => setActiveSection('ssh')}
                        style={{
                          background: 'linear-gradient(90deg, #1e40af 0%, #fbbf24 100%)',
                          color: '#fff',
                          padding: '10px 16px',
                          border: 'none',
                          borderRadius: 12,
                          cursor: 'pointer',
                          fontSize: 16,
                          fontWeight: 600,
                          textAlign: 'left',
                          transition: 'all 0.2s',
                        }}
                      >
                        🔐 Manage SSH Access
                      </button>
                      <button
                        onClick={() => setActiveSection('dhcpSnooping')}
                        style={{
                          background: 'linear-gradient(90deg, #fbbf24 0%, #1e40af 100%)',
                          color: '#fff',
                          padding: '10px 16px',
                          border: 'none',
                          borderRadius: 12,
                          cursor: 'pointer',
                          fontSize: 16,
                          fontWeight: 600,
                          textAlign: 'left',
                          transition: 'all 0.2s',
                        }}
                      >
                        🛡️ Configure DHCP Snooping
                      </button>
                    </div>
                  </div>
                  
                  {/* System Status */}
                  <div style={{ background: '#fff', borderRadius: 20, padding: '28px', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.06)' }}>
                    <h3 style={{ color: '#1e40af', fontWeight: 700, fontSize: 20, margin: '0 0 16px 0' }}>System Status</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#ea580c', fontWeight: 600 }}>CPU Usage</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 60, height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: '25%', height: '100%', background: '#10b981' }}></div>
                          </div>
                          <span style={{ color: '#1e40af', fontWeight: 700, fontSize: 14 }}>25%</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#ea580c', fontWeight: 600 }}>Memory Usage</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 60, height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: '45%', height: '100%', background: '#fbbf24' }}></div>
                          </div>
                          <span style={{ color: '#1e40af', fontWeight: 700, fontSize: 14 }}>45%</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#ea580c', fontWeight: 600 }}>Network I/O</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 60, height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: '70%', height: '100%', background: '#8b5cf6' }}></div>
                          </div>
                          <span style={{ color: '#1e40af', fontWeight: 700, fontSize: 14 }}>70%</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#ea580c', fontWeight: 600 }}>Uptime</span>
                        <span style={{ color: '#1e40af', fontWeight: 700, fontSize: 14 }}>15d 8h 32m</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Second Row - 2 widgets distributed evenly */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 32 }}>
                  {/* Recent Activity */}
                  <div style={{ background: '#fff', borderRadius: 20, padding: '28px', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.06)' }}>
                    <h3 style={{ color: '#1e40af', fontWeight: 700, fontSize: 20, margin: '0 0 16px 0' }}>Recent Activity</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                        <div style={{ fontSize: 20, color: '#10b981' }}>✅</div>
                        <div>
                          <div style={{ color: '#1e40af', fontWeight: 600, fontSize: 14 }}>SSH access configured</div>
                          <div style={{ color: '#ea580c', fontSize: 12 }}>2 minutes ago</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                        <div style={{ fontSize: 20, color: '#fbbf24' }}>🔧</div>
                        <div>
                          <div style={{ color: '#1e40af', fontWeight: 600, fontSize: 14 }}>VLAN 10 created</div>
                          <div style={{ color: '#ea580c', fontSize: 12 }}>15 minutes ago</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                        <div style={{ fontSize: 20, color: '#8b5cf6' }}>🔗</div>
                        <div>
                          <div style={{ color: '#1e40af', fontWeight: 600, fontSize: 14 }}>EtherChannel Po1 configured</div>
                          <div style={{ color: '#ea580c', fontSize: 12 }}>1 hour ago</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                        <div style={{ fontSize: 20, color: '#ef4444' }}>⚠️</div>
                        <div>
                          <div style={{ color: '#1e40af', fontWeight: 600, fontSize: 14 }}>Port Fa0/3 went down</div>
                          <div style={{ color: '#ea580c', fontSize: 12 }}>2 hours ago</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Network Overview */}
                  <div style={{ background: '#fff', borderRadius: 20, padding: '28px', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.06)' }}>
                    <h3 style={{ color: '#1e40af', fontWeight: 700, fontSize: 20, margin: '0 0 16px 0' }}>Network Overview</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#ea580c', fontWeight: 600 }}>Active Ports</span>
                        <span style={{ color: '#1e40af', fontWeight: 700, fontSize: 18 }}>24/48</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#ea580c', fontWeight: 600 }}>Bandwidth Usage</span>
                        <span style={{ color: '#1e40af', fontWeight: 700, fontSize: 18 }}>68%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#ea580c', fontWeight: 600 }}>Security Events</span>
                        <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 18 }}>2</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#ea580c', fontWeight: 600 }}>Backup Status</span>
                        <span style={{ color: '#10b981', fontWeight: 700, fontSize: 18 }}>Up to date</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Third Row - 3 widgets distributed evenly */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32, marginTop: 32 }}>
                  {/* Device Status */}
                  <div style={{ background: '#fff', borderRadius: 20, padding: '28px', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.06)' }}>
                    <h3 style={{ color: '#1e40af', fontWeight: 700, fontSize: 20, margin: '0 0 16px 0' }}>Device Status</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#ea580c', fontWeight: 600 }}>Cisco 3725</span>
                        <span style={{ color: '#10b981', fontWeight: 700, fontSize: 16 }}>🟢 Online</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#ea580c', fontWeight: 600 }}>Aruba 2930F</span>
                        <span style={{ color: '#10b981', fontWeight: 700, fontSize: 16 }}>🟢 Online</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#ea580c', fontWeight: 600 }}>HP 2530</span>
                        <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 16 }}>🔴 Offline</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#ea580c', fontWeight: 600 }}>Juniper EX2200</span>
                        <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: 16 }}>🟡 Warning</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Network Alerts */}
                  <div style={{ background: '#fff', borderRadius: 20, padding: '28px', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.06)' }}>
                    <h3 style={{ color: '#1e40af', fontWeight: 700, fontSize: 20, margin: '0 0 16px 0' }}>Network Alerts</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                        <div style={{ fontSize: 16, color: '#ef4444' }}>⚠️</div>
                        <div>
                          <div style={{ color: '#1e40af', fontWeight: 600, fontSize: 14 }}>High CPU usage on HP 2530</div>
                          <div style={{ color: '#ea580c', fontSize: 12 }}>Critical</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                        <div style={{ fontSize: 16, color: '#fbbf24' }}>⚠️</div>
                        <div>
                          <div style={{ color: '#1e40af', fontWeight: 600, fontSize: 14 }}>Port Fa0/3 link down</div>
                          <div style={{ color: '#ea580c', fontSize: 12 }}>Warning</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                        <div style={{ fontSize: 16, color: '#10b981' }}>ℹ️</div>
                        <div>
                          <div style={{ color: '#1e40af', fontWeight: 600, fontSize: 14 }}>Backup completed successfully</div>
                          <div style={{ color: '#ea580c', fontSize: 12 }}>Info</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Performance Metrics */}
                  <div style={{ background: '#fff', borderRadius: 20, padding: '28px', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.06)' }}>
                    <h3 style={{ color: '#1e40af', fontWeight: 700, fontSize: 20, margin: '0 0 16px 0' }}>Performance Metrics</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#ea580c', fontWeight: 600 }}>Response Time</span>
                        <span style={{ color: '#1e40af', fontWeight: 700, fontSize: 18 }}>2.3ms</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#ea580c', fontWeight: 600 }}>Packet Loss</span>
                        <span style={{ color: '#1e40af', fontWeight: 700, fontSize: 18 }}>0.01%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#ea580c', fontWeight: 600 }}>Throughput</span>
                        <span style={{ color: '#1e40af', fontWeight: 700, fontSize: 18 }}>1.2 Gbps</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#ea580c', fontWeight: 600 }}>Error Rate</span>
                        <span style={{ color: '#10b981', fontWeight: 700, fontSize: 18 }}>0.001%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeSection === 'switching' && (
            <div style={{ width: '100%', minHeight: '80vh', background: '#f8fafc', padding: '0 0 48px 0' }}>
              <div style={{
                background: '#fffdfa',
                borderRadius: 36,
                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.10)',
                padding: '48px 64px',
                maxWidth: '1400px',
                margin: '48px auto 0 auto',
                color: '#1e3a8a',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 32,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 18 }}>
                  <div style={{ fontSize: 54, color: '#3b82f6', marginRight: 12 }}>🔀</div>
            <div>
                    <h2 style={{ fontSize: 34, fontWeight: 800, margin: 0, color: '#3b82f6', letterSpacing: 1 }}>VLANs - Switch Types</h2>
                    <p style={{ color: '#ea580c', fontSize: 18, margin: 0, marginTop: 6, maxWidth: 700 }}>
                      Select a switch type to view or configure VLAN settings. Each switch may have unique VLAN features and configuration options.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap', justifyContent: 'flex-start', marginTop: 24 }}>
                  {/* Cisco 3725 card (existing logic) */}
                  <div style={{
                    background: 'linear-gradient(120deg, #e0e7ef 0%, #fbbf24 100%)',
                    borderRadius: 24,
                    boxShadow: '0 4px 18px rgba(30, 58, 138, 0.08)',
                    padding: '32px 28px',
                    minWidth: 260,
                    maxWidth: 320,
                    flex: '1 1 260px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s',
                  }} onClick={() => openCreateVlanModal('Cisco 3725')}>
                    <div style={{ fontSize: 40, marginBottom: 10, color: '#1e3a8a' }}>🖧</div>
                    <h3 style={{ color: '#1e3a8a', fontWeight: 700, fontSize: 22, margin: 0 }}>Cisco 3725</h3>
                    <p style={{ color: '#ea580c', fontSize: 15, margin: '10px 0 0 0', textAlign: 'center' }}>
                      Classic Cisco router with VLAN and switching support.
                    </p>
                  </div>
                  {/* Aruba Switch card (example) */}
                  <div style={{
                    background: 'linear-gradient(120deg, #fff7ed 0%, #fbbf24 100%)',
                    borderRadius: 24,
                    boxShadow: '0 4px 18px rgba(251, 191, 36, 0.08)',
                    padding: '32px 28px',
                    minWidth: 260,
                    maxWidth: 320,
                    flex: '1 1 260px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    opacity: 0.85,
                  }}>
                    <div style={{ fontSize: 40, marginBottom: 10, color: '#f59e42' }}>🟧</div>
                    <h3 style={{ color: '#f59e42', fontWeight: 700, fontSize: 22, margin: 0 }}>Aruba 2930F</h3>
                    <p style={{ color: '#ea580c', fontSize: 15, margin: '10px 0 0 0', textAlign: 'center' }}>
                      Modern Aruba switch with advanced VLAN and security features.
                    </p>
                  </div>
                  {/* HP Switch card (example) */}
                  <div style={{
                    background: 'linear-gradient(120deg, #e0e7ef 0%, #60a5fa 100%)',
                    borderRadius: 24,
                    boxShadow: '0 4px 18px rgba(59, 130, 246, 0.08)',
                    padding: '32px 28px',
                    minWidth: 260,
                    maxWidth: 320,
                    flex: '1 1 260px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    opacity: 0.85,
                  }}>
                    <div style={{ fontSize: 40, marginBottom: 10, color: '#3b82f6' }}>🟦</div>
                    <h3 style={{ color: '#3b82f6', fontWeight: 700, fontSize: 22, margin: 0 }}>HP 2530</h3>
                    <p style={{ color: '#1e3a8a', fontSize: 15, margin: '10px 0 0 0', textAlign: 'center' }}>
                      HP switch with robust VLAN and management capabilities.
                    </p>
                  </div>
                  {/* Juniper Switch card (example) */}
                  <div style={{
                    background: 'linear-gradient(120deg, #e0e7ef 0%, #a7f3d0 100%)',
                    borderRadius: 24,
                    boxShadow: '0 4px 18px rgba(16, 185, 129, 0.08)',
                    padding: '32px 28px',
                    minWidth: 260,
                    maxWidth: 320,
                    flex: '1 1 260px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    opacity: 0.85,
                  }}>
                    <div style={{ fontSize: 40, marginBottom: 10, color: '#10b981' }}>🟩</div>
                    <h3 style={{ color: '#10b981', fontWeight: 700, fontSize: 22, margin: 0 }}>Juniper EX2200</h3>
                    <p style={{ color: '#065f46', fontSize: 15, margin: '10px 0 0 0', textAlign: 'center' }}>
                      Juniper switch with flexible VLAN and automation support.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeSection === 'devices' && (
            <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
              <div className="config-section" style={{ background: '#F5F5F7', borderRadius: 18, boxShadow: '0 4px 18px rgba(30, 58, 138, 0.08)', padding: '32px 24px' }}>
                <ul className="device-list">
                  {deviceSubsections.map(sub => (
                    <li key={sub.key} className="device-item" style={{ cursor: 'pointer', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <div
                        style={{ fontWeight: 600, fontSize: 17, color: '#1e3a8a', width: '100%' }}
                        onClick={() => setActiveSwitchSubsection(activeSwitchSubsection === sub.key ? null : sub.key)}
                      >
                        {sub.title}
                        <span style={{ float: 'right', fontWeight: 400, fontSize: 18, color: '#3b82f6' }}>{activeSwitchSubsection === sub.key ? '▲' : '▼'}</span>
                      </div>
                      {activeSwitchSubsection === sub.key && (
                        <div className="config-subsection" style={{ marginTop: 10, width: '100%' }}>
                          {/* Placeholder for configuration UI for each subsection */}
                          <p style={{ color: '#1A2A44', fontSize: 15, margin: 0 }}>
                            Configuration options for <b>{sub.title}</b> will appear here.
                          </p>
                        </div>
                      )}
                  </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {activeSection === 'routing' && (
            <div style={{ width: '100%', minHeight: '80vh', background: '#f7fafc', padding: '0 0 48px 0' }}>
              <div style={{
                background: 'linear-gradient(120deg, #fef9c3 0%, #bae6fd 100%)',
                borderRadius: 36,
                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.09)',
                padding: '48px 64px',
                maxWidth: '1400px',
                margin: '48px auto 0 auto',
                color: '#1e40af',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 32,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 18 }}>
                  <div style={{ fontSize: 54, color: '#f59e42', marginRight: 12 }}>🛣️</div>
                  <div>
                    <h2 style={{ fontSize: 34, fontWeight: 800, margin: 0, color: '#1e40af', letterSpacing: 1 }}>Routing</h2>
                    <p style={{ color: '#ea580c', fontSize: 18, margin: 0, marginTop: 6, maxWidth: 700 }}>
                      Manage static and dynamic routing for your network. Add, remove, or edit static routes, and enable dynamic routing protocols for advanced scenarios.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 18 }}>
                  <span style={{ fontWeight: 700, fontSize: 20, color: dynamicRouting ? '#1e40af' : '#ea580c' }}>
                    Dynamic Routing is {dynamicRouting ? 'Enabled' : 'Disabled'}
                  </span>
                  <button
                    onClick={() => {
                      setDynamicRouting(!dynamicRouting);
                      setRoutingStatusMsg('');
                    }}
                    style={{
                      background: dynamicRouting ? 'linear-gradient(90deg, #1e40af 0%, #fbbf24 100%)' : 'linear-gradient(90deg, #fbbf24 0%, #ea580c 100%)',
                      color: '#fff',
                      padding: '12px 32px',
                      border: 'none',
                      borderRadius: 14,
                      cursor: 'pointer',
                      fontSize: 18,
                      fontWeight: 700,
                      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.10)',
                      transition: 'all 0.2s',
                      letterSpacing: 1,
                    }}
                  >
                    {dynamicRouting ? 'Disable Dynamic Routing' : 'Enable Dynamic Routing'}
                  </button>
                </div>
                <div style={{ overflowX: 'auto', borderRadius: 14, boxShadow: '0 2px 8px rgba(59, 130, 246, 0.04)', background: '#fff' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: '#fff', borderRadius: 14, fontSize: 17 }}>
                    <thead>
                      <tr style={{ background: '#bae6fd', color: '#1e40af', fontWeight: 700 }}>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>Destination</th>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>Next Hop</th>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>Interface</th>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>Description</th>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {routingTable.map((entry, idx) => (
                        <tr key={entry.destination + entry.nextHop} style={{ borderBottom: '1.5px solid #e0e7ef' }}>
                          <td style={{ padding: '12px 12px', color: '#ea580c', fontWeight: 700 }}>{entry.destination}</td>
                          <td style={{ padding: '12px 12px' }}>{entry.nextHop}</td>
                          <td style={{ padding: '12px 12px' }}>{entry.iface}</td>
                          <td style={{ padding: '12px 12px' }}>{entry.desc}</td>
                          <td style={{ padding: '12px 12px' }}>
                            <button
                              onClick={() => {
                                setRoutingTable(routingTable.filter((_, i) => i !== idx));
                                setRoutingStatusMsg('Route removed.');
                              }}
                              style={{
                                background: 'linear-gradient(90deg, #fbbf24 0%, #ea580c 100%)',
                                color: '#fff',
                                padding: '6px 18px',
                                border: 'none',
                                borderRadius: 10,
                                cursor: 'pointer',
                                fontSize: 15,
                                fontWeight: 600,
                                boxShadow: '0 2px 8px rgba(251, 191, 36, 0.10)',
                                transition: 'all 0.2s',
                              }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 18, background: '#fff', borderRadius: 14, padding: '18px 24px', boxShadow: '0 2px 8px rgba(59, 130, 246, 0.04)' }}>
                  <input
                    type="text"
                    value={newRoute.destination}
                    onChange={e => setNewRoute({ ...newRoute, destination: e.target.value })}
                    placeholder="Destination (e.g. 192.168.20.0/24)"
                    style={{ width: 220, height: 44, padding: '0 16px', border: '2px solid #1e40af', borderRadius: 14, fontSize: 17, background: '#f0f9ff', color: '#1e40af', fontWeight: 500 }}
                  />
                  <input
                    type="text"
                    value={newRoute.nextHop}
                    onChange={e => setNewRoute({ ...newRoute, nextHop: e.target.value })}
                    placeholder="Next Hop (e.g. 10.0.0.1)"
                    style={{ width: 160, height: 44, padding: '0 16px', border: '2px solid #fbbf24', borderRadius: 14, fontSize: 17, background: '#fff7ed', color: '#ea580c', fontWeight: 500 }}
                  />
                  <input
                    type="text"
                    value={newRoute.iface}
                    onChange={e => setNewRoute({ ...newRoute, iface: e.target.value })}
                    placeholder="Interface (e.g. Fa0/5)"
                    style={{ width: 120, height: 44, padding: '0 16px', border: '2px solid #bae6fd', borderRadius: 14, fontSize: 17, background: '#f0f9ff', color: '#1e40af', fontWeight: 500 }}
                  />
                  <input
                    type="text"
                    value={newRoute.desc}
                    onChange={e => setNewRoute({ ...newRoute, desc: e.target.value })}
                    placeholder="Description"
                    style={{ width: 180, height: 44, padding: '0 16px', border: '2px solid #fbbf24', borderRadius: 14, fontSize: 17, background: '#fff7ed', color: '#ea580c', fontWeight: 500 }}
                  />
                  <button
                    onClick={() => {
                      if (newRoute.destination && newRoute.nextHop && newRoute.iface) {
                        setRoutingTable([...routingTable, newRoute]);
                        setNewRoute({ destination: '', nextHop: '', iface: '', desc: '' });
                        setRoutingStatusMsg('Route added!');
                      } else {
                        setRoutingStatusMsg('Please fill in all required fields.');
                      }
                    }}
                    style={{
                      background: 'linear-gradient(90deg, #1e40af 0%, #fbbf24 100%)',
                      color: '#fff',
                      padding: '10px 24px',
                      border: 'none',
                      borderRadius: 14,
                      cursor: 'pointer',
                      fontSize: 16,
                      fontWeight: 700,
                      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.10)',
                      transition: 'all 0.2s',
                      letterSpacing: 1,
                    }}
                  >
                    Add Route
                  </button>
                </div>
                {routingStatusMsg && <p style={{ color: '#ea580c', marginTop: 18, fontWeight: 700, fontSize: 16 }}>{routingStatusMsg}</p>}
              </div>
            </div>
          )}
          {activeSection === 'nat' && (
            <div style={{ width: '100%', minHeight: '80vh', background: '#f7fafc', padding: '0 0 48px 0' }}>
              <div style={{
                background: 'linear-gradient(120deg, #fef3c7 0%, #dbeafe 100%)',
                borderRadius: 36,
                boxShadow: '0 8px 32px rgba(251, 191, 36, 0.09)',
                padding: '48px 64px',
                maxWidth: '1400px',
                margin: '48px auto 0 auto',
                color: '#b45309',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 32,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 18 }}>
                  <div style={{ fontSize: 54, color: '#fbbf24', marginRight: 12 }}>🌐</div>
                  <div>
                    <h2 style={{ fontSize: 34, fontWeight: 800, margin: 0, color: '#b45309', letterSpacing: 1 }}>NAT (Network Address Translation)</h2>
                    <p style={{ color: '#1e3a8a', fontSize: 18, margin: 0, marginTop: 6, maxWidth: 700 }}>
                      Manage NAT rules for your network. Add, remove, or edit static and dynamic NAT rules, and enable or disable NAT as needed.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 18 }}>
                  <span style={{ fontWeight: 700, fontSize: 20, color: natEnabled ? '#b45309' : '#1e3a8a' }}>
                    NAT is {natEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <button
                    onClick={() => {
                      setNatEnabled(!natEnabled);
                      setNatStatusMsg('');
                    }}
                    style={{
                      background: natEnabled ? 'linear-gradient(90deg, #b45309 0%, #fbbf24 100%)' : 'linear-gradient(90deg, #1e3a8a 0%, #fbbf24 100%)',
                      color: '#fff',
                      padding: '12px 32px',
                      border: 'none',
                      borderRadius: 14,
                      cursor: 'pointer',
                      fontSize: 18,
                      fontWeight: 700,
                      boxShadow: '0 4px 15px rgba(251, 191, 36, 0.10)',
                      transition: 'all 0.2s',
                      letterSpacing: 1,
                    }}
                  >
                    {natEnabled ? 'Disable NAT' : 'Enable NAT'}
                  </button>
                </div>
                <div style={{ overflowX: 'auto', borderRadius: 14, boxShadow: '0 2px 8px rgba(251, 191, 36, 0.04)', background: '#fff' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: '#fff', borderRadius: 14, fontSize: 17 }}>
                    <thead>
                      <tr style={{ background: '#fef3c7', color: '#b45309', fontWeight: 700 }}>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>Type</th>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>Source</th>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>Destination</th>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>Translated</th>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>Description</th>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {natTable.map((entry, idx) => (
                        <tr key={entry.source + entry.dest} style={{ borderBottom: '1.5px solid #e0e7ef' }}>
                          <td style={{ padding: '12px 12px', color: '#b45309', fontWeight: 700 }}>{entry.type}</td>
                          <td style={{ padding: '12px 12px' }}>{entry.source}</td>
                          <td style={{ padding: '12px 12px' }}>{entry.dest}</td>
                          <td style={{ padding: '12px 12px' }}>{entry.translated}</td>
                          <td style={{ padding: '12px 12px' }}>{entry.desc}</td>
                          <td style={{ padding: '12px 12px' }}>
                            <button
                              onClick={() => {
                                setNatTable(natTable.filter((_, i) => i !== idx));
                                setNatStatusMsg('NAT rule removed.');
                              }}
                              style={{
                                background: 'linear-gradient(90deg, #fbbf24 0%, #b45309 100%)',
                                color: '#fff',
                                padding: '6px 18px',
                                border: 'none',
                                borderRadius: 10,
                                cursor: 'pointer',
                                fontSize: 15,
                                fontWeight: 600,
                                boxShadow: '0 2px 8px rgba(251, 191, 36, 0.10)',
                                transition: 'all 0.2s',
                              }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 18, background: '#fff', borderRadius: 14, padding: '18px 24px', boxShadow: '0 2px 8px rgba(251, 191, 36, 0.04)' }}>
                  <select
                    value={newNat.type}
                    onChange={e => setNewNat({ ...newNat, type: e.target.value })}
                    style={{ width: 120, height: 44, padding: '0 12px', border: '2px solid #b45309', borderRadius: 14, fontSize: 17, background: '#fef3c7', color: '#b45309', fontWeight: 600 }}
                  >
                    <option value="Static">Static</option>
                    <option value="Dynamic">Dynamic</option>
                  </select>
                  <input
                    type="text"
                    value={newNat.source}
                    onChange={e => setNewNat({ ...newNat, source: e.target.value })}
                    placeholder="Source (e.g. 192.168.10.10)"
                    style={{ width: 180, height: 44, padding: '0 16px', border: '2px solid #1e3a8a', borderRadius: 14, fontSize: 17, background: '#e0f2fe', color: '#1e3a8a', fontWeight: 500 }}
                  />
                  <input
                    type="text"
                    value={newNat.dest}
                    onChange={e => setNewNat({ ...newNat, dest: e.target.value })}
                    placeholder="Destination (e.g. 203.0.113.10)"
                    style={{ width: 180, height: 44, padding: '0 16px', border: '2px solid #fbbf24', borderRadius: 14, fontSize: 17, background: '#fff7ed', color: '#b45309', fontWeight: 500 }}
                  />
                  <input
                    type="text"
                    value={newNat.translated}
                    onChange={e => setNewNat({ ...newNat, translated: e.target.value })}
                    placeholder="Translated (e.g. 203.0.113.100)"
                    style={{ width: 180, height: 44, padding: '0 16px', border: '2px solid #bae6fd', borderRadius: 14, fontSize: 17, background: '#f0f9ff', color: '#1e40af', fontWeight: 500 }}
                  />
                  <input
                    type="text"
                    value={newNat.desc}
                    onChange={e => setNewNat({ ...newNat, desc: e.target.value })}
                    placeholder="Description"
                    style={{ width: 180, height: 44, padding: '0 16px', border: '2px solid #fbbf24', borderRadius: 14, fontSize: 17, background: '#fff7ed', color: '#b45309', fontWeight: 500 }}
                  />
                  <button
                    onClick={() => {
                      if (newNat.type && newNat.source && newNat.dest && newNat.translated) {
                        setNatTable([...natTable, newNat]);
                        setNewNat({ type: 'Static', source: '', dest: '', translated: '', desc: '' });
                        setNatStatusMsg('NAT rule added!');
                      } else {
                        setNatStatusMsg('Please fill in all required fields.');
                      }
                    }}
                    style={{
                      background: 'linear-gradient(90deg, #b45309 0%, #fbbf24 100%)',
                      color: '#fff',
                      padding: '10px 24px',
                      border: 'none',
                      borderRadius: 14,
                      cursor: 'pointer',
                      fontSize: 16,
                      fontWeight: 700,
                      boxShadow: '0 4px 15px rgba(251, 191, 36, 0.10)',
                      transition: 'all 0.2s',
                      letterSpacing: 1,
                    }}
                  >
                    Add Rule
                  </button>
                </div>
                {natStatusMsg && <p style={{ color: '#b45309', marginTop: 18, fontWeight: 700, fontSize: 16 }}>{natStatusMsg}</p>}
              </div>
            </div>
          )}
          {activeSection === 'dhcp' && (
            <div style={{ width: '100%', minHeight: '80vh', background: '#f7fafc', padding: '0 0 48px 0' }}>
              <div style={{
                background: 'linear-gradient(120deg, #f3f8ff 0%, #fef9c3 100%)',
                borderRadius: 36,
                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.08)',
                padding: '48px 64px',
                maxWidth: '1400px',
                margin: '48px auto 0 auto',
                color: '#2563eb',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 32,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 18 }}>
                  <div style={{ fontSize: 54, color: '#fbbf24', marginRight: 12 }}>📦</div>
                  <div>
                    <h2 style={{ fontSize: 34, fontWeight: 800, margin: 0, color: '#2563eb', letterSpacing: 1 }}>DHCP</h2>
                    <p style={{ color: '#ea580c', fontSize: 18, margin: 0, marginTop: 6, maxWidth: 700 }}>
                      Manage DHCP pools for your network. Add, remove, or edit DHCP pools, and enable or disable DHCP as needed.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 18 }}>
                  <span style={{ fontWeight: 700, fontSize: 20, color: dhcpEnabled ? '#2563eb' : '#ea580c' }}>
                    DHCP is {dhcpEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <button
                    onClick={() => {
                      setDhcpEnabled(!dhcpEnabled);
                      setDhcpStatusMsg('');
                    }}
                    style={{
                      background: dhcpEnabled ? 'linear-gradient(90deg, #2563eb 0%, #fbbf24 100%)' : 'linear-gradient(90deg, #fbbf24 0%, #ea580c 100%)',
                      color: '#fff',
                      padding: '12px 32px',
                      border: 'none',
                      borderRadius: 14,
                      cursor: 'pointer',
                      fontSize: 18,
                      fontWeight: 700,
                      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.10)',
                      transition: 'all 0.2s',
                      letterSpacing: 1,
                    }}
                  >
                    {dhcpEnabled ? 'Disable DHCP' : 'Enable DHCP'}
                  </button>
                </div>
                <div style={{ overflowX: 'auto', borderRadius: 14, boxShadow: '0 2px 8px rgba(59, 130, 246, 0.04)', background: '#fff' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: '#fff', borderRadius: 14, fontSize: 17 }}>
                    <thead>
                      <tr style={{ background: '#f3f8ff', color: '#2563eb', fontWeight: 700 }}>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>Pool Name</th>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>Network</th>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>Range</th>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>Gateway</th>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>DNS</th>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>Leases</th>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dhcpPools.map((entry, idx) => (
                        <tr key={entry.name + entry.network} style={{ borderBottom: '1.5px solid #e0e7ef' }}>
                          <td style={{ padding: '12px 12px', color: '#ea580c', fontWeight: 700 }}>{entry.name}</td>
                          <td style={{ padding: '12px 12px' }}>{entry.network}</td>
                          <td style={{ padding: '12px 12px' }}>{entry.range}</td>
                          <td style={{ padding: '12px 12px' }}>{entry.gateway}</td>
                          <td style={{ padding: '12px 12px' }}>{entry.dns}</td>
                          <td style={{ padding: '12px 12px' }}>{entry.leases}</td>
                          <td style={{ padding: '12px 12px' }}>
                            <button
                              onClick={() => {
                                setDhcpPools(dhcpPools.filter((_, i) => i !== idx));
                                setDhcpStatusMsg('DHCP pool removed.');
                              }}
                              style={{
                                background: 'linear-gradient(90deg, #fbbf24 0%, #2563eb 100%)',
                                color: '#fff',
                                padding: '6px 18px',
                                border: 'none',
                                borderRadius: 10,
                                cursor: 'pointer',
                                fontSize: 15,
                                fontWeight: 600,
                                boxShadow: '0 2px 8px rgba(251, 191, 36, 0.10)',
                                transition: 'all 0.2s',
                              }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 18, background: '#fff', borderRadius: 14, padding: '18px 24px', boxShadow: '0 2px 8px rgba(59, 130, 246, 0.04)' }}>
                  <input
                    type="text"
                    value={newDhcpPool.name}
                    onChange={e => setNewDhcpPool({ ...newDhcpPool, name: e.target.value })}
                    placeholder="Pool Name"
                    style={{ width: 120, height: 44, padding: '0 16px', border: '2px solid #2563eb', borderRadius: 14, fontSize: 17, background: '#f3f8ff', color: '#2563eb', fontWeight: 600 }}
                  />
                  <input
                    type="text"
                    value={newDhcpPool.network}
                    onChange={e => setNewDhcpPool({ ...newDhcpPool, network: e.target.value })}
                    placeholder="Network (e.g. 192.168.20.0/24)"
                    style={{ width: 180, height: 44, padding: '0 16px', border: '2px solid #fbbf24', borderRadius: 14, fontSize: 17, background: '#fff7ed', color: '#ea580c', fontWeight: 500 }}
                  />
                  <input
                    type="text"
                    value={newDhcpPool.range}
                    onChange={e => setNewDhcpPool({ ...newDhcpPool, range: e.target.value })}
                    placeholder="Range (e.g. 192.168.20.100-200)"
                    style={{ width: 180, height: 44, padding: '0 16px', border: '2px solid #2563eb', borderRadius: 14, fontSize: 17, background: '#f3f8ff', color: '#2563eb', fontWeight: 600 }}
                  />
                  <input
                    type="text"
                    value={newDhcpPool.gateway}
                    onChange={e => setNewDhcpPool({ ...newDhcpPool, gateway: e.target.value })}
                    placeholder="Gateway (e.g. 192.168.20.1)"
                    style={{ width: 140, height: 44, padding: '0 16px', border: '2px solid #fbbf24', borderRadius: 14, fontSize: 17, background: '#fff7ed', color: '#ea580c', fontWeight: 500 }}
                  />
                  <input
                    type="text"
                    value={newDhcpPool.dns}
                    onChange={e => setNewDhcpPool({ ...newDhcpPool, dns: e.target.value })}
                    placeholder="DNS (e.g. 8.8.8.8)"
                    style={{ width: 120, height: 44, padding: '0 16px', border: '2px solid #2563eb', borderRadius: 14, fontSize: 17, background: '#f3f8ff', color: '#2563eb', fontWeight: 600 }}
                  />
                  <input
                    type="number"
                    value={newDhcpPool.leases}
                    min={0}
                    onChange={e => setNewDhcpPool({ ...newDhcpPool, leases: Number(e.target.value) })}
                    placeholder="Leases"
                    style={{ width: 90, height: 44, padding: '0 16px', border: '2px solid #fbbf24', borderRadius: 14, fontSize: 17, background: '#fff7ed', color: '#ea580c', fontWeight: 500 }}
                  />
                  <button
                    onClick={() => {
                      if (newDhcpPool.name && newDhcpPool.network && newDhcpPool.range && newDhcpPool.gateway && newDhcpPool.dns) {
                        setDhcpPools([...dhcpPools, newDhcpPool]);
                        setNewDhcpPool({ name: '', network: '', range: '', gateway: '', dns: '', leases: 0 });
                        setDhcpStatusMsg('DHCP pool added!');
                      } else {
                        setDhcpStatusMsg('Please fill in all required fields.');
                      }
                    }}
                    style={{
                      background: 'linear-gradient(90deg, #2563eb 0%, #fbbf24 100%)',
                      color: '#fff',
                      padding: '10px 24px',
                      border: 'none',
                      borderRadius: 14,
                      cursor: 'pointer',
                      fontSize: 16,
                      fontWeight: 700,
                      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.10)',
                      transition: 'all 0.2s',
                      letterSpacing: 1,
                    }}
                  >
                    Add Pool
                  </button>
                  <button
                    onClick={() => openDhcpModal('Cisco 3725')}
                    style={{
                      background: 'linear-gradient(90deg, #059669 0%, #10b981 100%)',
                      color: '#fff',
                      padding: '10px 24px',
                      border: 'none',
                      borderRadius: 14,
                      cursor: 'pointer',
                      fontSize: 16,
                      fontWeight: 700,
                      boxShadow: '0 4px 15px rgba(5, 150, 105, 0.10)',
                      transition: 'all 0.2s',
                      letterSpacing: 1,
                      marginLeft: '12px',
                    }}
                  >
                    🚀 Create DHCP Pool
                  </button>
                </div>
                {dhcpStatusMsg && <p style={{ color: '#2563eb', marginTop: 18, fontWeight: 700, fontSize: 16 }}>{dhcpStatusMsg}</p>}
              </div>
            </div>
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
            <ReportsPage />
          )}
          {activeSection === 'help' && (
            <div><h2 className="section-header">Help</h2><div className="config-section"><h3>Tutorials</h3><p style={{ color: '#1A2A44', fontSize: '16px' }}>Learn how to use the dashboard.</p></div></div>
          )}
          {userProfile.role === 'Developer' && activeSection === 'developer' && (
            <div><h2 className="section-header">Developer Dashboard</h2><div className="config-section"><h3>API Testing</h3><p style={{ color: '#1A2A44', fontSize: '16px' }}>Test your API endpoints here.</p></div></div>
          )}
          {activeSection === 'hostname' && (
            <div style={{ width: '100%', minHeight: '80vh', background: '#f8fafc', padding: '0 0 48px 0' }}>
              <div style={{
                background: '#fffdfa',
                borderRadius: 36,
                boxShadow: '0 8px 32px rgba(251, 146, 60, 0.10)',
                padding: '48px 64px',
                maxWidth: '1400px',
                margin: '48px auto 0 auto',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                color: '#ea580c',
                gap: 48,
              }}>
                {/* Left: Icon and description */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 60, marginBottom: 18, color: '#ea580c', textShadow: '0 2px 12px #fff7ed' }}>🖧</div>
                  <h2 style={{
                    fontSize: 38,
                    fontWeight: 800,
                    marginBottom: 18,
                    color: '#ea580c',
                    letterSpacing: 1,
                    textAlign: 'center',
                  }}>Switch Hostname & Management IP</h2>
                  <p style={{ color: '#ea580c', fontSize: 20, marginBottom: 0, textAlign: 'center', maxWidth: 320 }}>
                    Set your switch's hostname and management IP address for easier identification and remote management. These settings help you organize and access your network devices efficiently.
                  </p>
                </div>
                {/* Right: Settings fields and button */}
                <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: 36 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
                    <label style={{ fontWeight: 700, color: '#ea580c', fontSize: 22, minWidth: 140 }}>Hostname</label>
                    <input
                      type="text"
                      value={hostname}
                      onChange={e => setHostname(e.target.value)}
                      placeholder="e.g. SW1-Core"
                      style={{
                        flex: 1,
                        height: 54,
                        padding: '0 22px',
                        border: '2px solid #fbbf24',
                        borderRadius: 18,
                        fontSize: 22,
                        background: '#fff7ed',
                        color: '#ea580c',
                        fontWeight: 600,
                        boxShadow: '0 2px 8px rgba(251, 191, 36, 0.06)',
                      }}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
                    <label style={{ fontWeight: 700, color: '#ea580c', fontSize: 22, minWidth: 140 }}>Management IP</label>
                    <input
                      type="text"
                      value={mgmtIp}
                      onChange={e => setMgmtIp(e.target.value)}
                      placeholder="e.g. 192.168.1.254"
                      style={{
                        flex: 1,
                        height: 54,
                        padding: '0 22px',
                        border: '2px solid #fbbf24',
                        borderRadius: 18,
                        fontSize: 22,
                        background: '#fff7ed',
                        color: '#ea580c',
                        fontWeight: 600,
                        boxShadow: '0 2px 8px rgba(251, 191, 36, 0.06)',
                      }}
                      required
                    />
                  </div>
                  <button
                    onClick={() => {
                      setHostnameStatus('Saving...');
                      setTimeout(() => {
                        setHostnameStatus('Hostname and management IP updated!');
                      }, 1200);
                    }}
                    style={{
                      background: 'linear-gradient(90deg, #fbbf24 0%, #ea580c 100%)',
                      color: '#fff',
                      padding: '18px 0',
                      border: 'none',
                      borderRadius: 18,
                      cursor: 'pointer',
                      fontSize: 22,
                      fontWeight: 800,
                      width: '100%',
                      marginTop: 8,
                      boxShadow: '0 6px 24px rgba(251, 191, 36, 0.13)',
                      transition: 'all 0.2s',
                      letterSpacing: 1,
                    }}
                  >
                    Save Settings
                  </button>
                  {hostnameStatus && <p style={{ color: '#ea580c', marginTop: 18, fontWeight: 700, fontSize: 18 }}>{hostnameStatus}</p>}
                </div>
              </div>
            </div>
          )}
          {activeSection === 'macTable' && (
            <div style={{ width: '100%', minHeight: '80vh', background: '#f8fafc', padding: '0 0 48px 0' }}>
              <div style={{
                background: '#fffdfa',
                borderRadius: 36,
                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.10)',
                padding: '48px 64px',
                maxWidth: '1400px',
                margin: '48px auto 0 auto',
                color: '#1e3a8a',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 32,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 18 }}>
                  <div style={{ fontSize: 54, color: '#3b82f6', marginRight: 12 }}>🔗</div>
                  <div>
                    <h2 style={{ fontSize: 34, fontWeight: 800, margin: 0, color: '#3b82f6', letterSpacing: 1 }}>MAC Address Table Management</h2>
                    <p style={{ color: '#ea580c', fontSize: 18, margin: 0, marginTop: 6, maxWidth: 700 }}>
                      View, search, and manage the MAC address table of your switch. Quickly find which devices are connected to which ports, and monitor dynamic/static MAC entries.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18 }}>
                  <input
                    type="text"
                    placeholder="Search MAC, Port, VLAN..."
                    style={{
                      flex: 1,
                      height: 48,
                      padding: '0 18px',
                      border: '2px solid #3b82f6',
                      borderRadius: 14,
                      fontSize: 18,
                      background: '#e0f2fe',
                      color: '#1e3a8a',
                      fontWeight: 500,
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.06)',
                    }}
                  />
                  <button
                    style={{
                      background: 'linear-gradient(90deg, #3b82f6 0%, #fbbf24 100%)',
                      color: '#fff',
                      padding: '12px 32px',
                      border: 'none',
                      borderRadius: 14,
                      cursor: 'pointer',
                      fontSize: 18,
                      fontWeight: 700,
                      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.10)',
                      transition: 'all 0.2s',
                      letterSpacing: 1,
                    }}
                  >
                    Refresh
                  </button>
                </div>
                <div style={{ overflowX: 'auto', borderRadius: 18, boxShadow: '0 2px 8px rgba(59, 130, 246, 0.04)' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: '#fff', borderRadius: 18, fontSize: 18 }}>
                    <thead>
                      <tr style={{ background: '#e0f2fe', color: '#3b82f6', fontWeight: 700 }}>
                        <th style={{ padding: '18px 16px', textAlign: 'left' }}>MAC Address</th>
                        <th style={{ padding: '18px 16px', textAlign: 'left' }}>Port</th>
                        <th style={{ padding: '18px 16px', textAlign: 'left' }}>VLAN</th>
                        <th style={{ padding: '18px 16px', textAlign: 'left' }}>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Example MAC table data, replace with real data as needed */}
                      {[
                        { mac: '00:1A:2B:3C:4D:5E', port: 'Fa0/1', vlan: 10, type: 'Dynamic' },
                        { mac: '00:1A:2B:3C:4D:5F', port: 'Fa0/2', vlan: 20, type: 'Static' },
                        { mac: '00:1A:2B:3C:4D:60', port: 'Fa0/3', vlan: 10, type: 'Dynamic' },
                        { mac: '00:1A:2B:3C:4D:61', port: 'Fa0/4', vlan: 30, type: 'Dynamic' },
                      ].map((entry, idx) => (
                        <tr key={idx} style={{ borderBottom: '1.5px solid #e0e7ef' }}>
                          <td style={{ padding: '16px 16px', color: '#ea580c', fontWeight: 700 }}>{entry.mac}</td>
                          <td style={{ padding: '16px 16px' }}>{entry.port}</td>
                          <td style={{ padding: '16px 16px' }}>{entry.vlan}</td>
                          <td style={{ padding: '16px 16px', color: entry.type === 'Static' ? '#3b82f6' : '#ea580c', fontWeight: 600 }}>{entry.type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {activeSection === 'ssh' && (
            <div style={{ width: '100%', minHeight: '80vh', background: '#f8fafc', padding: '0 0 48px 0' }}>
              <div style={{
                background: '#fffdfa',
                borderRadius: 36,
                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.10)',
                padding: '48px 64px',
                maxWidth: '1400px',
                margin: '48px auto 0 auto',
                color: '#1e3a8a',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 32,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 18 }}>
                  <div style={{ fontSize: 54, color: '#3b82f6', marginRight: 12 }}>🔐</div>
                  <div>
                    <h2 style={{ fontSize: 34, fontWeight: 800, margin: 0, color: '#3b82f6', letterSpacing: 1 }}>SSH and Remote Access</h2>
                    <p style={{ color: '#ea580c', fontSize: 18, margin: 0, marginTop: 6, maxWidth: 700 }}>
                      Manage SSH access to your switch. Enable or disable SSH, set the listening port, and control which remote IPs are allowed to connect for secure remote management.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 18 }}>
                  <span style={{ fontWeight: 700, fontSize: 20, color: sshEnabled ? '#3b82f6' : '#ea580c' }}>
                    SSH is {sshEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <button
                    onClick={() => {
                      setSshEnabled(!sshEnabled);
                      setSshStatusMsg('');
                    }}
                    style={{
                      background: sshEnabled ? 'linear-gradient(90deg, #3b82f6 0%, #fbbf24 100%)' : 'linear-gradient(90deg, #fbbf24 0%, #ea580c 100%)',
                      color: '#fff',
                      padding: '12px 32px',
                      border: 'none',
                      borderRadius: 14,
                      cursor: 'pointer',
                      fontSize: 18,
                      fontWeight: 700,
                      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.10)',
                      transition: 'all 0.2s',
                      letterSpacing: 1,
                    }}
                  >
                    {sshEnabled ? 'Disable SSH' : 'Enable SSH'}
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 18 }}>
                  <label style={{ fontWeight: 700, color: '#ea580c', fontSize: 20, minWidth: 120 }}>SSH Port</label>
                  <input
                    type="number"
                    value={sshPort}
                    min={1}
                    max={65535}
                    onChange={e => setSshPort(Number(e.target.value))}
                    style={{
                      width: 120,
                      height: 44,
                      padding: '0 16px',
                      border: '2px solid #3b82f6',
                      borderRadius: 14,
                      fontSize: 18,
                      background: '#e0f2fe',
                      color: '#1e3a8a',
                      fontWeight: 600,
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.06)',
                    }}
                  />
                  <button
                    onClick={() => setSshStatusMsg('SSH port updated!')}
                    style={{
                      background: 'linear-gradient(90deg, #3b82f6 0%, #fbbf24 100%)',
                      color: '#fff',
                      padding: '10px 24px',
                      border: 'none',
                      borderRadius: 14,
                      cursor: 'pointer',
                      fontSize: 16,
                      fontWeight: 700,
                      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.10)',
                      transition: 'all 0.2s',
                      letterSpacing: 1,
                    }}
                  >
                    Save Port
                  </button>
                </div>
                <div style={{ marginBottom: 18 }}>
                  <h3 style={{ color: '#ea580c', fontWeight: 700, fontSize: 22, margin: '0 0 18px 0' }}>Allowed Remote IPs</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18 }}>
                    <input
                      type="text"
                      value={newSshIp}
                      onChange={e => setNewSshIp(e.target.value)}
                      placeholder="e.g. 192.168.1.101"
                      style={{
                        width: 220,
                        height: 44,
                        padding: '0 16px',
                        border: '2px solid #3b82f6',
                        borderRadius: 14,
                        fontSize: 17,
                        background: '#e0f2fe',
                        color: '#1e3a8a',
                        fontWeight: 500,
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.06)',
                      }}
                    />
                    <button
                      onClick={() => {
                        if (newSshIp && !sshAllowedIps.includes(newSshIp)) {
                          setSshAllowedIps([...sshAllowedIps, newSshIp]);
                          setNewSshIp('');
                          setSshStatusMsg('Allowed IP added!');
                        } else {
                          setSshStatusMsg('Enter a unique IP address.');
                        }
                      }}
                      style={{
                        background: 'linear-gradient(90deg, #3b82f6 0%, #fbbf24 100%)',
                        color: '#fff',
                        padding: '10px 24px',
                        border: 'none',
                        borderRadius: 14,
                        cursor: 'pointer',
                        fontSize: 16,
                        fontWeight: 700,
                        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.10)',
                        transition: 'all 0.2s',
                        letterSpacing: 1,
                      }}
                    >
                      Add IP
                    </button>
                  </div>
                  <div style={{ overflowX: 'auto', borderRadius: 14, boxShadow: '0 2px 8px rgba(59, 130, 246, 0.04)', background: '#fff' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: '#fff', borderRadius: 14, fontSize: 17 }}>
                      <thead>
                        <tr style={{ background: '#e0f2fe', color: '#3b82f6', fontWeight: 700 }}>
                          <th style={{ padding: '14px 12px', textAlign: 'left' }}>IP Address</th>
                          <th style={{ padding: '14px 12px', textAlign: 'left' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sshAllowedIps.map((ip, idx) => (
                          <tr key={ip} style={{ borderBottom: '1.5px solid #e0e7ef' }}>
                            <td style={{ padding: '12px 12px', color: '#ea580c', fontWeight: 700 }}>{ip}</td>
                            <td style={{ padding: '12px 12px' }}>
                              <button
                                onClick={() => {
                                  setSshAllowedIps(sshAllowedIps.filter(i => i !== ip));
                                  setSshStatusMsg('Allowed IP removed.');
                                }}
                                style={{
                                  background: 'linear-gradient(90deg, #fbbf24 0%, #ea580c 100%)',
                                  color: '#fff',
                                  padding: '6px 18px',
                                  border: 'none',
                                  borderRadius: 10,
                                  cursor: 'pointer',
                                  fontSize: 15,
                                  fontWeight: 600,
                                  boxShadow: '0 2px 8px rgba(251, 191, 36, 0.10)',
                                  transition: 'all 0.2s',
                                }}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {sshStatusMsg && <p style={{ color: '#ea580c', marginTop: 18, fontWeight: 700, fontSize: 16 }}>{sshStatusMsg}</p>}
                </div>
              </div>
            </div>
          )}
          {activeSection === 'dhcpSnooping' && (
            <div style={{ width: '100%', minHeight: '80vh', background: '#f8fafc', padding: '0 0 48px 0' }}>
              <div style={{
                background: '#fffdfa',
                borderRadius: 36,
                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.10)',
                padding: '48px 64px',
                maxWidth: '1400px',
                margin: '48px auto 0 auto',
                color: '#1e3a8a',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 32,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 18 }}>
                  <div style={{ fontSize: 54, color: '#3b82f6', marginRight: 12 }}>🛡️</div>
                  <div>
                    <h2 style={{ fontSize: 34, fontWeight: 800, margin: 0, color: '#3b82f6', letterSpacing: 1 }}>DHCP Snooping</h2>
                    <p style={{ color: '#ea580c', fontSize: 18, margin: 0, marginTop: 6, maxWidth: 700 }}>
                      Protect your network from rogue DHCP servers. Enable DHCP snooping and manage trusted/untrusted ports for enhanced security.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 18 }}>
                  <span style={{ fontWeight: 700, fontSize: 20, color: dhcpSnoopingEnabled ? '#3b82f6' : '#ea580c' }}>
                    DHCP Snooping is {dhcpSnoopingEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <button
                    onClick={() => {
                      setDhcpSnoopingEnabled(!dhcpSnoopingEnabled);
                      setDhcpSnoopStatus('');
                    }}
                    style={{
                      background: dhcpSnoopingEnabled ? 'linear-gradient(90deg, #3b82f6 0%, #fbbf24 100%)' : 'linear-gradient(90deg, #fbbf24 0%, #ea580c 100%)',
                      color: '#fff',
                      padding: '12px 32px',
                      border: 'none',
                      borderRadius: 14,
                      cursor: 'pointer',
                      fontSize: 18,
                      fontWeight: 700,
                      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.10)',
                      transition: 'all 0.2s',
                      letterSpacing: 1,
                    }}
                  >
                    {dhcpSnoopingEnabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
                <div style={{ marginBottom: 18 }}>
                  <h3 style={{ color: '#ea580c', fontWeight: 700, fontSize: 22, margin: '0 0 18px 0' }}>Trusted Ports</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18 }}>
                    <input
                      type="text"
                      value={newTrustedPort}
                      onChange={e => setNewTrustedPort(e.target.value)}
                      placeholder="e.g. Fa0/2"
                      style={{
                        width: 180,
                        height: 44,
                        padding: '0 16px',
                        border: '2px solid #3b82f6',
                        borderRadius: 14,
                        fontSize: 17,
                        background: '#e0f2fe',
                        color: '#1e3a8a',
                        fontWeight: 500,
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.06)',
                      }}
                    />
                    <button
                      onClick={() => {
                        if (newTrustedPort && !trustedPorts.includes(newTrustedPort)) {
                          setTrustedPorts([...trustedPorts, newTrustedPort]);
                          setNewTrustedPort('');
                          setDhcpSnoopStatus('Trusted port added!');
                        } else {
                          setDhcpSnoopStatus('Enter a unique port name.');
                        }
                      }}
                      style={{
                        background: 'linear-gradient(90deg, #3b82f6 0%, #fbbf24 100%)',
                        color: '#fff',
                        padding: '10px 24px',
                        border: 'none',
                        borderRadius: 14,
                        cursor: 'pointer',
                        fontSize: 16,
                        fontWeight: 700,
                        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.10)',
                        transition: 'all 0.2s',
                      }}
                    >
                      Add Trusted Port
                    </button>
                  </div>
                  <div style={{ overflowX: 'auto', borderRadius: 14, boxShadow: '0 2px 8px rgba(59, 130, 246, 0.04)', background: '#fff' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: '#fff', borderRadius: 14, fontSize: 17 }}>
                      <thead>
                        <tr style={{ background: '#e0f2fe', color: '#3b82f6', fontWeight: 700 }}>
                          <th style={{ padding: '14px 12px', textAlign: 'left' }}>Port</th>
                          <th style={{ padding: '14px 12px', textAlign: 'left' }}>Status</th>
                          <th style={{ padding: '14px 12px', textAlign: 'left' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Trusted ports */}
                        {trustedPorts.map((port, idx) => (
                          <tr key={port} style={{ borderBottom: '1.5px solid #e0e7ef' }}>
                            <td style={{ padding: '12px 12px', color: '#ea580c', fontWeight: 700 }}>{port}</td>
                            <td style={{ padding: '12px 12px', color: '#3b82f6', fontWeight: 600 }}>Trusted</td>
                            <td style={{ padding: '12px 12px' }}>
                              <button
                                onClick={() => {
                                  setTrustedPorts(trustedPorts.filter(p => p !== port));
                                  setDhcpSnoopStatus('Trusted port removed.');
                                }}
                                style={{
                                  background: 'linear-gradient(90deg, #fbbf24 0%, #ea580c 100%)',
                                  color: '#fff',
                                  padding: '6px 18px',
                                  border: 'none',
                                  borderRadius: 10,
                                  cursor: 'pointer',
                                  fontSize: 15,
                                  fontWeight: 600,
                                  boxShadow: '0 2px 8px rgba(251, 191, 36, 0.10)',
                                  transition: 'all 0.2s',
                                }}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                        {/* Example untrusted ports */}
                        {['Fa0/3', 'Fa0/4'].filter(p => !trustedPorts.includes(p)).map((port, idx) => (
                          <tr key={port} style={{ borderBottom: '1.5px solid #e0e7ef' }}>
                            <td style={{ padding: '12px 12px', color: '#ea580c', fontWeight: 700 }}>{port}</td>
                            <td style={{ padding: '12px 12px', color: '#ea580c', fontWeight: 600 }}>Untrusted</td>
                            <td style={{ padding: '12px 12px' }}>
                              <button
                                onClick={() => {
                                  setTrustedPorts([...trustedPorts, port]);
                                  setDhcpSnoopStatus('Trusted port added!');
                                }}
                                style={{
                                  background: 'linear-gradient(90deg, #3b82f6 0%, #fbbf24 100%)',
                                  color: '#fff',
                                  padding: '6px 18px',
                                  border: 'none',
                                  borderRadius: 10,
                                  cursor: 'pointer',
                                  fontSize: 15,
                                  fontWeight: 600,
                                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.10)',
                                  transition: 'all 0.2s',
                                }}
                              >
                                Trust
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {dhcpSnoopStatus && <p style={{ color: '#ea580c', marginTop: 18, fontWeight: 700, fontSize: 16 }}>{dhcpSnoopStatus}</p>}
                </div>
              </div>
            </div>
          )}
          {activeSection === 'portSecurity' && (
            <div style={{ width: '100%', minHeight: '80vh', background: '#f8fafc', padding: '0 0 48px 0' }}>
              <div style={{
                background: '#fffdfa',
                borderRadius: 36,
                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.10)',
                padding: '48px 64px',
                maxWidth: '1400px',
                margin: '48px auto 0 auto',
                color: '#1e3a8a',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 32,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 18 }}>
                  <div style={{ fontSize: 54, color: '#3b82f6', marginRight: 12 }}>🔒</div>
                  <div>
                    <h2 style={{ fontSize: 34, fontWeight: 800, margin: 0, color: '#3b82f6', letterSpacing: 1 }}>Port Security</h2>
                    <p style={{ color: '#ea580c', fontSize: 18, margin: 0, marginTop: 6, maxWidth: 700 }}>
                      Secure your switch ports by limiting the number of MAC addresses, setting violation actions, and enabling/disabling port security per port.
                    </p>
                  </div>
                </div>
                <div style={{ overflowX: 'auto', borderRadius: 14, boxShadow: '0 2px 8px rgba(59, 130, 246, 0.04)', background: '#fff' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: '#fff', borderRadius: 14, fontSize: 17 }}>
                    <thead>
                      <tr style={{ background: '#e0f2fe', color: '#3b82f6', fontWeight: 700 }}>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>Port</th>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>Enabled</th>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>Max MAC</th>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>Violation Action</th>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portSecurityTable.map((entry, idx) => (
                        <tr key={entry.port} style={{ borderBottom: '1.5px solid #e0e7ef' }}>
                          <td style={{ padding: '12px 12px', color: '#ea580c', fontWeight: 700 }}>{entry.port}</td>
                          <td style={{ padding: '12px 12px' }}>
                            <input
                              type="checkbox"
                              checked={entry.enabled}
                              onChange={() => {
                                const updated = [...portSecurityTable];
                                updated[idx].enabled = !updated[idx].enabled;
                                setPortSecurityTable(updated);
                                setPortSecStatusMsg(`Port security ${updated[idx].enabled ? 'enabled' : 'disabled'} on ${entry.port}`);
                              }}
                              style={{ width: 22, height: 22 }}
                            />
                          </td>
                          <td style={{ padding: '12px 12px' }}>
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={entry.maxMac}
                              onChange={e => {
                                const updated = [...portSecurityTable];
                                updated[idx].maxMac = Number(e.target.value);
                                setPortSecurityTable(updated);
                                setPortSecStatusMsg(`Max MAC for ${entry.port} set to ${e.target.value}`);
                              }}
                              style={{ width: 60, height: 32, fontSize: 16, border: '1.5px solid #fbbf24', borderRadius: 8, padding: '0 8px', color: '#ea580c', background: '#fffdfa' }}
                            />
                          </td>
                          <td style={{ padding: '12px 12px' }}>
                            <select
                              value={entry.violation}
                              onChange={e => {
                                const updated = [...portSecurityTable];
                                updated[idx].violation = e.target.value;
                                setPortSecurityTable(updated);
                                setPortSecStatusMsg(`Violation action for ${entry.port} set to ${e.target.value}`);
                              }}
                              style={{ fontSize: 16, border: '1.5px solid #3b82f6', borderRadius: 8, padding: '4px 10px', color: '#1e3a8a', background: '#e0f2fe' }}
                            >
                              <option value="Shutdown">Shutdown</option>
                              <option value="Restrict">Restrict</option>
                              <option value="Protect">Protect</option>
                            </select>
                          </td>
                          <td style={{ padding: '12px 12px' }}>
                            <button
                              onClick={() => {
                                const updated = portSecurityTable.filter((_, i) => i !== idx);
                                setPortSecurityTable(updated);
                                setPortSecStatusMsg(`Port ${entry.port} removed from table.`);
                              }}
                              style={{
                                background: 'linear-gradient(90deg, #fbbf24 0%, #ea580c 100%)',
                                color: '#fff',
                                padding: '6px 18px',
                                border: 'none',
                                borderRadius: 10,
                                cursor: 'pointer',
                                fontSize: 15,
                                fontWeight: 600,
                                boxShadow: '0 2px 8px rgba(251, 191, 36, 0.10)',
                                transition: 'all 0.2s',
                              }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {portSecStatusMsg && <p style={{ color: '#ea580c', marginTop: 18, fontWeight: 700, fontSize: 16 }}>{portSecStatusMsg}</p>}
              </div>
            </div>
          )}
          {activeSection === 'stp' && (
            <div style={{ width: '100%', minHeight: '80vh', background: '#f7fafc', padding: '0 0 48px 0' }}>
              <div style={{
                background: 'linear-gradient(120deg, #f0fdf4 0%, #fef9c3 100%)',
                borderRadius: 36,
                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.09)',
                padding: '48px 64px',
                maxWidth: '1400px',
                margin: '48px auto 0 auto',
                color: '#047857',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 32,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 18 }}>
                  <div style={{ fontSize: 54, color: '#10b981', marginRight: 12 }}>🌲</div>
                  <div>
                    <h2 style={{ fontSize: 34, fontWeight: 800, margin: 0, color: '#047857', letterSpacing: 1 }}>Spanning Tree Protocol (STP)</h2>
                    <p style={{ color: '#ea580c', fontSize: 18, margin: 0, marginTop: 6, maxWidth: 700 }}>
                      Prevent network loops and ensure redundancy. Enable or disable STP, select the STP mode, and view or manage port roles and states.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 18 }}>
                  <span style={{ fontWeight: 700, fontSize: 20, color: stpEnabled ? '#047857' : '#ea580c' }}>
                    STP is {stpEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <button
                    onClick={() => {
                      setStpEnabled(!stpEnabled);
                      setStpStatusMsg('');
                    }}
                    style={{
                      background: stpEnabled ? 'linear-gradient(90deg, #10b981 0%, #fbbf24 100%)' : 'linear-gradient(90deg, #fbbf24 0%, #ea580c 100%)',
                      color: '#fff',
                      padding: '12px 32px',
                      border: 'none',
                      borderRadius: 14,
                      cursor: 'pointer',
                      fontSize: 18,
                      fontWeight: 700,
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.10)',
                      transition: 'all 0.2s',
                      letterSpacing: 1,
                    }}
                  >
                    {stpEnabled ? 'Disable STP' : 'Enable STP'}
                  </button>
                  <label style={{ fontWeight: 700, color: '#10b981', fontSize: 20, minWidth: 120 }}>STP Mode</label>
                  <select
                    value={stpMode}
                    onChange={e => {
                      setStpMode(e.target.value);
                      setStpStatusMsg(`STP mode set to ${e.target.value}`);
                    }}
                    style={{ fontSize: 18, border: '2px solid #10b981', borderRadius: 14, padding: '8px 18px', color: '#047857', background: '#f0fdf4', fontWeight: 700 }}
                  >
                    <option value="PVST">PVST</option>
                    <option value="RPVST">RPVST</option>
                    <option value="MST">MST</option>
                  </select>
                </div>
                <div style={{ overflowX: 'auto', borderRadius: 14, boxShadow: '0 2px 8px rgba(16, 185, 129, 0.04)', background: '#fff' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: '#fff', borderRadius: 14, fontSize: 17 }}>
                    <thead>
                      <tr style={{ background: '#f0fdf4', color: '#047857', fontWeight: 700 }}>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>Port</th>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>Role</th>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>State</th>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>Edge</th>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stpPorts.map((entry, idx) => (
                        <tr key={entry.port} style={{ borderBottom: '1.5px solid #e0e7ef' }}>
                          <td style={{ padding: '12px 12px', color: '#ea580c', fontWeight: 700 }}>{entry.port}</td>
                          <td style={{ padding: '12px 12px', color: '#10b981', fontWeight: 600 }}>{entry.role}</td>
                          <td style={{ padding: '12px 12px', color: entry.state === 'Forwarding' ? '#047857' : '#ea580c', fontWeight: 600 }}>{entry.state}</td>
                          <td style={{ padding: '12px 12px' }}>
                            <input
                              type="checkbox"
                              checked={entry.edge}
                              onChange={() => {
                                const updated = [...stpPorts];
                                updated[idx].edge = !updated[idx].edge;
                                setStpPorts(updated);
                                setStpStatusMsg(`Port ${entry.port} set as ${updated[idx].edge ? 'Edge' : 'Non-Edge'}`);
                              }}
                              style={{ width: 22, height: 22 }}
                            />
                          </td>
                          <td style={{ padding: '12px 12px' }}>
                            <button
                              onClick={() => {
                                const updated = stpPorts.filter((_, i) => i !== idx);
                                setStpPorts(updated);
                                setStpStatusMsg(`Port ${entry.port} removed from STP table.`);
                              }}
                              style={{
                                background: 'linear-gradient(90deg, #fbbf24 0%, #10b981 100%)',
                                color: '#fff',
                                padding: '6px 18px',
                                border: 'none',
                                borderRadius: 10,
                                cursor: 'pointer',
                                fontSize: 15,
                                fontWeight: 600,
                                boxShadow: '0 2px 8px rgba(251, 191, 36, 0.10)',
                                transition: 'all 0.2s',
                              }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {stpStatusMsg && <p style={{ color: '#047857', marginTop: 18, fontWeight: 700, fontSize: 16 }}>{stpStatusMsg}</p>}
              </div>
            </div>
          )}
          {activeSection === 'etherchannel' && (
            <div style={{ width: '100%', minHeight: '80vh', background: '#f7fafc', padding: '0 0 48px 0' }}>
              <div style={{
                background: 'linear-gradient(120deg, #faf5ff 0%, #fef9c3 100%)',
                borderRadius: 36,
                boxShadow: '0 8px 32px rgba(139, 92, 246, 0.09)',
                padding: '48px 64px',
                maxWidth: '1400px',
                margin: '48px auto 0 auto',
                color: '#7c3aed',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 32,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 18 }}>
                  <div style={{ fontSize: 54, color: '#8b5cf6', marginRight: 12 }}>🔗</div>
                  <div>
                    <h2 style={{ fontSize: 34, fontWeight: 800, margin: 0, color: '#7c3aed', letterSpacing: 1 }}>EtherChannel (Link Aggregation)</h2>
                    <p style={{ color: '#ea580c', fontSize: 18, margin: 0, marginTop: 6, maxWidth: 700 }}>
                      Bundle multiple physical links into a single logical link for increased bandwidth and redundancy. Manage EtherChannel groups and their member ports.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 18 }}>
                  <span style={{ fontWeight: 700, fontSize: 20, color: etherChannelEnabled ? '#7c3aed' : '#ea580c' }}>
                    EtherChannel is {etherChannelEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <button
                    onClick={() => {
                      setEtherChannelEnabled(!etherChannelEnabled);
                      setEtherChannelStatusMsg('');
                    }}
                    style={{
                      background: etherChannelEnabled ? 'linear-gradient(90deg, #8b5cf6 0%, #fbbf24 100%)' : 'linear-gradient(90deg, #fbbf24 0%, #ea580c 100%)',
                      color: '#fff',
                      padding: '12px 32px',
                      border: 'none',
                      borderRadius: 14,
                      cursor: 'pointer',
                      fontSize: 18,
                      fontWeight: 700,
                      boxShadow: '0 4px 15px rgba(139, 92, 246, 0.10)',
                      transition: 'all 0.2s',
                      letterSpacing: 1,
                    }}
                  >
                    {etherChannelEnabled ? 'Disable EtherChannel' : 'Enable EtherChannel'}
                  </button>
                  <label style={{ fontWeight: 700, color: '#8b5cf6', fontSize: 20, minWidth: 120 }}>Default Mode</label>
                  <select
                    value={etherChannelMode}
                    onChange={e => {
                      setEtherChannelMode(e.target.value);
                      setEtherChannelStatusMsg(`Default EtherChannel mode set to ${e.target.value}`);
                    }}
                    style={{ fontSize: 18, border: '2px solid #8b5cf6', borderRadius: 14, padding: '8px 18px', color: '#7c3aed', background: '#faf5ff', fontWeight: 700 }}
                  >
                    <option value="LACP">LACP</option>
                    <option value="PAgP">PAgP</option>
                    <option value="Static">Static</option>
                  </select>
                </div>
                <div style={{ overflowX: 'auto', borderRadius: 14, boxShadow: '0 2px 8px rgba(139, 92, 246, 0.04)', background: '#fff' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: '#fff', borderRadius: 14, fontSize: 17 }}>
                    <thead>
                      <tr style={{ background: '#faf5ff', color: '#7c3aed', fontWeight: 700 }}>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>Group</th>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>Mode</th>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>Member Ports</th>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>Status</th>
                        <th style={{ padding: '14px 12px', textAlign: 'left' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {etherChannelGroups.map((entry, idx) => (
                        <tr key={entry.id} style={{ borderBottom: '1.5px solid #e0e7ef' }}>
                          <td style={{ padding: '12px 12px', color: '#ea580c', fontWeight: 700 }}>{entry.name}</td>
                          <td style={{ padding: '12px 12px', color: '#8b5cf6', fontWeight: 600 }}>{entry.mode}</td>
                          <td style={{ padding: '12px 12px' }}>{entry.ports.join(', ')}</td>
                          <td style={{ padding: '12px 12px', color: entry.status === 'Up' ? '#7c3aed' : '#ea580c', fontWeight: 600 }}>{entry.status}</td>
                          <td style={{ padding: '12px 12px' }}>
                            <button
                              onClick={() => {
                                const updated = etherChannelGroups.filter((_, i) => i !== idx);
                                setEtherChannelGroups(updated);
                                setEtherChannelStatusMsg(`EtherChannel group ${entry.name} removed.`);
                              }}
                              style={{
                                background: 'linear-gradient(90deg, #fbbf24 0%, #8b5cf6 100%)',
                                color: '#fff',
                                padding: '6px 18px',
                                border: 'none',
                                borderRadius: 10,
                                cursor: 'pointer',
                                fontSize: 15,
                                fontWeight: 600,
                                boxShadow: '0 2px 8px rgba(251, 191, 36, 0.10)',
                                transition: 'all 0.2s',
                              }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 18, background: '#fff', borderRadius: 14, padding: '18px 24px', boxShadow: '0 2px 8px rgba(139, 92, 246, 0.04)' }}>
                  <input
                    type="text"
                    value={newEtherChannel.name}
                    onChange={e => setNewEtherChannel({ ...newEtherChannel, name: e.target.value })}
                    placeholder="Group Name (e.g. Po3)"
                    style={{ width: 120, height: 44, padding: '0 16px', border: '2px solid #8b5cf6', borderRadius: 14, fontSize: 17, background: '#faf5ff', color: '#7c3aed', fontWeight: 600 }}
                  />
                  <select
                    value={newEtherChannel.mode}
                    onChange={e => setNewEtherChannel({ ...newEtherChannel, mode: e.target.value })}
                    style={{ width: 120, height: 44, padding: '0 12px', border: '2px solid #fbbf24', borderRadius: 14, fontSize: 17, background: '#fff7ed', color: '#ea580c', fontWeight: 600 }}
                  >
                    <option value="LACP">LACP</option>
                    <option value="PAgP">PAgP</option>
                    <option value="Static">Static</option>
                  </select>
                  <select
                    multiple
                    value={newEtherChannel.ports}
                    onChange={e => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setNewEtherChannel({ ...newEtherChannel, ports: selected });
                    }}
                    style={{ width: 200, height: 44, padding: '0 16px', border: '2px solid #8b5cf6', borderRadius: 14, fontSize: 17, background: '#faf5ff', color: '#7c3aed', fontWeight: 600 }}
                  >
                    {availablePorts.map(port => (
                      <option key={port} value={port}>{port}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      if (newEtherChannel.name && newEtherChannel.ports.length > 0) {
                        const newGroup = {
                          id: etherChannelGroups.length + 1,
                          name: newEtherChannel.name,
                          mode: newEtherChannel.mode,
                          ports: newEtherChannel.ports,
                          status: 'Down'
                        };
                        setEtherChannelGroups([...etherChannelGroups, newGroup]);
                        setNewEtherChannel({ name: '', mode: 'LACP', ports: [] });
                        setEtherChannelStatusMsg('EtherChannel group added!');
                      } else {
                        setEtherChannelStatusMsg('Please fill in group name and select ports.');
                      }
                    }}
                    style={{
                      background: 'linear-gradient(90deg, #8b5cf6 0%, #fbbf24 100%)',
                      color: '#fff',
                      padding: '10px 24px',
                      border: 'none',
                      borderRadius: 14,
                      cursor: 'pointer',
                      fontSize: 16,
                      fontWeight: 700,
                      boxShadow: '0 4px 15px rgba(139, 92, 246, 0.10)',
                      transition: 'all 0.2s',
                      letterSpacing: 1,
                    }}
                  >
                    Add Group
                  </button>
                </div>
                {etherChannelStatusMsg && <p style={{ color: '#7c3aed', marginTop: 18, fontWeight: 700, fontSize: 16 }}>{etherChannelStatusMsg}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
      <Tooltip id="main-tooltip" place="top" effect="solid" />
      <Joyride steps={steps} run={runTour} continuous showSkipButton styles={{ options: { primaryColor: '#3b82f6' } }} />
      <VlanModal
        open={vlanModalOpen}
        onClose={() => setVlanModalOpen(false)}
        interfaceName={modalInterfaceName}
        switchType={modalSwitchType}
        onSave={handleVlanSave}
        onCreateVlan={handleVlanCreate}
      />
      <InterfacesModal
        open={interfacesModalOpen}
        onClose={() => setInterfacesModalOpen(false)}
        switchType={modalSwitchType}
        interfaces={modalInterfaces}
        onEdit={handleInterfaceEdit}
        isLoading={isLoadingInterfaces}
      />
      <CreateVlanModal
        open={createVlanModalOpen}
        onClose={() => setCreateVlanModalOpen(false)}
        onAssignToInterface={handleAssignToInterface}
      />
      <DhcpModal
        open={dhcpModalOpen}
        onClose={() => setDhcpModalOpen(false)}
        onAssignToInterface={handleDhcpAssignToInterface}
      />
    </div>
  );
};

export default Dashboard;
