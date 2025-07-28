import React, { useState } from 'react';
import styled from 'styled-components';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Chip,
  Divider
} from '@mui/material';
import { SmartToy, Psychology, Security, Send } from '@mui/icons-material';

const ModalContainer = styled.div`
  .MuiDialog-paper {
    border-radius: 20px;
    max-width: 800px;
    width: 90vw;
    max-height: 80vh;
  }
`;

const PromptSection = styled.div`
  margin-bottom: 24px;
`;

const ResponseSection = styled.div`
  margin-top: 24px;
  max-height: 400px;
  overflow-y: auto;
`;

const ResponseBox = styled.div`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 16px;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const ExamplePrompts = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
`;

const AIPromptModal = ({ open, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [agentStatus, setAgentStatus] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [taskStatus, setTaskStatus] = useState(null);
  const [polling, setPolling] = useState(false);
  const [aiCommands, setAiCommands] = useState('');
  const [playbookResult, setPlaybookResult] = useState('');
  const [execResult, setExecResult] = useState('');

  const examplePrompts = [
    "Create VLAN 10 named Marketing on switch 192.168.111.198",
    "Assign interface Fa0/1 to VLAN 20",
    "Enable DHCP snooping on VLANs 10,20,30 and trust port Fa0/1",
    "Configure SSH access on port 2222 and allow only 192.168.1.100",
    "Set hostname to 'Branch-Switch' and management IP to 10.0.0.2",
    "Create a DHCP pool for subnet 192.168.50.0/24 with gateway 192.168.50.1",
    "Enable port security on Fa0/2 with max 2 MAC addresses",
    "Configure EtherChannel on ports Fa0/3 and Fa0/4"
  ];

  const checkAgentStatus = async () => {
    try {
      const response = await fetch('/api/agent_status');
      const data = await response.json();
      setAgentStatus(data);
    } catch (err) {
      console.error('Failed to check agent status:', err);
    }
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
    setResponse('');
    setTaskId(null);
    setTaskStatus(null);
    setAiCommands('');
    setPlaybookResult('');
    setExecResult('');
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

  const handleExampleClick = (examplePrompt) => {
    setPrompt(examplePrompt);
  };

  const handleClose = () => {
    setPrompt('');
    setResponse('');
    setError('');
    setLoading(false);
    setTaskId(null);
    setTaskStatus(null);
    setAiCommands('');
    setPlaybookResult('');
    setExecResult('');
    setPolling(false);
    onClose();
  };

  React.useEffect(() => {
    if (open) {
      checkAgentStatus();
    }
  }, [open]);

  return (
    <ModalContainer>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '20px 20px 0 0',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <SmartToy sx={{ fontSize: 28 }} />
          <Typography variant="body1" fontWeight={600} sx={{ fontSize: '1.25rem' }}>
            Agent AI Config - Custom Configuration
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {/* Agent Status */}
          {agentStatus && (
            <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                AI Agent Status
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip 
                  label={agentStatus.llm_available ? "🟢 LLM Available" : "🔴 LLM Unavailable"}
                  color={agentStatus.llm_available ? "success" : "error"}
                  size="small"
                />
                <Chip 
                  label={agentStatus.agents_ready ? "🟢 Agents Ready" : "🔴 Agents Not Ready"}
                  color={agentStatus.agents_ready ? "success" : "error"}
                  size="small"
                />
              </Box>
            </Box>
          )}
          {/* Prompt Input */}
          <PromptSection>
            <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Psychology />
              Enter Your Configuration Request
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              placeholder="Describe what you want the AI to configure..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading || polling}
              sx={{ mb: 2 }}
            />
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Example prompts:
            </Typography>
            <ExamplePrompts>
              {examplePrompts.map((example, index) => (
                <Chip
                  key={index}
                  label={example}
                  onClick={() => handleExampleClick(example)}
                  variant="outlined"
                  size="small"
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f0f0f0' } }}
                />
              ))}
            </ExamplePrompts>
          </PromptSection>
          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {/* Task Progress/Results */}
          {taskId && (
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 2 }}>
                <Chip label={taskStatus === 'completed' ? 'Task Complete' : taskStatus === 'error' ? 'Task Failed' : 'Running...'} color={taskStatus === 'completed' ? 'success' : taskStatus === 'error' ? 'error' : 'primary'} />
              </Divider>
              {aiCommands && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="primary">AI-Generated Commands</Typography>
                  <ResponseBox>{aiCommands}</ResponseBox>
                </Box>
              )}
              {playbookResult && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="primary">Playbook Generation Output</Typography>
                  <ResponseBox>{playbookResult}</ResponseBox>
                </Box>
              )}
              {execResult && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="primary">Playbook Execution Log</Typography>
                  <ResponseBox>{execResult}</ResponseBox>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleClose} color="inherit">
            Close
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={loading || !prompt.trim() || polling}
            startIcon={loading || polling ? <CircularProgress size={20} /> : <Send />}
            sx={{ 
              borderRadius: 2, 
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            {loading || polling ? 'Running...' : 'Send to AI Agent'}
          </Button>
        </DialogActions>
      </Dialog>
    </ModalContainer>
  );
};

export default AIPromptModal; 