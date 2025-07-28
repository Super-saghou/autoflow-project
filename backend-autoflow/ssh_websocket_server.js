import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import { createConnection } from 'net';

const wss = new WebSocketServer({ port: 5010 });

console.log('SSH WebSocket server started on port 5010');

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  
  let sshProcess = null;
  let isConnected = false;

  // Initialize SSH connection to switch
  const connectToSwitch = () => {
    try {
      // Use Netmiko to connect to the switch
      sshProcess = spawn('python3', ['ssh_connection.py'], {
        cwd: process.cwd()
      });

      sshProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('SSH Output:', output);
        
        // Send output to frontend terminal
        if (ws.readyState === ws.OPEN) {
          ws.send(output);
        }
      });

      sshProcess.stderr.on('data', (data) => {
        const error = data.toString();
        console.error('SSH Error:', error);
        
        if (ws.readyState === ws.OPEN) {
          ws.send(`\r\n[ERROR] ${error}\r\n`);
        }
      });

      sshProcess.on('close', (code) => {
        console.log('SSH process closed with code:', code);
        isConnected = false;
        
        if (ws.readyState === ws.OPEN) {
          ws.send('\r\n[SSH connection closed]\r\n');
        }
      });

      isConnected = true;
      ws.send('\r\n[SSH connection established]\r\n');
      
    } catch (error) {
      console.error('Failed to connect to switch:', error);
      ws.send(`\r\n[ERROR] Failed to connect: ${error.message}\r\n`);
    }
  };

  // Handle incoming messages from frontend terminal
  ws.on('message', (message) => {
    const command = message.toString().trim();
    console.log('Received command:', command);

    if (!isConnected || !sshProcess) {
      if (command === 'connect') {
        connectToSwitch();
      } else {
        ws.send('\r\n[ERROR] Not connected to switch. Send "connect" to establish connection.\r\n');
      }
      return;
    }

    // Send command to SSH process
    if (sshProcess && sshProcess.stdin) {
      sshProcess.stdin.write(command + '\n');
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    console.log('Client disconnected');
    if (sshProcess) {
      sshProcess.kill();
    }
  });

  // Send initial connection message
  ws.send('\r\n[WebSocket connected. Send "connect" to establish SSH connection to switch]\r\n');
});

console.log('SSH WebSocket server is ready for connections'); 