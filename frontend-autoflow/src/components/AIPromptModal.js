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

  const examplePrompts = [
    "Analyze the current network security posture and identify potential vulnerabilities",
    "Review VLAN configuration and suggest security improvements",
    "Check for any suspicious network activity or potential threats",
    "Provide recommendations for DHCP snooping configuration",
    "Analyze port security settings and suggest enhancements",
    "Review SSH configuration and security best practices",
    "Check for any unauthorized access attempts or security incidents",
    "Provide network segmentation recommendations for better security"
  ];

  const checkAgentStatus = async () => {
    try {
      const response = await fetch('http://localhost:5003/agent_status');
      const data = await response.json();
      setAgentStatus(data);
    } catch (err) {
      console.error('Failed to check agent status:', err);
    }
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError('');
    setResponse('');

    try {
      const response = await fetch('http://localhost:5003/custom_analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setResponse(data.result);
      } else {
        setError(data.error || 'Failed to get AI analysis');
      }
    } catch (err) {
      setError('Failed to connect to AI agents. Please ensure the AI service is running.');
    } finally {
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
          <Typography variant="h6" fontWeight={600}>
            AI Security Agent - Custom Analysis
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
              Enter Your Security Analysis Request
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              placeholder="Describe what you want the AI to analyze or investigate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
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

          {/* Response Display */}
          {response && (
            <ResponseSection>
              <Divider sx={{ mb: 2 }}>
                <Chip label="AI Analysis Results" color="primary" />
              </Divider>
              <ResponseBox>
                {response}
              </ResponseBox>
            </ResponseSection>
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
            disabled={loading || !prompt.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : <Send />}
            sx={{ 
              borderRadius: 2, 
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            {loading ? 'Analyzing...' : 'Send to AI Agent'}
          </Button>
        </DialogActions>
      </Dialog>
    </ModalContainer>
  );
};

export default AIPromptModal; 