import React from 'react';
import styled from 'styled-components';
import Button from '@mui/material/Button';
import { Paper, Typography, CircularProgress, Divider } from '@mui/material';

const Container = styled.div`
  max-width: 900px;
  margin: 40px auto;
  padding: 32px 16px;
`;

const SectionCard = styled(Paper)`
  && {
    margin-bottom: 32px;
    padding: 32px 24px;
    border-radius: 20px;
    box-shadow: 0 4px 24px 0 rgba(30,58,138,0.08);
    background: #FFF9E5;
  }
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ListItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f3f4f6;
  &:last-child { border-bottom: none; }
`;

const LogBox = styled.div`
  max-height: 220px;
  overflow-y: auto;
  background: #f9fafb;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  font-family: 'Fira Mono', 'Consolas', monospace;
  font-size: 0.98rem;
`;

const Empty = styled.div`
  color: #b0b6c3;
  font-style: italic;
  padding: 12px 0;
`;

function SecurityAgentDashboard({ 
  securityLogs = [], 
  blockedUsers = [], 
  blockedIPs = [], 
  securityLoading = false, 
  securityError = null,
  handleUnblock,
  fetchSecurityData
}) {
  return (
    <Container>
      <Typography variant="h4" color="primary" fontWeight={700} gutterBottom>
        <span role="img" aria-label="shield">🛡️</span> Security Agent Dashboard
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Monitor and control automated security actions. Blocked users and IPs are listed below. Unblock with a click.
      </Typography>
      <Button
        onClick={fetchSecurityData}
        disabled={securityLoading}
        variant="contained"
        color="primary"
        sx={{ mb: 3, borderRadius: 2, fontWeight: 600 }}
      >
        {securityLoading ? <CircularProgress size={22} color="inherit" /> : 'Refresh'}
      </Button>
      {securityError && <Empty style={{ color: '#f97316' }}>{securityError}</Empty>}

      <SectionCard elevation={2}>
        <Typography variant="h6" color="primary" gutterBottom>Blocked Users</Typography>
        <Divider sx={{ mb: 2 }} />
        <List>
          {blockedUsers.length === 0 && <Empty>None</Empty>}
          {blockedUsers.map(user => (
            <ListItem key={user}>
              <span style={{ fontWeight: 500 }}>{user}</span>
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                sx={{ borderRadius: 2, fontWeight: 500 }}
                onClick={() => handleUnblock(user, null)}
                disabled={securityLoading}
              >Unblock</Button>
            </ListItem>
          ))}
        </List>
      </SectionCard>

      <SectionCard elevation={2}>
        <Typography variant="h6" color="primary" gutterBottom>Blocked IPs</Typography>
        <Divider sx={{ mb: 2 }} />
        <List>
          {blockedIPs.length === 0 && <Empty>None</Empty>}
          {blockedIPs.map(ip => (
            <ListItem key={ip}>
              <span style={{ fontWeight: 500 }}>{ip}</span>
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                sx={{ borderRadius: 2, fontWeight: 500 }}
                onClick={() => handleUnblock(null, ip)}
                disabled={securityLoading}
              >Unblock</Button>
            </ListItem>
          ))}
        </List>
      </SectionCard>

      <SectionCard elevation={2}>
        <Typography variant="h6" color="primary" gutterBottom>Agent Actions Log</Typography>
        <Divider sx={{ mb: 2 }} />
        <LogBox>
          {(Array.isArray(securityLogs) ? securityLogs : []).length === 0 ? <Empty>No actions yet.</Empty> :
            (Array.isArray(securityLogs) ? securityLogs : []).map((line, idx) => <div key={idx}>{line}</div>)}
        </LogBox>
      </SectionCard>
    </Container>
  );
}

export default SecurityAgentDashboard; 