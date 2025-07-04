import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const ReportsPageContainer = styled.div`
  padding: 40px 24px;
  background: linear-gradient(120deg, #f9fafb 0%, #FFF9E5 100%);
  min-height: 100vh;
  font-family: 'Inter', 'Poppins', 'Roboto', Arial, sans-serif;
`;

const ReportsPageTitle = styled.h1`
  font-size: 36px;
  color: #1e3a8a;
  font-weight: 700;
  margin-bottom: 28px;
  background: linear-gradient(45deg, #1e3a8a, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const ReportsCard = styled.div`
  background: rgba(255, 255, 255, 0.18);
  border-radius: 18px;
  box-shadow: 0 4px 18px rgba(30, 58, 138, 0.08);
  padding: 32px 24px;
  max-width: 700px;
  margin: 0 auto;
  color: #1A2A44;
`;

function parseLogLine(line) {
  // Example: [2024-07-04T18:20:26.123Z] /api/generate-playbook called by ::1
  const match = line.match(/^\[(.+?)\]\s+(.*)$/);
  if (!match) return { timestamp: '', message: line, level: 'info' };
  const [_, timestamp, message] = match;
  let level = 'info';
  if (/error|fail|denied|not found/i.test(message)) level = 'error';
  else if (/warn|deprecated/i.test(message)) level = 'warn';
  return { timestamp, message, level };
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleString();
}

const levelStyles = {
  info: { color: '#2563eb', icon: 'ℹ️' },
  warn: { color: '#f59e42', icon: '⚠️' },
  error: { color: '#dc2626', icon: '❌' },
};

const placeholderSvg = (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '32px auto', display: 'block' }}>
    <rect x="10" y="30" width="100" height="60" rx="12" fill="#f1f5f9" />
    <rect x="25" y="45" width="70" height="10" rx="4" fill="#cbd5e1" />
    <rect x="25" y="60" width="50" height="10" rx="4" fill="#e0e7ef" />
    <rect x="25" y="75" width="40" height="10" rx="4" fill="#e0e7ef" />
    <circle cx="100" cy="40" r="6" fill="#fbbf24" />
    <circle cx="100" cy="80" r="6" fill="#3b82f6" />
  </svg>
);

const ReportsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/logs');
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const parsedLogs = logs.map(parseLogLine);
  const filteredLogs = parsedLogs.filter(l => l.message.toLowerCase().includes(filter.toLowerCase()));
  const lastLog = parsedLogs.length > 0 ? parsedLogs[parsedLogs.length - 1] : null;

  const handleDownload = () => {
    const blob = new Blob([logs.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit.log';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ReportsPageContainer>
      <ReportsPageTitle>Audit Logs</ReportsPageTitle>
      <ReportsCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 18, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 16, color: '#64748b', fontWeight: 600 }}>
            <span style={{ marginRight: 16 }}>Total: <b>{parsedLogs.length}</b></span>
            {lastLog && <span>Last: <b>{timeAgo(lastLog.timestamp)}</b></span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: levelStyles.info.color }}>{levelStyles.info.icon} Info</span>
            <span style={{ color: levelStyles.warn.color }}>{levelStyles.warn.icon} Warning</span>
            <span style={{ color: levelStyles.error.color }}>{levelStyles.error.icon} Error</span>
          </div>
          <input
            type="text"
            placeholder="Filter logs..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ flex: 1, minWidth: 180, maxWidth: 260, padding: '8px 14px', border: '1.5px solid #e0e7ef', borderRadius: 8, fontSize: 15 }}
          />
          <button onClick={fetchLogs} style={{ background: 'linear-gradient(90deg, #1e3a8a 0%, #3b82f6 100%)', color: '#fff', padding: '8px 18px', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Refresh</button>
          <button onClick={handleDownload} style={{ background: 'linear-gradient(90deg, #fbbf24 0%, #3b82f6 100%)', color: '#fff', padding: '8px 18px', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Download</button>
        </div>
        {loading && <div style={{ color: '#1e3a8a', fontWeight: 600 }}>Loading logs...</div>}
        {error && <div style={{ color: '#ea580c', fontWeight: 700 }}>{error}</div>}
        <div style={{ maxHeight: 400, overflowY: 'auto', background: '#f8fafc', borderRadius: 10, padding: 18, fontFamily: 'monospace', fontSize: 15, color: '#334155', border: '1.5px solid #e0e7ef', minHeight: 120 }}>
          {filteredLogs.length === 0 && !loading ? (
            <div style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
              {placeholderSvg}
              <div>No logs found. All clear!</div>
            </div>
          ) :
            filteredLogs.map((log, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                <span style={{ fontSize: 18, color: levelStyles[log.level].color, minWidth: 24 }}>{levelStyles[log.level].icon}</span>
                <span style={{ color: '#64748b', minWidth: 120, fontSize: 13 }}>{log.timestamp && new Date(log.timestamp).toLocaleString()}</span>
                <span style={{ color: levelStyles[log.level].color, fontWeight: 700 }}>{log.message}</span>
                <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 'auto' }}>{log.timestamp && timeAgo(log.timestamp)}</span>
              </div>
            ))}
        </div>
      </ReportsCard>
    </ReportsPageContainer>
  );
};

export default ReportsPage;

