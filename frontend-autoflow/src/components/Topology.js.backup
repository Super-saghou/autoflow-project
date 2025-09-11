// src/components/Topology.js
import React, { useState, useRef, useEffect } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import 'xterm/css/xterm.css';

const switchNode = {
  id: 'ESW1',
  label: 'ESW1\n192.168.111.198',
  ip: '192.168.111.198',
  type: 'Switch',
  x: 200,
  y: 200,
};

const TerminalModal = ({ device, onClose }) => {
  const containerRef = useRef();
  const xtermRef = useRef();
  const socketRef = useRef();
  const fitAddonRef = useRef();
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [isConnected, setIsConnected] = useState(false);
  const commandBufferRef = useRef('');

  useEffect(() => {
    let term, fitAddon;
    let mounted = true;
    let ws = null;

    const openTerminal = () => {
      if (!containerRef.current || !mounted) return;
      
      try {
        // Wait a bit for DOM to be ready
        setTimeout(() => {
          if (!mounted || !containerRef.current) return;
          
          try {
            term = new Terminal({ 
              fontSize: 16, 
              theme: { background: '#222', foreground: '#fff' },
              cursorBlink: true,
              rows: 25,
              cols: 120,
              scrollback: 1000,
              wordSeparator: ' ',
              allowTransparency: true,
              fontFamily: 'monospace',
              lineHeight: 1.2
            });
            
            fitAddon = new FitAddon();
            term.loadAddon(fitAddon);
            
            // Ensure container is ready before opening terminal
            if (containerRef.current) {
              term.open(containerRef.current);
              
              // Wait for terminal to be ready before fitting
              setTimeout(() => {
                if (mounted && fitAddon) {
                  try {
                    fitAddon.fit();
                  } catch (e) {
                    console.warn('Fit addon error:', e);
                  }
                }
              }, 100);
            }
            
            xtermRef.current = term;
            fitAddonRef.current = fitAddon;
            
            // Connect to WebSocket server
            if (mounted) {
              // Determine WebSocket URL based on environment
              const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
              let wsUrl;
              
              if (process.env.NODE_ENV === 'development') {
                // Local development: connect directly to WebSocket server
                wsUrl = wsProtocol + '://' + window.location.hostname + ':5010';
              } else {
                // Production: use nginx proxy path
                wsUrl = wsProtocol + '://' + window.location.host + '/ws/';
              }
              
              ws = new WebSocket(wsUrl);
              socketRef.current = ws;
              
              ws.onopen = () => {
                if (!mounted) return;
                setConnectionStatus('Connected to SSH relay');
                setIsConnected(true);
                if (term && !term.disposed) {
                  try {
                    term.write('\r\n\x1b[32m[Connected to SSH relay]\x1b[0m\r\n');
                    term.write('\x1b[33m[Establishing SSH connection to switch...]\x1b[0m\r\n');
                  } catch (e) {
                    console.warn('Terminal write error:', e);
                  }
                }
                // Send connect command to establish SSH
                if (ws && ws.readyState === WebSocket.OPEN) {
                  ws.send('connect');
                }
                if (fitAddon) {
                  try {
                    fitAddon.fit();
                  } catch (e) {
                    console.warn('Fit addon error:', e);
                  }
                }
              };
              
              ws.onmessage = (event) => {
                if (!mounted || !term || term.disposed) return;
                try {
                  term.write(event.data);
                  if (fitAddon) fitAddon.fit();
                } catch (e) {
                  console.warn('Terminal write error:', e);
                }
              };
              
              ws.onerror = (error) => {
                if (!mounted) return;
                setConnectionStatus('Connection error');
                setIsConnected(false);
                if (term && !term.disposed) {
                  try {
                    term.write('\r\n\x1b[31m[WebSocket connection error]\x1b[0m\r\n');
                  } catch (e) {
                    console.warn('Terminal write error:', e);
                  }
                }
                console.error('WebSocket error:', error);
              };
              
              ws.onclose = () => {
                if (!mounted) return;
                setConnectionStatus('Disconnected');
                setIsConnected(false);
                if (term && !term.disposed) {
                  try {
                    term.write('\r\n\x1b[31m[Connection closed]\x1b[0m\r\n');
                  } catch (e) {
                    console.warn('Terminal write error:', e);
                  }
                }
              };
              
              // Handle terminal input with command buffering
              term.onData((data) => {
                if (!mounted || !ws || ws.readyState !== WebSocket.OPEN) return;
                
                try {
                  // Handle special keys
                  if (data === '\r' || data === '\n') {
                    // Send complete command
                    const command = commandBufferRef.current;
                    if (command.trim()) {
                      ws.send(command + '\n');
                      commandBufferRef.current = '';
                    }
                  } else if (data === '\u007f') {
                    // Backspace
                    if (commandBufferRef.current.length > 0) {
                      commandBufferRef.current = commandBufferRef.current.slice(0, -1);
                      term.write('\b \b'); // Visual backspace
                    }
                  } else if (data.charCodeAt(0) >= 32) {
                    // Printable characters
                    commandBufferRef.current += data;
                    term.write(data); // Echo character to terminal
                  }
                } catch (e) {
                  console.warn('Terminal input error:', e);
                }
              });
            }
            
            setTimeout(() => {
              if (mounted && term && !term.disposed) {
                try {
                  term.focus();
                  if (fitAddon) fitAddon.fit();
                } catch (e) {
                  console.warn('Terminal focus error:', e);
                }
              }
            }, 200);
            
          } catch (error) {
            console.error('Error initializing terminal:', error);
            if (mounted) {
              setConnectionStatus('Terminal error');
            }
          }
        }, 200); // Wait 200ms for DOM to be ready
        
      } catch (error) {
        console.error('Error in openTerminal:', error);
        if (mounted) {
          setConnectionStatus('Terminal error');
        }
      }
    };
    
    const timeoutId = setTimeout(openTerminal, 100);
    
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      
      if (ws) {
        ws.close();
        ws = null;
      }
      
      if (socketRef.current) {
        socketRef.current = null;
      }
      
      if (term && !term.disposed) {
        try {
          term.dispose();
        } catch (e) {
          console.warn('Terminal dispose error:', e);
        }
      }
      
      if (fitAddon) {
        fitAddon = null;
      }
    };
  }, [device]);

  const handleReconnect = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send('connect');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.35)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'auto',
    }}>
      <div style={{
        background: '#222',
        borderRadius: 18,
        boxShadow: '0 8px 32px rgba(30,58,138,0.25)',
        padding: 32,
        minWidth: 350,
        maxWidth: '90vw',
        minHeight: 300,
        maxHeight: '90vh',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'flex-start',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>SSH Terminal - {device.id}</h3>
          <span style={{ 
            fontSize: 14, 
            padding: '4px 12px', 
            borderRadius: 12, 
            background: isConnected ? '#10b981' : '#ef4444',
            color: '#fff'
          }}>
            {connectionStatus}
          </span>
        </div>
        <div
          ref={containerRef}
          style={{
            width: '80vw',
            maxWidth: 1200,
            minWidth: 400,
            height: '60vh',
            maxHeight: 600,
            minHeight: 300,
            marginBottom: 16,
            background: '#111',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
          tabIndex={0}
        />
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            style={{
              background: 'linear-gradient(90deg, #059669 0%, #10b981 100%)',
              color: '#fff',
              padding: '12px 24px',
              border: 'none',
              borderRadius: 14,
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 700,
            }}
            onClick={handleReconnect}
            disabled={!isConnected}
          >
            Reconnect
          </button>
          <button
            style={{
              background: 'linear-gradient(90deg, #3b82f6 0%, #fbbf24 100%)',
              color: '#fff',
              padding: '12px 32px',
              border: 'none',
              borderRadius: 14,
              cursor: 'pointer',
              fontSize: 18,
              fontWeight: 700,
            }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const Topology = () => {
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const handleSwitchClick = () => {
    setSelectedDevice(switchNode);
    setTerminalOpen(true);
  };

  return (
    <div style={{ 
      width: '100%', 
      minHeight: '600px', 
      position: 'relative', 
      background: 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)', 
      borderRadius: 16, 
      boxShadow: '0 4px 24px rgba(30,58,138,0.08)',
      padding: '24px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 48, color: '#3b82f6' }}>🌐</div>
        <div>
          <h2 style={{ margin: 0, color: '#1e3a8a', fontSize: 28, fontWeight: 800 }}>Network Topology</h2>
          <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: 16 }}>Click on devices to open SSH terminal</p>
        </div>
      </div>
      
      {/* Switch icon */}
      <div
        style={{
          position: 'absolute',
          left: switchNode.x,
          top: switchNode.y + 80,
          width: 80,
          height: 80,
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.9)',
          borderRadius: 16,
          padding: '12px',
          boxShadow: '0 4px 16px rgba(59,130,246,0.15)',
          transition: 'all 0.2s',
        }}
        onClick={handleSwitchClick}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.05)';
          e.target.style.boxShadow = '0 6px 20px rgba(59,130,246,0.25)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 4px 16px rgba(59,130,246,0.15)';
        }}
        title={`${switchNode.type}\n${switchNode.label}`}
      >
        <div style={{ 
          width: 48, 
          height: 48, 
          background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 24,
          fontWeight: 'bold'
        }}>
          🔌
        </div>
        <span style={{ 
          fontWeight: 700, 
          color: '#1e3a8a', 
          fontSize: 14, 
          marginTop: 8,
          textAlign: 'center'
        }}>
          {switchNode.id}
        </span>
        <span style={{ 
          color: '#64748b', 
          fontSize: 12, 
          marginTop: 2,
          textAlign: 'center'
        }}>
          {switchNode.ip}
        </span>
      </div>
      
      {/* Terminal Modal */}
      {terminalOpen && (
        <TerminalModal device={selectedDevice} onClose={() => setTerminalOpen(false)} />
      )}
    </div>
  );
};

export default Topology;
