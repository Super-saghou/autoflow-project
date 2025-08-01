import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const FirewallingPageContainer = styled.div`
  padding: 40px 24px;
  background: linear-gradient(120deg, #f9fafb 0%, #FFF9E5 100%);
  min-height: 100vh;
  font-family: 'Inter', 'Poppins', 'Roboto', Arial, sans-serif;
`;

const FirewallingPageTitle = styled.h1`
  font-size: 36px;
  color: #1e3a8a;
  font-weight: 700;
  margin-bottom: 28px;
  background: linear-gradient(45deg, #1e3a8a, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const FirewallingCard = styled.div`
  background: rgba(255, 255, 255, 0.18);
  border-radius: 18px;
  box-shadow: 0 4px 18px rgba(30, 58, 138, 0.08);
  padding: 32px 24px;
  max-width: 1200px;
  margin: 0 auto;
  color: #1A2A44;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid rgba(59, 130, 246, 0.1);
  padding-bottom: 16px;
`;

const Tab = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  background: ${props => props.active ? 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)' : 'rgba(255, 255, 255, 0.6)'};
  color: ${props => props.active ? 'white' : '#374151'};
  font-weight: ${props => props.active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;

  &:hover {
    background: ${props => props.active ? 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)' : 'rgba(59, 130, 246, 0.1)'};
    transform: translateY(-2px);
  }
`;

