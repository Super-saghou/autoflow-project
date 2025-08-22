import React, { useState } from 'react';
import { Box, Typography, Button, CircularProgress, Divider, Chip, Alert, Card, CardContent, Grid } from '@mui/material';
import { CheckCircle, Error, Pending, PlayArrow } from '@mui/icons-material';

const cardStyle = {
  background: 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)',
  borderRadius: 24,
  boxShadow: '0 4px 24px 0 rgba(99,102,241,0.10)',
  padding: '32px 28px',
  marginBottom: 32,
  border: '2px solid #6366f1',
  minHeight: 80,
};

const responseBoxStyle = {
  background: '#f4f7ff',
  border: '1.5px solid #6366f1',
  borderRadius: 12,
  padding: 16,
  fontFamily: 'Fira Code, Consolas, monospace',
  fontSize: '0.9rem',
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
  wordWrap: 'break-word',
  minHeight: 40,
  maxHeight: 200,
  overflow: 'auto',
};

const agentCardStyle = {
  background: 'rgba(255,255,255,0.95)',
  borderRadius: 16,
  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
  border: '2px solid #e2e8f0',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
  },
};

const AgentPromptSection = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [taskId, setTaskId] = useState(null);
  const [taskStatus, setTaskStatus] = useState(null);
  const [polling, setPolling] = useState(false);
  const [aiCommands, setAiCommands] = useState('');
  const [playbookResult, setPlaybookResult] = useState('');
  const [execResult, setExecResult] = useState('');
  const [crewOutput, setCrewOutput] = useState('');
  const [agentStatus, setAgentStatus] = useState({
    agent1: { status: 'idle', output: '', timestamp: null },
    agent2: { status: 'idle', output: '', timestamp: null },
    agent3: { status: 'idle', output: '', timestamp: null },
    agent4: { status: 'idle', output: '', timestamp: null },
    agent5: { status: 'idle', output: '', timestamp: null },
    security: { status: 'idle', output: '', timestamp: null },
  });
  const [selectedAgent, setSelectedAgent] = useState('smart');

  const agentConfig = {
    smart: {
      name: "Smart Agent (No LLM)",
      description: "Fast, rule-based parsing",
      icon: "⚡",
      color: "#10b981",
      endpoint: "/process-request"
    },
    llm: {
      name: "LLM Agent",
      description: "AI-powered with Ollama",
      icon: "🤖",
      color: "#6366f1",
      endpoint: "/process-request-llm"
    },
    crewai: {
      name: "CrewAI Orchestrated",
      description: "5-agent collaboration system",
      icon: "👥",
      color: "#f59e0b",
      endpoint: "/process-request-crewai"
    },
    security: {
      name: "AI Security Monitor",
      description: "Real-time network security monitoring",
      icon: "🛡️",
      color: "#ef4444",
      endpoint: "/security-monitor"
    }
  };

  const getAgentIcon = (status) => {
    switch (status) {
      case 'running': return <CircularProgress size={20} />;
      case 'completed': return <CheckCircle style={{ color: '#10b981' }} />;
      case 'error': return <Error style={{ color: '#ef4444' }} />;
      case 'idle': return <Pending style={{ color: '#6b7280' }} />;
      default: return <Pending style={{ color: '#6b7280' }} />;
    }
  };

  const getAgentColor = (status) => {
    switch (status) {
      case 'running': return '#6366f1';
      case 'completed': return '#10b981';
      case 'error': return '#ef4444';
      case 'idle': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const updateAgentStatus = (agentId, status, output = '', timestamp = null) => {
    setAgentStatus(prev => ({
      ...prev,
      [agentId]: { status, output, timestamp: timestamp || new Date().toLocaleTimeString() }
    }));
  };

  const pollTaskStatus = (id) => {
    setPolling(true);
    const poll = async () => {
      try {
        const res = await fetch(`/api/agent-ai-config-task/status/${id}`);
        const data = await res.json();
        setTaskStatus(data.status);
        setAiCommands(data.ai_commands || '');
        setPlaybookResult(data.playbook_result || '');
        setExecResult(data.exec_result || '');
        setCrewOutput(data.crew_output || '');
        
        // Update agent status based on the response
        if (data.agent_status) {
          Object.keys(data.agent_status).forEach(agentId => {
            updateAgentStatus(agentId, data.agent_status[agentId].status, data.agent_status[agentId].output);
          });
        }
        
        if (data.status === 'completed' || data.status === 'error') {
          setPolling(false);
          setLoading(false);
          if (data.status === 'error') setError(data.error || 'Task failed');
        } else {
          setTimeout(poll, 2000);
        }
      } catch (err) {
        setPolling(false);
        setLoading(false);
        setError('Failed to poll task status');
      }
    };
    poll();
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }
    
    setLoading(true);
    setError('');
    setTaskId(null);
    setTaskStatus(null);
    setAiCommands('');
    setPlaybookResult('');
    setExecResult('');
    setCrewOutput('');
    
    // Reset all agent statuses
    Object.keys(agentStatus).forEach(agentId => {
      updateAgentStatus(agentId, 'idle', '', null);
    });
    
    try {
      const endpoint = agentConfig[selectedAgent].endpoint;
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes timeout
      
      const res = await fetch(`http://localhost:5000/api${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const data = await res.json();
      if (res.ok) {
        // Update agent statuses based on response
        if (data.agent_status) {
          Object.keys(data.agent_status).forEach(agentId => {
            updateAgentStatus(agentId, data.agent_status[agentId].status, data.agent_status[agentId].output);
          });
        }
        
        setTaskStatus('completed');
        setCrewOutput(data.result || data.message || 'Task completed successfully');
        setLoading(false);
      } else {
        setError(data.error || 'Failed to process request');
        setLoading(false);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out. CrewAI agents are still processing in the background. Check the server logs for progress.');
      } else {
        setError('Failed to connect to AI agents. Please ensure the backend service is running.');
      }
      setLoading(false);
    }
  };

  const handleClear = () => {
    setPrompt('');
    setError('');
    setTaskId(null);
    setTaskStatus(null);
    setAiCommands('');
    setPlaybookResult('');
    setExecResult('');
    setCrewOutput('');
    setPolling(false);
    setLoading(false);
    Object.keys(agentStatus).forEach(agentId => {
      updateAgentStatus(agentId, 'idle', '', null);
    });
  };

  const AgentCard = ({ agentId, title, description, icon, color }) => {
    const status = agentStatus[agentId];
    const isActive = status.status === 'running' || status.status === 'completed';
    
    return (
      <Card 
        sx={{ 
          ...agentCardStyle, 
          borderColor: isActive ? color : '#e2e8f0',
          background: isActive ? `rgba(255,255,255,0.98)` : 'rgba(255,255,255,0.95)',
        }}
        onClick={() => status.output && console.log(`${title} output:`, status.output)}
      >
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontSize: '1.2rem' }}>{icon}</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: isActive ? color : '#374151' }}>
                {title}
              </Typography>
            </Box>
            {getAgentIcon(status.status)}
          </Box>
          
          <Typography variant="body2" sx={{ color: '#6b7280', mb: 1, fontSize: '0.8rem' }}>
            {description}
          </Typography>
          
          {status.timestamp && (
            <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '0.7rem' }}>
              {status.timestamp}
            </Typography>
          )}
          
          {status.output && (
            <Box sx={{ 
              ...responseBoxStyle, 
              mt: 1, 
              maxHeight: 100, 
              fontSize: '0.75rem',
              borderColor: color 
            }}>
              {status.output.length > 100 ? `${status.output.substring(0, 100)}...` : status.output}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      {/* Agent Selection */}
      <Box sx={{ ...cardStyle, marginBottom: 24 }}>
        <Typography variant="h6" sx={{ color: '#6366f1', fontWeight: 700, marginBottom: 2 }}>
          Choose AI Agent Type
        </Typography>
        <Grid container spacing={2}>
          {Object.entries(agentConfig).map(([key, config]) => (
            <Grid item xs={12} md={4} key={key}>
              <Card 
                sx={{ 
                  ...agentCardStyle, 
                  borderColor: selectedAgent === key ? config.color : '#e2e8f0',
                  background: selectedAgent === key ? `rgba(255,255,255,0.98)` : 'rgba(255,255,255,0.95)',
                }}
                onClick={() => setSelectedAgent(key)}
              >
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ mb: 1 }}>{config.icon}</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: selectedAgent === key ? config.color : '#374151' }}>
                    {config.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.8rem' }}>
                    {config.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Prompt Input */}
      <Box sx={{ ...cardStyle, marginBottom: 40 }}>
        <Typography variant="h5" sx={{ color: '#6366f1', fontWeight: 800, marginBottom: 2 }}>
          Enter a real network automation prompt
        </Typography>
        <Typography variant="body1" sx={{ color: '#0ea5e9', fontWeight: 500, marginBottom: 3 }}>
          Example: <span style={{ color: '#6366f1' }}>
            Create VLAN 10 named Marketing on switch 192.168.111.198
          </span>
        </Typography>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Describe the network task you want the agents to perform..."
          rows={4}
          style={{
            width: '100%',
            padding: 18,
            border: '2px solid #6366f1',
            borderRadius: 14,
            fontSize: 18,
            fontFamily: 'inherit',
            marginBottom: 18,
            background: '#f8fafc',
            color: '#1e293b',
            outline: 'none',
            resize: 'vertical',
            boxShadow: '0 2px 8px rgba(99,102,241,0.06)'
          }}
          disabled={loading || polling}
        />
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={loading || !prompt.trim() || polling}
            startIcon={loading || polling ? <CircularProgress size={20} /> : <PlayArrow />}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              fontSize: 18,
              background: `linear-gradient(90deg, ${agentConfig[selectedAgent].color} 0%, #0ea5e9 100%)`,
              boxShadow: '0 2px 8px rgba(99,102,241,0.10)'
            }}
          >
            {loading || polling ? 'Running...' : `Run ${agentConfig[selectedAgent].name}`}
          </Button>
          <Button
            onClick={handleClear}
            variant="outlined"
            color="secondary"
            disabled={loading || polling}
            sx={{ borderRadius: 2, fontWeight: 700, fontSize: 18 }}
          >
            Clear
          </Button>
        </Box>
      </Box>

      {/* AI Agent Status Cards */}
      {(loading || taskStatus || Object.values(agentStatus).some(agent => agent.status !== 'idle')) && (
        <Box sx={{ marginBottom: 40 }}>
          <Typography variant="h5" sx={{ color: '#6366f1', fontWeight: 800, marginBottom: 3, textAlign: 'center' }}>
            🤖 AI Agent Workflow Status
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={4}>
              <AgentCard 
                agentId="agent1"
                title="Request Parser"
                description="Analyzes and parses the user request"
                icon="🔍"
                color="#6366f1"
              />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <AgentCard 
                agentId="agent2"
                title="Command Generator"
                description="Generates network commands"
                icon="⚙️"
                color="#0ea5e9"
              />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <AgentCard 
                agentId="agent3"
                title="Playbook Creator"
                description="Creates Ansible playbooks"
                icon="📝"
                color="#10b981"
              />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <AgentCard 
                agentId="agent4"
                title="Executor"
                description="Executes the playbook"
                icon="🚀"
                color="#f59e0b"
              />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <AgentCard 
                agentId="agent5"
                title="Verifier"
                description="Verifies the configuration"
                icon="✅"
                color="#8b5cf6"
              />
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Results Display */}
      {(crewOutput || error) && (
        <Box sx={{ ...cardStyle, border: '2.5px solid #f43f5e', background: 'linear-gradient(135deg, #fdf2f8 0%, #f3e8ff 100%)' }}>
          <Typography variant="h6" sx={{ color: '#f43f5e', fontWeight: 700, marginBottom: 2 }}>
            🎯 Final Result
          </Typography>
          <Box sx={responseBoxStyle}>{crewOutput || error}</Box>
        </Box>
      )}
    </Box>
  );
};

export default AgentPromptSection; 