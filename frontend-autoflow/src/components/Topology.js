// src/components/Topology.js
import React, { useEffect, useState, useRef } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';
import io from 'socket.io-client';
import './Topology.css';

const Topology = ({ devices, theme, API_URL, setError, setMessage }) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const terminalRef = useRef(null);
  const socketRef = useRef(null);

  // Fetch devices and topology, validate data
  useEffect(() => {
    socketRef.current = io(API_URL);
    const fetchTopology = async () => {
      try {
        const response = await fetch(`${API_URL}/api/topology`);
        if (!response.ok) throw new Error('Error fetching topology');
        const data = await response.json();
        // Build node set from devices, label with name and IP, add type if available, and add title for browser tooltip
        const nodeList = devices.map(device => ({
          data: {
            id: device.name,
            label: `${device.name}\n${device.ip}`,
            ip: device.ip,
            status: 'online',
            type: device.type || 'Device',
            title: `${device.type || 'Device'}\n${device.name}\n${device.ip}`
          }
        }));
        // Validate edges: only keep those whose source and target exist in nodeList
        const nodeIds = new Set(nodeList.map(n => n.data.id));
        const validEdges = (data.edges || []).filter(
          edge => nodeIds.has(edge.data.source) && nodeIds.has(edge.data.target)
        );
        setNodes(nodeList);
        setEdges(validEdges);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchTopology();
    socketRef.current.on('terminal-output', (data) => {
      if (terminalRef.current) {
        terminalRef.current.write(data.output);
      }
    });
    return () => {
      socketRef.current.disconnect();
    };
  }, [devices, API_URL, setError]);

  // Terminal logic
  useEffect(() => {
    if (terminalOpen) {
      const terminalElement = document.getElementById('terminal');
      if (terminalElement && !terminalRef.current) {
        const term = new Terminal({
          theme: theme === 'light' ? { background: '#F3E5AB', foreground: '#4A2C1A' } : { background: '#1C2526', foreground: '#DAA520' }
        });
        terminalRef.current = term;
        term.open(terminalElement);
        // Ensure terminal is focusable and interactive
        setTimeout(() => {
          terminalElement.focus();
          term.focus();
        }, 100);
        term.onData((data) => {
          if (selectedDevice) {
            socketRef.current.emit('terminal-input', { deviceId: selectedDevice, command: data });
          }
        });
      }
    }
    return () => {
      if (terminalRef.current) {
        terminalRef.current.dispose();
        terminalRef.current = null;
      }
    };
  }, [terminalOpen, selectedDevice, theme]);

  const handleNodeClick = (event) => {
    const device = event.target.data();
    setSelectedDevice(device.id);
    setTerminalOpen(true);
    socketRef.current.emit('start-ssh', { deviceId: device.id });
    setMessage && setMessage(`Connected to ${device.label}`);
  };

  // Tooltip handlers
  const handleCyInit = (cy) => {
    cy.on('tap', 'node', handleNodeClick);
    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target.data();
      setHoveredNode(node);
    });
    cy.on('mouseout', 'node', () => {
      setHoveredNode(null);
    });
    cy.on('mousemove', (evt) => {
      setMousePos({ x: evt.originalEvent.clientX, y: evt.originalEvent.clientY });
    });
  };

  return (
    <div className="topology-container">
      <h2 className="section-header">Network Topology</h2>
      <div className="topology-canvas-wrapper">
        <CytoscapeComponent
          elements={[...nodes, ...edges]}
          style={{ width: '100%', height: '600px' }}
          layout={{ name: 'cose' }}
          stylesheet={[
            {
              selector: 'node',
              style: {
                label: 'data(label)',
                'text-wrap': 'wrap',
                'text-max-width': 80,
                backgroundColor: (node) => (node.data('status') === 'online' ? '#2ecc71' : '#e74c3c'),
                color: theme === 'light' ? '#4A2C1A' : '#DAA520',
                'text-outline-color': theme === 'light' ? '#F3E5AB' : '#1C2526',
                'text-outline-width': 2,
                width: 50,
                height: 50,
                'font-size': 14,
                'z-index': 10,
              },
            },
            {
              selector: 'edge',
              style: {
                width: 3,
                lineColor: theme === 'light' ? '#4A2C1A' : '#DAA520',
                'curve-style': 'bezier',
              },
            },
          ]}
          cy={handleCyInit}
        />
        {hoveredNode && (
          <div
            style={{
              position: 'fixed',
              left: mousePos.x + 10,
              top: mousePos.y + 10,
              background: 'rgba(30, 30, 40, 0.95)',
              color: '#fff',
              padding: '10px 16px',
              borderRadius: '8px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
              zIndex: 2000,
              pointerEvents: 'none',
              fontSize: 15,
              minWidth: 180,
              maxWidth: 260,
              whiteSpace: 'pre-line',
            }}
          >
            <b>{hoveredNode.type}</b> <br />
            <span>Name: {hoveredNode.id}</span> <br />
            <span>IP: {hoveredNode.ip}</span>
          </div>
        )}
        {terminalOpen && (
          <div className="terminal-modal">
            <div className="terminal-card">
              <h3>SSH Terminal - {selectedDevice}</h3>
              <div id="terminal" style={{ width: '600px', height: '400px' }} tabIndex={0} />
              <button
                className="login-btn"
                style={{ background: 'linear-gradient(45deg, #DAA520, #8B4513)', marginTop: '10px' }}
                onClick={() => {
                  setTerminalOpen(false);
                  setSelectedDevice(null);
                  socketRef.current.emit('end-ssh', { deviceId: selectedDevice });
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
      {/* For backend SSH relay, see checklist below */}
    </div>
  );
};

export default Topology;