const Section = styled.div`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h3`
  font-size: 20px;
  color: #1e3a8a;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusCard = styled.div`
  background: linear-gradient(135deg, ${props => props.status === 'connected' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'} 0%, rgba(255, 255, 255, 0.8) 100%);
  border: 2px solid ${props => props.status === 'connected' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
`;

const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-right: 12px;
  margin-bottom: 12px;

  &:hover {
    background: linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const DangerButton = styled(Button)`
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);

  &:hover {
    background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
  }
`;

const SuccessButton = styled(Button)`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);

  &:hover {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const Th = styled.th`
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  color: white;
  padding: 16px;
  text-align: left;
  font-weight: 600;
`;

const Td = styled.td`
  padding: 12px 16px;
  border-bottom: 1px solid rgba(59, 130, 246, 0.1);
`;

const FirewallingPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [fortigateStatus, setFortigateStatus] = useState('disconnected');
  const [fortigateConfig, setFortigateConfig] = useState({
    host: '192.168.1.99',
    port: 443,
    username: 'admin',
    apiToken: ''
  });
  const [firewallRules, setFirewallRules] = useState([]);
  const [vpnConnections, setVpnConnections] = useState([]);
  const [securityProfiles, setSecurityProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch FortiGate status
  const fetchFortigateStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/fortigate/status');
      if (response.ok) {
        const data = await response.json();
        setFortigateStatus(data.status);
      } else {
        setFortigateStatus('disconnected');
      }
    } catch (err) {
      setFortigateStatus('disconnected');
      setError('Failed to connect to FortiGate');
    } finally {
      setLoading(false);
    }
  };

  // Connect to FortiGate
  const connectToFortigate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/fortigate/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fortigateConfig)
      });
      
      if (response.ok) {
        const data = await response.json();
        setFortigateStatus('connected');
        // Fetch initial data
        fetchFirewallRules();
        fetchVpnConnections();
        fetchSecurityProfiles();
      } else {
        throw new Error('Failed to connect to FortiGate');
      }
    } catch (err) {
      setError(err.message);
      setFortigateStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  // Fetch firewall rules
  const fetchFirewallRules = async () => {
    try {
      const response = await fetch('/api/fortigate/firewall-rules');
      if (response.ok) {
        const data = await response.json();
        setFirewallRules(data.rules || []);
      }
    } catch (err) {
      console.error('Failed to fetch firewall rules:', err);
    }
  };

  // Fetch VPN connections
  const fetchVpnConnections = async () => {
    try {
      const response = await fetch('/api/fortigate/vpn-connections');
      if (response.ok) {
        const data = await response.json();
        setVpnConnections(data.connections || []);
      }
    } catch (err) {
      console.error('Failed to fetch VPN connections:', err);
    }
  };

  // Fetch security profiles
  const fetchSecurityProfiles = async () => {
    try {
      const response = await fetch('/api/fortigate/security-profiles');
      if (response.ok) {
        const data = await response.json();
        setSecurityProfiles(data.profiles || []);
      }
    } catch (err) {
      console.error('Failed to fetch security profiles:', err);
    }
  };

  // Create new firewall rule
  const createFirewallRule = async (ruleData) => {
    try {
      const response = await fetch('/api/fortigate/firewall-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData)
      });
      
      if (response.ok) {
        fetchFirewallRules();
      } else {
        throw new Error('Failed to create firewall rule');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete firewall rule
  const deleteFirewallRule = async (ruleId) => {
    try {
      const response = await fetch(`/api/fortigate/firewall-rules/${ruleId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchFirewallRules();
      } else {
        throw new Error('Failed to delete firewall rule');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchFortigateStatus();
  }, []);

  const renderOverview = () => (
    <Section>
      <SectionTitle>🔒 FortiGate Connection Status</SectionTitle>
      <StatusCard status={fortigateStatus}>
        <div style={{ fontSize: '24px' }}>
          {fortigateStatus === 'connected' ? '🟢' : '🔴'}
        </div>
        <div>
          <h4 style={{ margin: '0 0 4px 0', color: fortigateStatus === 'connected' ? '#047857' : '#dc2626' }}>
            {fortigateStatus === 'connected' ? 'Connected to FortiGate' : 'Disconnected from FortiGate'}
          </h4>
          <p style={{ margin: 0, color: '#6b7280' }}>
            {fortigateStatus === 'connected' 
              ? `Connected to ${fortigateConfig.host}:${fortigateConfig.port}`
              : 'Click "Connect" to establish connection'
            }
          </p>
        </div>
      </StatusCard>

      {fortigateStatus === 'disconnected' && (
        <div style={{ background: 'rgba(255, 255, 255, 0.8)', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 16px 0' }}>FortiGate Configuration</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Host IP:</label>
              <input
                type="text"
                value={fortigateConfig.host}
                onChange={(e) => setFortigateConfig({...fortigateConfig, host: e.target.value})}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px' }}
                placeholder="192.168.1.99"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Port:</label>
              <input
                type="number"
                value={fortigateConfig.port}
                onChange={(e) => setFortigateConfig({...fortigateConfig, port: parseInt(e.target.value)})}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px' }}
                placeholder="443"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Username:</label>
              <input
                type="text"
                value={fortigateConfig.username}
                onChange={(e) => setFortigateConfig({...fortigateConfig, username: e.target.value})}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px' }}
                placeholder="admin"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>API Token:</label>
              <input
                type="password"
                value={fortigateConfig.apiToken}
                onChange={(e) => setFortigateConfig({...fortigateConfig, apiToken: e.target.value})}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px' }}
                placeholder="Enter API token"
              />
            </div>
          </div>
          <Button onClick={connectToFortigate} disabled={loading}>
            {loading ? 'Connecting...' : 'Connect to FortiGate'}
          </Button>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {fortigateStatus === 'connected' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.8)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛡️</div>
            <h4 style={{ margin: '0 0 8px 0' }}>Firewall Rules</h4>
            <p style={{ margin: 0, color: '#6b7280' }}>{firewallRules.length} active rules</p>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.8)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔐</div>
            <h4 style={{ margin: '0 0 8px 0' }}>VPN Connections</h4>
            <p style={{ margin: 0, color: '#6b7280' }}>{vpnConnections.length} active connections</p>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.8)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔒</div>
            <h4 style={{ margin: '0 0 8px 0' }}>Security Profiles</h4>
            <p style={{ margin: 0, color: '#6b7280' }}>{securityProfiles.length} configured profiles</p>
          </div>
        </div>
      )}
    </Section>
  );

  const renderFirewallRules = () => (
    <Section>
      <SectionTitle>🛡️ Firewall Rules Management</SectionTitle>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <Button onClick={() => setActiveTab('create-rule')}>Create New Rule</Button>
        <Button onClick={fetchFirewallRules}>Refresh Rules</Button>
      </div>

      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Source</Th>
            <Th>Destination</Th>
            <Th>Service</Th>
            <Th>Action</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {firewallRules.map((rule, index) => (
            <tr key={index}>
              <Td>{rule.name}</Td>
              <Td>{rule.source}</Td>
              <Td>{rule.destination}</Td>
              <Td>{rule.service}</Td>
              <Td>
                <span style={{ 
                  color: rule.action === 'allow' ? '#10b981' : '#dc2626',
                  fontWeight: '600'
                }}>
                  {rule.action}
                </span>
              </Td>
              <Td>
                <span style={{ 
                  color: rule.status === 'enabled' ? '#10b981' : '#6b7280',
                  fontWeight: '600'
                }}>
                  {rule.status}
                </span>
              </Td>
              <Td>
                <Button 
                  style={{ padding: '6px 12px', fontSize: '12px', marginRight: '8px' }}
                  onClick={() => setActiveTab('edit-rule')}
                >
                  Edit
                </Button>
                <DangerButton 
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => deleteFirewallRule(rule.id)}
                >
                  Delete
                </DangerButton>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      {firewallRules.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛡️</div>
          <h4>No Firewall Rules Found</h4>
          <p>Create your first firewall rule to get started</p>
        </div>
      )}
    </Section>
  );

  const renderVpnConnections = () => (
    <Section>
      <SectionTitle>🔐 VPN Connections</SectionTitle>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <Button onClick={() => setActiveTab('create-vpn')}>Create VPN Tunnel</Button>
        <Button onClick={fetchVpnConnections}>Refresh Connections</Button>
      </div>

      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Type</Th>
            <Th>Remote IP</Th>
            <Th>Status</Th>
            <Th>Uptime</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {vpnConnections.map((vpn, index) => (
            <tr key={index}>
              <Td>{vpn.name}</Td>
              <Td>{vpn.type}</Td>
              <Td>{vpn.remoteIp}</Td>
              <Td>
                <span style={{ 
                  color: vpn.status === 'up' ? '#10b981' : '#dc2626',
                  fontWeight: '600'
                }}>
                  {vpn.status}
                </span>
              </Td>
              <Td>{vpn.uptime}</Td>
              <Td>
                <Button 
                  style={{ padding: '6px 12px', fontSize: '12px', marginRight: '8px' }}
                  onClick={() => setActiveTab('edit-vpn')}
                >
                  Edit
                </Button>
                <DangerButton 
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  Disconnect
                </DangerButton>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      {vpnConnections.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
          <h4>No VPN Connections</h4>
          <p>Create your first VPN tunnel to get started</p>
        </div>
      )}
    </Section>
  );

  const renderSecurityProfiles = () => (
    <Section>
      <SectionTitle>🔒 Security Profiles</SectionTitle>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <Button onClick={() => setActiveTab('create-profile')}>Create Security Profile</Button>
        <Button onClick={fetchSecurityProfiles}>Refresh Profiles</Button>
      </div>

      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Type</Th>
            <Th>Status</Th>
            <Th>Applied Rules</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {securityProfiles.map((profile, index) => (
            <tr key={index}>
              <Td>{profile.name}</Td>
              <Td>{profile.type}</Td>
              <Td>
                <span style={{ 
                  color: profile.status === 'active' ? '#10b981' : '#6b7280',
                  fontWeight: '600'
                }}>
                  {profile.status}
                </span>
              </Td>
              <Td>{profile.appliedRules}</Td>
              <Td>
                <Button 
                  style={{ padding: '6px 12px', fontSize: '12px', marginRight: '8px' }}
                  onClick={() => setActiveTab('edit-profile')}
                >
                  Edit
                </Button>
                <DangerButton 
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  Delete
                </DangerButton>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      {securityProfiles.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h4>No Security Profiles</h4>
          <p>Create your first security profile to get started</p>
        </div>
      )}
    </Section>
  );

  return (
    <FirewallingPageContainer>
      <FirewallingPageTitle>Firewalling with FortiGate</FirewallingPageTitle>
      <FirewallingCard>
        <TabContainer>
          <Tab 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </Tab>
          <Tab 
            active={activeTab === 'firewall-rules'} 
            onClick={() => setActiveTab('firewall-rules')}
          >
            Firewall Rules
          </Tab>
          <Tab 
            active={activeTab === 'vpn-connections'} 
            onClick={() => setActiveTab('vpn-connections')}
          >
            VPN Connections
          </Tab>
          <Tab 
            active={activeTab === 'security-profiles'} 
            onClick={() => setActiveTab('security-profiles')}
          >
            Security Profiles
          </Tab>
        </TabContainer>

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'firewall-rules' && renderFirewallRules()}
        {activeTab === 'vpn-connections' && renderVpnConnections()}
        {activeTab === 'security-profiles' && renderSecurityProfiles()}
      </FirewallingCard>
    </FirewallingPageContainer>
  );
};

export default FirewallingPage; 