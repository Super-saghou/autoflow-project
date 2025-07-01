// src/components/Topology.js
import React, { useEffect, useState, useRef } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';
import io from 'socket.io-client';
import { Tooltip } from 'react-tooltip';
import './Topology.css';

const Topology = ({ devices, theme, API_URL, setError, setMessage }) => {
  const [elements, setElements] = useState([]);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const terminalRef = useRef(null);
  const socketRef = useRef(null);

  // Initialize Socket.IO and fetch topology data
  useEffect(() => {
    socketRef.current = io(API_URL);

    const fetchTopology = async () => {
      try {
        const response = await fetch(`${API_URL}/api/topology`);
        if (!response.ok) throw new Error('Error fetching topology');
        const data = await response.json();
        const nodes = devices.map(device => ({
          data: { id: device.name, label: device.name, ip: device.ip, status: 'online' }
        }));
        setElements([...nodes, ...data.edges]);
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

    socketRef.current.on('device-status-update', (updatedDevice) => {
      setElements((prev) =>
        prev.map((el) =>
          el.data.id === updatedDevice.id ? { ...el, data: { ...el.data, status: updatedDevice.status } } : el
        )
      );
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [devices, API_URL, setError]);

  // Initialize terminal only when terminalOpen is true
  useEffect(() => {
    if (terminalOpen) {
      const terminalElement = document.getElementById('terminal');
      if (terminalElement && !terminalRef.current) {
        const term = new Terminal({
          theme: theme === 'light' ? { background: '#F3E5AB', foreground: '#4A2C1A' } : { background: '#1C2526', foreground: '#DAA520' }
        });
        terminalRef.current = term;
        term.open(terminalElement);

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
    setMessage(`Connected to ${device.label}`);
  };

  return (
    <div className="topology-container">
      <h2 className="section-header">Network Topology</h2>
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '15px',
          padding: '20px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
        }}
      >
        <CytoscapeComponent
          elements={elements}
          style={{ width: '100%', height: '600px' }}
          layout={{ name: 'cose' }}
          stylesheet={[
            {
              selector: 'node',
              style: {
                label: 'data(label)',
                backgroundColor: (node) => (node.data('status') === 'online' ? '#2ecc71' : '#e74c3c'),
                color: theme === 'light' ? '#4A2C1A' : '#DAA520',
                'text-outline-color': theme === 'light' ? '#F3E5AB' : '#1C2526',
                'text-outline-width': 2,
                width: 40,
                height: 40,
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
          cy={(cy) => {
            cy.on('tap', 'node', handleNodeClick);
            cy.nodes().forEach((node) => {
              node.data('tooltip', `IP: ${node.data('ip')}\nStatus: ${node.data('status')}`);
            });
          }}
        />
        {terminalOpen && (
          <div
            className="profile-edit-panel"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
            }}
          >
            <div
              className="profile-edit-card"
              style={{
                background: theme === 'light' ? '#F3E5AB' : '#1C2526',
                color: theme === 'light' ? '#4A2C1A' : '#DAA520',
              }}
            >
              <h3>SSH Terminal - {selectedDevice}</h3>
              <div id="terminal" style={{ width: '600px', height: '400px' }} />
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
      <Tooltip id="topology-tooltip" place="top" effect="solid" />
    </div>
  );
};

export default Topology;
