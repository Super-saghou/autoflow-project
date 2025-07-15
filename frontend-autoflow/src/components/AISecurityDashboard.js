import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Button from '@mui/material/Button';
import { Paper, Typography, CircularProgress, Divider, Chip, Alert } from '@mui/material';
import { SmartToy, Psychology, Security, TrendingUp } from '@mui/icons-material';

const Container = styled.div`
  max-width: 1200px;
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

const AnalysisBox = styled.div`
  max-height: 300px;
  overflow-y: auto;
  background: #f8f9fa;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const StatusCard = styled.div`
  background: ${props => props.color || '#e3f2fd'};
  padding: 16px;
  border-radius: 12px;
  text-align: center;
`;

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

function AISecurityDashboard() {
  const [aiAnalysis, setAiAnalysis] = useState([]);
  const [aiStatus, setAiStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastAnalysis, setLastAnalysis] = useState(null);

  const fetchAIData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analysisRes, statusRes] = await Promise.all([
        fetch(`${API_BASE}/api/ai-security-agent/analysis`),
        fetch(`${API_BASE}/api/ai-security-agent/status`)
      ]);
      
      const analysisData = await analysisRes.json();
      const statusData = await statusRes.json();
      
      setAiAnalysis(analysisData.analysis || []);
      setAiStatus(statusData);
      
      if (analysisData.analysis && analysisData.analysis.length > 0) {
        setLastAnalysis(analysisData.analysis[analysisData.analysis.length - 1]);
      }
    } catch (err) {
      setError('Failed to fetch AI agent data');
    }
    setLoading(false);
  };

  const triggerAIAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/ai-security-agent/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        await fetchAIData(); // Refresh data after analysis
      } else {
        throw new Error('Failed to trigger AI analysis');
      }
    } catch (err) {
      setError('Failed to trigger AI analysis');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAIData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getThreatLevelColor = (analysis) => {
    if (!analysis) return '#e3f2fd';
    const text = analysis.toLowerCase();
    if (text.includes('critical')) return '#ffebee';
    if (text.includes('high')) return '#fff3e0';
    if (text.includes('medium')) return '#fff8e1';
    return '#e8f5e8';
  };

  const getThreatLevel = (analysis) => {
    if (!analysis) return 'Unknown';
    const text = analysis.toLowerCase();
    if (text.includes('critical')) return 'Critical';
    if (text.includes('high')) return 'High';
    if (text.includes('medium')) return 'Medium';
    if (text.includes('low')) return 'Low';
    return 'Unknown';
  };

  return (
    <Container>
      <Typography variant="h4" color="primary" fontWeight={700} gutterBottom>
        <SmartToy sx={{ mr: 1, verticalAlign: 'middle' }} />
        AI Security Agent Dashboard
      </Typography>
      
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Intelligent threat detection powered by AI. The agent analyzes security patterns and makes informed decisions.
      </Typography>

      <Button
        onClick={triggerAIAnalysis}
        disabled={loading}
        variant="contained"
        color="primary"
        startIcon={<Psychology />}
        sx={{ mb: 3, borderRadius: 2, fontWeight: 600 }}
      >
        {loading ? <CircularProgress size={20} color="inherit" /> : 'Trigger AI Analysis'}
      </Button>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* AI Agent Status */}
      <SectionCard elevation={2}>
        <Typography variant="h6" color="primary" gutterBottom>
          <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
          AI Agent Status
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {aiStatus && (
          <StatusGrid>
            <StatusCard color={aiStatus.aiAgentActive ? '#e8f5e8' : '#ffebee'}>
              <Typography variant="h6" color="primary">
                {aiStatus.aiAgentActive ? '🟢 Active' : '🔴 Inactive'}
              </Typography>
              <Typography variant="body2">AI Agent Status</Typography>
            </StatusCard>
            
            <StatusCard>
              <Typography variant="h6" color="primary">
                {aiStatus.totalAnalysis || 0}
              </Typography>
              <Typography variant="body2">Total Analyses</Typography>
            </StatusCard>
            
            <StatusCard>
              <Typography variant="h6" color="primary">
                {aiStatus.blockedEntities?.users?.length || 0}
              </Typography>
              <Typography variant="body2">Blocked Users</Typography>
            </StatusCard>
            
            <StatusCard>
              <Typography variant="h6" color="primary">
                {aiStatus.blockedEntities?.ips?.length || 0}
              </Typography>
              <Typography variant="body2">Blocked IPs</Typography>
            </StatusCard>
          </StatusGrid>
        )}
      </SectionCard>

      {/* Latest AI Analysis */}
      <SectionCard elevation={2}>
        <Typography variant="h6" color="primary" gutterBottom>
          <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
          Latest AI Analysis
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {lastAnalysis && (
          <div style={{ marginBottom: 16 }}>
            <Chip 
              label={`Threat Level: ${getThreatLevel(lastAnalysis)}`}
              color={getThreatLevel(lastAnalysis) === 'Critical' ? 'error' : 
                     getThreatLevel(lastAnalysis) === 'High' ? 'warning' : 'success'}
              sx={{ mb: 2 }}
            />
            <AnalysisBox style={{ backgroundColor: getThreatLevelColor(lastAnalysis) }}>
              {lastAnalysis}
            </AnalysisBox>
          </div>
        )}
        
        <Typography variant="body2" color="textSecondary">
          {aiAnalysis.length > 0 
            ? `Showing latest analysis from ${aiAnalysis.length} total entries`
            : 'No AI analysis available yet. Trigger an analysis to get started.'
          }
        </Typography>
      </SectionCard>

      {/* AI Analysis History */}
      <SectionCard elevation={2}>
        <Typography variant="h6" color="primary" gutterBottom>
          AI Analysis History
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <AnalysisBox>
          {aiAnalysis.length === 0 ? (
            <Typography variant="body2" color="textSecondary" style={{ fontStyle: 'italic' }}>
              No analysis history available. The AI agent will start logging analysis results once activated.
            </Typography>
          ) : (
            aiAnalysis.map((entry, idx) => (
              <div key={idx} style={{ 
                padding: '8px 0', 
                borderBottom: idx < aiAnalysis.length - 1 ? '1px solid #e9ecef' : 'none',
                backgroundColor: getThreatLevelColor(entry)
              }}>
                <Typography variant="body2" style={{ fontFamily: 'inherit' }}>
                  {entry}
                </Typography>
              </div>
            ))
          )}
        </AnalysisBox>
      </SectionCard>
    </Container>
  );
}

export default AISecurityDashboard; 