import React, { useState, useEffect } from 'react';

const MonitoringPage = ({ API_URL }) => {
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [logLevel, setLogLevel] = useState('all');

  useEffect(() => {
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      // Fetch all monitoring data in parallel
      const [healthRes, metricsRes, logsRes, alertsRes] = await Promise.all([
        fetch(`${API_URL}/api/monitoring/health`, { headers }),
        fetch(`${API_URL}/api/monitoring/metrics`, { headers }),
        fetch(`${API_URL}/api/monitoring/logs?limit=50&level=${logLevel === 'all' ? '' : logLevel}`, { headers }),
        fetch(`${API_URL}/api/monitoring/alerts?limit=20`, { headers })
      ]);

      const [healthData, metricsData, logsData, alertsData] = await Promise.all([
        healthRes.json(),
        metricsRes.json(),
        logsRes.json(),
        alertsRes.json()
      ]);

      if (healthData.success) setHealth(healthData.data);
      if (metricsData.success) setMetrics(metricsData.data);
      if (logsData.success) setLogs(logsData.data);
      if (alertsData.success) setAlerts(alertsData.data);
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      case 'error': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      case 'debug': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading && !health) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        fontSize: '18px',
        color: '#6b7280'
      }}>
        🔄 Loading monitoring data...
      </div>
    );
  }

  return (
    <div style={{ width: '100%', minHeight: '80vh', background: '#f7fafc', padding: '0 0 48px 0' }}>
      <div style={{
        background: 'linear-gradient(120deg, #1e293b 0%, #334155 100%)',
        borderRadius: 36,
        boxShadow: '0 8px 32px rgba(30, 41, 59, 0.12)',
        padding: '48px 64px',
        maxWidth: '1400px',
        margin: '48px auto 0 auto',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 32,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 18 }}>
          <div style={{ fontSize: 54, color: '#60a5fa', marginRight: 12 }}>📊</div>
          <div>
            <h2 style={{ fontSize: 34, fontWeight: 800, margin: 0, color: '#f8fafc', letterSpacing: 1 }}>
              System Monitoring
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: 18, margin: 0, marginTop: 6, maxWidth: 700 }}>
              Real-time monitoring of system health, performance metrics, logs, and security alerts.
            </p>
          </div>
        </div>

        {/* Status Overview */}
        {health && (
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.05)', 
            borderRadius: 16, 
            padding: '24px',
            border: `2px solid ${getStatusColor(health.status)}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                background: getStatusColor(health.status),
                boxShadow: `0 0 8px ${getStatusColor(health.status)}`
              }}></div>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: 20, fontWeight: 700 }}>
                System Status: {health.status.toUpperCase()}
              </h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div>
                <span style={{ color: '#cbd5e1', fontSize: 14 }}>Total Logs</span>
                <div style={{ color: '#f8fafc', fontSize: 24, fontWeight: 700 }}>{health.summary?.totalLogs || 0}</div>
              </div>
              <div>
                <span style={{ color: '#cbd5e1', fontSize: 14 }}>Active Alerts</span>
                <div style={{ color: '#f8fafc', fontSize: 24, fontWeight: 700 }}>{health.summary?.totalAlerts || 0}</div>
              </div>
              <div>
                <span style={{ color: '#cbd5e1', fontSize: 14 }}>Errors</span>
                <div style={{ color: '#ef4444', fontSize: 24, fontWeight: 700 }}>{health.summary?.errorCount || 0}</div>
              </div>
              <div>
                <span style={{ color: '#cbd5e1', fontSize: 14 }}>Warnings</span>
                <div style={{ color: '#f59e0b', fontSize: 24, fontWeight: 700 }}>{health.summary?.warningCount || 0}</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          {['overview', 'metrics', 'logs', 'alerts'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                color: '#f8fafc',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ minHeight: '400px' }}>
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
              {/* System Info */}
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: 12, padding: '20px' }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#f8fafc' }}>🖥️ System Information</h4>
                {metrics && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#cbd5e1' }}>Hostname:</span>
                      <span style={{ color: '#f8fafc' }}>{metrics.system?.hostname}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#cbd5e1' }}>Platform:</span>
                      <span style={{ color: '#f8fafc' }}>{metrics.system?.platform}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#cbd5e1' }}>CPU Cores:</span>
                      <span style={{ color: '#f8fafc' }}>{metrics.system?.cpu?.cores}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#cbd5e1' }}>Uptime:</span>
                      <span style={{ color: '#f8fafc' }}>{formatUptime(metrics.system?.uptime || 0)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Performance */}
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: 12, padding: '20px' }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#f8fafc' }}>⚡ Performance</h4>
                {metrics && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: '#cbd5e1', fontSize: 14 }}>CPU Load</span>
                        <span style={{ color: '#f8fafc', fontSize: 14 }}>
                          {metrics.system?.cpu?.loadAverage?.[0]?.toFixed(2) || 'N/A'}
                        </span>
                      </div>
                      <div style={{ 
                        background: 'rgba(255, 255, 255, 0.1)', 
                        height: 8, 
                        borderRadius: 4,
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          background: '#60a5fa', 
                          height: '100%', 
                          width: `${Math.min((metrics.system?.cpu?.loadAverage?.[0] || 0) * 20, 100)}%`,
                          transition: 'width 0.3s'
                        }}></div>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: '#cbd5e1', fontSize: 14 }}>Memory Usage</span>
                        <span style={{ color: '#f8fafc', fontSize: 14 }}>
                          {metrics.system?.memory?.usagePercent?.toFixed(1) || 'N/A'}%
                        </span>
                      </div>
                      <div style={{ 
                        background: 'rgba(255, 255, 255, 0.1)', 
                        height: 8, 
                        borderRadius: 4,
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          background: '#10b981', 
                          height: '100%', 
                          width: `${metrics.system?.memory?.usagePercent || 0}%`,
                          transition: 'width 0.3s'
                        }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Alerts */}
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: 12, padding: '20px' }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#f8fafc' }}>🚨 Recent Alerts</h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {alerts.slice(0, 5).map((alert, index) => (
                    <div key={index} style={{ 
                      padding: '8px 0', 
                      borderBottom: index < alerts.slice(0, 5).length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
                    }}>
                      <div style={{ 
                        color: getLevelColor(alert.level), 
                        fontSize: 12, 
                        fontWeight: 600,
                        marginBottom: 4
                      }}>
                        {alert.level}
                      </div>
                      <div style={{ color: '#f8fafc', fontSize: 14 }}>
                        {alert.message}
                      </div>
                      <div style={{ color: '#cbd5e1', fontSize: 12 }}>
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                  {alerts.length === 0 && (
                    <div style={{ color: '#cbd5e1', fontSize: 14, textAlign: 'center', padding: '20px' }}>
                      No recent alerts
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'metrics' && (
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: 12, padding: '20px' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#f8fafc' }}>📈 Detailed Metrics</h4>
              {metrics ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                  <div>
                    <h5 style={{ color: '#f8fafc', margin: '0 0 8px 0' }}>Memory</h5>
                    <div style={{ color: '#cbd5e1', fontSize: 14 }}>
                      <div>Total: {formatBytes(metrics.system?.memory?.total || 0)}</div>
                      <div>Used: {formatBytes(metrics.system?.memory?.used || 0)}</div>
                      <div>Free: {formatBytes(metrics.system?.memory?.free || 0)}</div>
                    </div>
                  </div>
                  <div>
                    <h5 style={{ color: '#f8fafc', margin: '0 0 8px 0' }}>CPU Load Average</h5>
                    <div style={{ color: '#cbd5e1', fontSize: 14 }}>
                      <div>1 min: {metrics.system?.cpu?.loadAverage?.[0]?.toFixed(2) || 'N/A'}</div>
                      <div>5 min: {metrics.system?.cpu?.loadAverage?.[1]?.toFixed(2) || 'N/A'}</div>
                      <div>15 min: {metrics.system?.cpu?.loadAverage?.[2]?.toFixed(2) || 'N/A'}</div>
                    </div>
                  </div>
                  <div>
                    <h5 style={{ color: '#f8fafc', margin: '0 0 8px 0' }}>Process Info</h5>
                    <div style={{ color: '#cbd5e1', fontSize: 14 }}>
                      <div>Uptime: {formatUptime(metrics.process?.uptime || 0)}</div>
                      <div>Memory: {formatBytes(metrics.process?.memory?.heapUsed || 0)}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#cbd5e1', textAlign: 'center', padding: '40px' }}>
                  Loading metrics...
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: 12, padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h4 style={{ margin: 0, color: '#f8fafc' }}>📋 System Logs</h4>
                <select 
                  value={logLevel} 
                  onChange={(e) => setLogLevel(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#f8fafc',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 6,
                    padding: '6px 12px',
                    fontSize: 14
                  }}
                >
                  <option value="all">All Levels</option>
                  <option value="error">Error</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </select>
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {logs.map((log, index) => (
                  <div key={index} style={{ 
                    padding: '12px', 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <span style={{ 
                        color: getLevelColor(log.level), 
                        fontWeight: 600, 
                        fontSize: 12,
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: '2px 6px',
                        borderRadius: 4
                      }}>
                        {log.level}
                      </span>
                      <span style={{ color: '#cbd5e1', fontSize: 12 }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ color: '#f8fafc', fontSize: 14, marginBottom: 4 }}>
                      {log.message}
                    </div>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div style={{ color: '#cbd5e1', fontSize: 12, fontFamily: 'monospace' }}>
                        {JSON.stringify(log.details, null, 2)}
                      </div>
                    )}
                  </div>
                ))}
                {logs.length === 0 && (
                  <div style={{ color: '#cbd5e1', textAlign: 'center', padding: '40px' }}>
                    No logs available
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: 12, padding: '20px' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#f8fafc' }}>🚨 Security Alerts</h4>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {alerts.map((alert, index) => (
                  <div key={index} style={{ 
                    padding: '16px', 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    borderLeft: `4px solid ${getLevelColor(alert.level)}`,
                    background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <span style={{ 
                        color: getLevelColor(alert.level), 
                        fontWeight: 700, 
                        fontSize: 14,
                        textTransform: 'uppercase'
                      }}>
                        {alert.level}
                      </span>
                      <span style={{ color: '#cbd5e1', fontSize: 12 }}>
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ color: '#f8fafc', fontSize: 16, marginBottom: 8 }}>
                      {alert.message}
                    </div>
                    {alert.details && Object.keys(alert.details).length > 0 && (
                      <div style={{ 
                        background: 'rgba(0, 0, 0, 0.2)', 
                        padding: '8px', 
                        borderRadius: 4,
                        fontSize: 12,
                        fontFamily: 'monospace',
                        color: '#cbd5e1'
                      }}>
                        {JSON.stringify(alert.details, null, 2)}
                      </div>
                    )}
                  </div>
                ))}
                {alerts.length === 0 && (
                  <div style={{ color: '#cbd5e1', textAlign: 'center', padding: '40px' }}>
                    No alerts available
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <button
            onClick={fetchMonitoringData}
            disabled={loading}
            style={{
              background: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '12px 24px',
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.2s'
            }}
          >
            {loading ? '🔄 Refreshing...' : '🔄 Refresh Data'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonitoringPage; 