import React from 'react';
import styled from 'styled-components';

const PageContainer = styled.div`
  padding: 40px 24px;
  font-family: 'Inter', 'Poppins', 'Roboto', Arial, sans-serif;
  background: linear-gradient(120deg, #f9fafb 0%, #FFF9E5 100%);
  min-height: 100vh;
`;

const SectionTitle = styled.h2`
  font-size: 32px;
  margin-bottom: 32px;
  color: #1e3a8a;
  font-weight: 700;
  background: linear-gradient(45deg, #1e3a8a, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const DeviceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 28px;
`;

const DeviceCard = styled.div`
  background: rgba(255, 255, 255, 0.18);
  padding: 32px 20px;
  border-radius: 20px;
  border: 1.5px solid rgba(30, 58, 138, 0.10);
  box-shadow: 0 4px 18px rgba(30, 58, 138, 0.08);
  text-align: center;
  transition: box-shadow 0.2s, transform 0.2s;
  &:hover {
    box-shadow: 0 8px 32px rgba(30, 58, 138, 0.14);
    transform: translateY(-4px) scale(1.03);
  }
`;

const DeviceImage = styled.img`
  width: 90px;
  height: auto;
  margin-bottom: 16px;
`;

const DeviceManagementPage = () => {
  return (
    <PageContainer>
      <SectionTitle>Device Management</SectionTitle>
      <DeviceGrid>
        <DeviceCard>
          <DeviceImage src="https://img.icons8.com/ios-filled/100/1e3a8a/network-switch.png" alt="Switch" />
          <h3>Cisco Switches</h3>
        </DeviceCard>
        <DeviceCard>
          <DeviceImage src="https://img.icons8.com/ios-filled/100/1e3a8a/router.png" alt="Router" />
          <h3>Routers</h3>
        </DeviceCard>
        <DeviceCard>
          <DeviceImage src="https://img.icons8.com/ios-filled/100/1e3a8a/firewall.png" alt="Firewall" />
          <h3>Firewalls</h3>
        </DeviceCard>
        <DeviceCard>
          <DeviceImage src="https://img.icons8.com/ios-filled/100/1e3a8a/server.png" alt="Server" />
          <h3>Servers</h3>
        </DeviceCard>
      </DeviceGrid>
    </PageContainer>
  );
};

export default DeviceManagementPage;
