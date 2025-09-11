import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  Card, 
  CardContent, 
  Grid, 
  Chip, 
  Alert, 
  Divider,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import { 
  PlayArrow, 
  Stop, 
  Security, 
  Warning, 
  CheckCircle, 
  Error, 
  Refresh,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';

const cardStyle = {
  background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
  borderRadius: 24,
  boxShadow: '0 4px 24px 0 rgba(239,68,68,0.15)',
  padding: '32px 28px',
  marginBottom: 32,
  border: '2px solid #ef4444',
  minHeight: 80,
};

const logBoxStyle = {
  background: '#1f2937',
  border: '1.5px solid #374151',
  borderRadius: 12,
  padding: 16,
  fontFamily: 'Fira Code, Consolas, monospace',
  fontSize: '0.85rem',
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
  wordWrap: 'break-word',
  minHeight: 200,
  maxHeight: 400,
  overflow: 'auto',
  color: '#f9fafb',
};

const threatCardStyle = {
  background: 'rgba(255,255,255,0.95)',
  borderRadius: 16,
  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
  border: '2px solid #e2e8f0',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
  },
};

const SecurityMonitorAgent = () => {
  const [monitoringStatus, setMonitoringStatus] = useState('stopped'); // stopped, starting, active, error
  const [logs, setLogs] = useState([]);
  const [threats, setThreats] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    totalLogs: 0,
    threatsDetected: 0,
    alertsGenerated: 0,
    lastUpdate: null
  });
  const [showLogs, setShowLogs] = useState(true);
  const [showThreats, setShowThreats] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const logsEndRef = useRef(null);
  const threatsEndRef = useRef(null);
  const alertsEndRef = useRef(null);

  // Remove auto-scrolling to make logs readable
  // useEffect(() => {
  //   logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [logs]);

  // useEffect(() => {
  //   threatsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [threats]);

  // useEffect(() => {
  //   alertsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [alerts]);

  // Polling for real-time updates
  useEffect(() => {
    let interval;
    if (monitoringStatus === 'active') {
              interval = setInterval(() => {
          fetchStatus();
          fetchLogs();
          fetchThreats();
          fetchAlerts();
        }, 5000); // Update every 5 seconds to reduce glitching
    }
    return () => clearInterval(interval);
  }, [monitoringStatus]);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/security-monitor/status');
      if (response.ok) {
        const data = await response.json();
        setMonitoringStatus(data.status);
        setStats(prev => ({
          ...prev,
          totalLogs: data.totalLogs || 0,
          threatsDetected: data.threatsDetected || 0,
          alertsGenerated: data.alertsGenerated || 0,
          lastUpdate: new Date().toLocaleTimeString()
        }));
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/security-monitor/logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  };

  const fetchThreats = async () => {
    try {
      const response = await fetch('/api/security-monitor/threats');
      if (response.ok) {
        const data = await response.json();
        setThreats(data.threats || []);
      }
    } catch (err) {
      console.error('Failed to fetch threats:', err);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/security-monitor/alerts');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  const startMonitoring = async () => {
    try {
      setMonitoringStatus('starting');
      setError('');
      setSuccess('');
      
      const response = await fetch('/api/security-monitor/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMonitoringStatus('active');
        setSuccess('Security monitoring started successfully!');
        setLogs(data.logs || []);
        setThreats(data.threats || []);
        setAlerts(data.alerts || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to start monitoring');
        setMonitoringStatus('error');
      }
    } catch (err) {
      setError('Failed to connect to security monitor service');
      setMonitoringStatus('error');
    }
  };

  const stopMonitoring = async () => {
    try {
      const response = await fetch('/api/security-monitor/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setMonitoringStatus('stopped');
        setSuccess('Security monitoring stopped successfully!');
        setLogs([]);
        setThreats([]);
        setAlerts([]);
        setStats({
          totalLogs: 0,
          threatsDetected: 0,
          alertsGenerated: 0,
          lastUpdate: null
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to stop monitoring');
      }
    } catch (err) {
      setError('Failed to connect to security monitor service');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'starting': return '#f59e0b';
      case 'stopped': return '#6b7280';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle style={{ color: '#10b981' }} />;
      case 'starting': return <CircularProgress size={20} color="warning" />;
      case 'stopped': return <Stop style={{ color: '#6b7280' }} />;
      case 'error': return <Error style={{ color: '#ef4444' }} />;
      default: return <Stop style={{ color: '#6b7280' }} />;
    }
  };

  const getThreatSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return '#dc2626';
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    try {
      return new Date(timestamp).toLocaleTimeString();
    } catch {
      return timestamp;
    }
  };

  return (
    <Box>
      {/* Main Control Panel */}
      <Box sx={{ ...cardStyle, marginBottom: 24 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Security sx={{ fontSize: 32, color: '#ef4444' }} />
            <Typography variant="h5" sx={{ color: '#dc2626', fontWeight: 700 }}>
              AI Security Monitor
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip 
              label={monitoringStatus.toUpperCase()} 
              sx={{ 
                backgroundColor: getStatusColor(monitoringStatus),
                color: 'white',
                fontWeight: 600
              }}
            />
            {getStatusIcon(monitoringStatus)}
          </Box>
        </Box>
        
        <Typography variant="body1" sx={{ color: '#7f1d1d', marginBottom: 3, fontSize: '1.1rem' }}>
          Real-time network security monitoring with AI-powered threat detection. Monitor Cisco switch logs, detect suspicious activities, and receive intelligent security alerts.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={startMonitoring}
            disabled={monitoringStatus === 'starting' || monitoringStatus === 'active'}
            sx={{
              backgroundColor: '#10b981',
              '&:hover': { backgroundColor: '#059669' },
              '&:disabled': { backgroundColor: '#9ca3af' }
            }}
          >
            {monitoringStatus === 'starting' ? 'Starting...' : 'Start Monitoring'}
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Stop />}
            onClick={stopMonitoring}
            disabled={monitoringStatus === 'stopped' || monitoringStatus === 'starting'}
            sx={{
              borderColor: '#ef4444',
              color: '#ef4444',
              '&:hover': { 
                borderColor: '#dc2626',
                backgroundColor: 'rgba(239, 68, 68, 0.04)'
              }
            }}
          >
            Stop Monitoring
          </Button>

          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              fetchStatus();
              fetchLogs();
              fetchThreats();
              fetchAlerts();
            }}
            sx={{
              borderColor: '#6366f1',
              color: '#6366f1',
              '&:hover': { 
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(99, 102, 241, 0.04)'
              }
            }}
          >
            Refresh
          </Button>
        </Box>

        {/* Status Messages */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
      </Box>

      {/* Statistics Dashboard */}
      <Grid container spacing={3} sx={{ marginBottom: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ ...threatCardStyle, borderColor: '#10b981' }}>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ color: '#10b981', mb: 1 }}>📊</Typography>
              <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 700 }}>
                {stats.totalLogs}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                Total Logs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ ...threatCardStyle, borderColor: '#ef4444' }}>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ color: '#ef4444', mb: 1 }}>🚨</Typography>
              <Typography variant="h6" sx={{ color: '#ef4444', fontWeight: 700 }}>
                {stats.threatsDetected}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                Threats Detected
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ ...threatCardStyle, borderColor: '#f59e0b' }}>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ color: '#f59e0b', mb: 1 }}>⚠️</Typography>
              <Typography variant="h6" sx={{ color: '#f59e0b', fontWeight: 700 }}>
                {stats.alertsGenerated}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                Alerts Generated
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ ...threatCardStyle, borderColor: '#6366f1' }}>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ color: '#6366f1', mb: 1 }}>🕒</Typography>
              <Typography variant="h6" sx={{ color: '#6366f1', fontWeight: 700 }}>
                {stats.lastUpdate || 'N/A'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                Last Update
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Live Data Display */}
      <Grid container spacing={3}>
        {/* Live Switch Logs */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ ...threatCardStyle, height: 'fit-content' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151' }}>
                  📊 Live Switch Logs
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => setShowLogs(!showLogs)}
                >
                  {showLogs ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </Box>
              
              {showLogs ? (
                <Box sx={logBoxStyle}>
                  {logs.length > 0 ? (
                    logs.map((log, index) => (
                      <Box key={index} sx={{ mb: 1, fontSize: '0.8rem' }}>
                        <span style={{ color: '#9ca3af' }}>
                          [{formatTimestamp(log.timestamp)}]
                        </span>
                        <span style={{ color: '#f9fafb' }}>
                          {log.message}
                        </span>
                      </Box>
                    ))
                  ) : (
                    <Typography sx={{ color: '#9ca3af', fontStyle: 'italic' }}>
                      {monitoringStatus === 'active' ? 'Waiting for switch logs...' : 'No logs available'}
                    </Typography>
                  )}
                  <div ref={logsEndRef} />
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography sx={{ color: '#9ca3af' }}>
                    Logs hidden
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Threat Detection */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ ...threatCardStyle, height: 'fit-content' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151' }}>
                  🚨 Threat Detection
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => setShowThreats(!showThreats)}
                >
                  {showThreats ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </Box>
              
              {showThreats ? (
                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {threats.length > 0 ? (
                    threats.map((threat, index) => (
                      <Box key={index} sx={{ mb: 2, p: 2, backgroundColor: '#fef2f2', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Chip 
                            label={threat.severity || 'Unknown'} 
                            size="small"
                            sx={{ 
                              backgroundColor: getThreatSeverityColor(threat.severity),
                              color: 'white',
                              fontWeight: 600
                            }}
                          />
                          <Typography variant="caption" sx={{ color: '#6b7280' }}>
                            {formatTimestamp(threat.timestamp)}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                          {threat.type || 'Unknown Threat'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.8rem' }}>
                          {threat.description || 'No description available'}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography sx={{ color: '#9ca3af', fontStyle: 'italic', textAlign: 'center', py: 4 }}>
                      {monitoringStatus === 'active' ? 'No threats detected' : 'Threat detection inactive'}
                    </Typography>
                  )}
                  <div ref={threatsEndRef} />
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography sx={{ color: '#9ca3af' }}>
                    Threats hidden
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Security Alerts */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ ...threatCardStyle, height: 'fit-content' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151' }}>
                  ⚠️ Security Alerts
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => setShowAlerts(!showAlerts)}
                >
                  {showAlerts ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </Box>
              
              {showAlerts ? (
                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {alerts.length > 0 ? (
                    alerts.map((alert, index) => (
                      <Box key={index} sx={{ mb: 2, p: 2, backgroundColor: '#fffbeb', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Chip 
                            label={alert.level || 'Info'} 
                            size="small"
                            sx={{ 
                              backgroundColor: alert.level === 'Critical' ? '#ef4444' : '#f59e0b',
                              color: 'white',
                              fontWeight: 600
                            }}
                          />
                          <Typography variant="caption" sx={{ color: '#6b7280' }}>
                            {formatTimestamp(alert.timestamp)}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                          {alert.title || 'Security Alert'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.8rem' }}>
                          {alert.message || 'No message available'}
                        </Typography>
                        {alert.recommendation && (
                          <Box sx={{ mt: 1, p: 1, backgroundColor: '#f0f9ff', borderRadius: 1 }}>
                            <Typography variant="caption" sx={{ color: '#0369a1', fontWeight: 600 }}>
                              💡 Recommendation:
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#0369a1', display: 'block', mt: 0.5 }}>
                              {alert.recommendation}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    ))
                  ) : (
                    <Typography sx={{ color: '#9ca3af', fontStyle: 'italic', textAlign: 'center', py: 4 }}>
                      {monitoringStatus === 'active' ? 'No alerts generated' : 'Alert system inactive'}
                    </Typography>
                  )}
                  <div ref={alertsEndRef} />
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography sx={{ color: '#9ca3af' }}>
                    Alerts hidden
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Connection Status */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: '#6b7280' }}>
          Monitoring Cisco Switch: 192.168.111.198 | 
          Status: {monitoringStatus === 'active' ? '🟢 Connected' : monitoringStatus === 'starting' ? '🟡 Connecting...' : '🔴 Disconnected'}
        </Typography>
      </Box>
    </Box>
  );
};

export default SecurityMonitorAgent; 