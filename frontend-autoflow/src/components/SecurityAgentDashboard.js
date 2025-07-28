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
    <Container style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)', borderRadius: 36, boxShadow: '0 8px 32px rgba(99,102,241,0.10)', padding: '48px 0', marginTop: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 32 }}>
        <div style={{ fontSize: 72, color: '#6366f1', marginRight: 18 }}>🧑‍💼</div>
        <div>
          <Typography variant="h3" style={{ color: '#6366f1', fontWeight: 900, letterSpacing: 2, textShadow: '0 2px 12px #e0e7ff', marginBottom: 8 }} gutterBottom>
            Agent
          </Typography>
          <Typography variant="h5" style={{ color: '#0ea5e9', fontWeight: 700, marginBottom: 0, letterSpacing: 1 }} gutterBottom>
            Full agentic automation: let the agents handle real network tasks, not just chat.
          </Typography>
        </div>
      </div>
      <Divider sx={{ mb: 4 }} />
      <SectionCard elevation={3} style={{ background: 'rgba(236, 233, 254, 0.95)', border: '2px solid #6366f1', boxShadow: '0 4px 24px 0 rgba(99,102,241,0.10)' }}>
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
      <SectionCard elevation={3} style={{ background: 'rgba(236, 233, 254, 0.95)', border: '2px solid #6366f1', boxShadow: '0 4px 24px 0 rgba(99,102,241,0.10)' }}>
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
      <SectionCard elevation={3} style={{ background: 'rgba(236, 233, 254, 0.95)', border: '2px solid #6366f1', boxShadow: '0 4px 24px 0 rgba(99,102,241,0.10)' }}>
        <Typography variant="h6" color="primary" gutterBottom>Agent Actions Log</Typography>
        <Divider sx={{ mb: 2 }} />
        <LogBox style={{ background: '#f4f7ff', border: '1.5px solid #6366f1', minHeight: 120 }}>
          {(Array.isArray(securityLogs) ? securityLogs : []).length === 0 ? <Empty>No actions yet.</Empty> :
            (Array.isArray(securityLogs) ? securityLogs : []).map((line, idx) => <div key={idx}>{line}</div>)}
        </LogBox>
      </SectionCard>
    </Container>
  );
}

export default SecurityAgentDashboard; 