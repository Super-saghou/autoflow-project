import React, { useState } from 'react';
import { Box, Typography, Button, CircularProgress, Divider, Chip, Alert } from '@mui/material';

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
  fontSize: '1rem',
  lineHeight: 1.7,
  whiteSpace: 'pre-wrap',
  wordWrap: 'break-word',
  minHeight: 40,
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
    try {
      const res = await fetch('/api/agent-ai-config-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() })
      });
      const data = await res.json();
      if (res.ok && data.task_id) {
        setTaskId(data.task_id);
        setTaskStatus('running');
        pollTaskStatus(data.task_id);
      } else {
        setError(data.error || 'Failed to start task');
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to connect to AI agents. Please ensure the AI service is running.');
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
  };

  return (
    <Box>
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
            startIcon={loading || polling ? <CircularProgress size={20} /> : null}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              fontSize: 18,
              background: 'linear-gradient(90deg, #6366f1 0%, #0ea5e9 100%)',
              boxShadow: '0 2px 8px rgba(99,102,241,0.10)'
            }}
          >
            {loading || polling ? 'Running...' : 'Run Agents'}
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
      {taskId && (
        <Box>
          <Divider sx={{ mb: 4 }}>
            <Chip label={taskStatus === 'completed' ? 'Task Complete' : taskStatus === 'error' ? 'Task Failed' : 'Running...'} color={taskStatus === 'completed' ? 'success' : taskStatus === 'error' ? 'error' : 'primary'} />
          </Divider>
          {/* Show full CrewAI output and error if present */}
          {(crewOutput || error) && (
            <Box sx={{ ...cardStyle, border: '2.5px solid #f43f5e', background: 'linear-gradient(135deg, #fdf2f8 0%, #f3e8ff 100%)' }}>
              <Typography variant="subtitle1" sx={{ color: '#f43f5e', fontWeight: 700, marginBottom: 1 }}>Agent/Playbook Log</Typography>
              <Box sx={responseBoxStyle}>{crewOutput || error}</Box>
            </Box>
          )}
          {aiCommands && (
            <Box sx={{ ...cardStyle, border: '2.5px solid #0ea5e9' }}>
              <Typography variant="subtitle1" sx={{ color: '#0ea5e9', fontWeight: 700, marginBottom: 1 }}>AI-Generated Commands</Typography>
              <Box sx={responseBoxStyle}>{aiCommands}</Box>
            </Box>
          )}
          {playbookResult && (
            <Box sx={{ ...cardStyle, border: '2.5px solid #6366f1' }}>
              <Typography variant="subtitle1" sx={{ color: '#6366f1', fontWeight: 700, marginBottom: 1 }}>Playbook Generation Output</Typography>
              <Box sx={responseBoxStyle}>{playbookResult}</Box>
            </Box>
          )}
          {execResult && (
            <Box sx={{ ...cardStyle, border: '2.5px solid #6366f1' }}>
              <Typography variant="subtitle1" sx={{ color: '#6366f1', fontWeight: 700, marginBottom: 1 }}>Playbook Execution Log</Typography>
              <Box sx={responseBoxStyle}>{execResult}</Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default AgentPromptSection; 