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

  useEffect(() => {
    let term, fitAddon;
    let cleanup = () => {};

    const openTerminal = () => {
      if (!containerRef.current) return;
      term = new Terminal({ fontSize: 16, theme: { background: '#222' } });
      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(containerRef.current);
      fitAddon.fit();
      xtermRef.current = term;
      fitAddonRef.current = fitAddon;
      socketRef.current = new window.WebSocket('ws://localhost:5010');
      socketRef.current.onopen = () => {
        term.write('\r\n[Connected to SSH relay]\r\n');
        fitAddon.fit();
      };
      socketRef.current.onmessage = (event) => {
        term.write(event.data);
      };
      term.onData((data) => {
        socketRef.current.send(data);
      });
        setTimeout(() => {
          term.focus();
        fitAddon.fit();
      }, 200);
      cleanup = () => {
        term.dispose();
        if (socketRef.current) socketRef.current.close();
      };
    };
    requestAnimationFrame(() => {
      requestAnimationFrame(openTerminal);
    });
    return () => cleanup();
  }, [device]);

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
        <h3 style={{ margin: 0, marginBottom: 16, fontSize: 22, fontWeight: 700 }}>SSH Terminal - {device.id}</h3>
        <div
          ref={containerRef}
          style={{
            width: '60vw',
            maxWidth: 900,
            minWidth: 320,
            height: '50vh',
            maxHeight: 500,
            minHeight: 200,
            marginBottom: 16,
            background: '#111',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
          tabIndex={0}
        />
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
            alignSelf: 'flex-end',
            marginTop: 8
          }}
          onClick={onClose}
              >
                Close
              </button>
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
    <div style={{ width: '100%', height: '600px', position: 'relative', background: '#f5f7fa', borderRadius: 16, boxShadow: '0 4px 24px rgba(30,58,138,0.08)' }}>
      <h2 style={{ padding: 24, margin: 0 }}>Network Topology</h2>
      {/* Hardcoded switch icon */}
      <div
        style={{
          position: 'absolute',
          left: switchNode.x,
          top: switchNode.y,
          width: 64,
          height: 64,
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
        onClick={handleSwitchClick}
        title={`${switchNode.type}\n${switchNode.label}`}
      >
        <img src="/switch-icon.svg" alt="Switch" style={{ width: 48, height: 48 }} />
        <span style={{ fontWeight: 700, color: '#1e3a8a', fontSize: 16, marginTop: 4 }}>{switchNode.id}</span>
      </div>
      {/* Terminal Modal */}
      {terminalOpen && (
        <TerminalModal device={selectedDevice} onClose={() => setTerminalOpen(false)} />
      )}
    </div>
  );
};

export default Topology;
