import React from 'react';
import styled from 'styled-components';

const PageContainer = styled.div`  padding: 30px 20px;
  font-family: 'Arial', sans-serif;
  background-color: #f9f9f9;
  min-height: 100vh;`;

const SectionTitle = styled.h2`  font-size: 26px;
  margin-bottom: 20px;
  color: #2c3e50;`;

const DeviceGrid = styled.div`  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;`;

const DeviceCard = styled.div`  background-color: white;
  padding: 20px;
  border-radius: 10px;
  border: 1px solid #ddd;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  text-align: center;`;

const DeviceImage = styled.img`   width: 100px;
  height: auto;
  margin-bottom: 10  `;

const DeviceManagementPage = () => {
return ( <PageContainer> <SectionTitle>Device Management</SectionTitle> <DeviceGrid> <DeviceCard> <DeviceImage src="https://img.icons8.com/ios-filled/100/000000/network-switch.png" al> <h3>Cisco Switches</h3> </DeviceCard>

```
    <DeviceCard>
      <DeviceImage src="https://img.icons8.com/ios-filled/100/000000/router.png" alt="Route>
      <h3>Routers</h3>
    </DeviceCard>

    <DeviceCard>
      <DeviceImage src="https://img.icons8.com/ios-filled/100/000000/firewall.png" alt="Fir>
      <h3>Firewalls</h3>
    </DeviceCard>

    <DeviceCard>
      <DeviceImage src="https://img.icons8.com/ios-filled/100/000000/server.png" alt="Serve>
      <h3>Servers</h3>
    </DeviceCard>
  </DeviceGrid>
</PageContainer>
```

);
};

export default DeviceManagementPage;
