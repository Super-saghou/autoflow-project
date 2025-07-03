# ssh_relay.py
"""
Python SSH relay server for browser-based SSH to GNS3 switch.

Install dependencies:
    pip install flask flask-socketio eventlet paramiko python-dotenv

Run the server:
    export SSH_HOST=192.168.111.198
    export SSH_USER=sarra
    export SSH_PASS=your_password_here
    python ssh_relay.py

Frontend should connect to ws://localhost:5001/socket.io/
"""
import os
import eventlet
import paramiko
from flask import Flask
from flask_socketio import SocketIO, emit
from dotenv import load_dotenv

load_dotenv()

SSH_HOST = os.getenv('SSH_HOST', '192.168.111.198')
SSH_USER = os.getenv('SSH_USER', 'sarra')
SSH_PASS = os.getenv('SSH_PASS', 'your_password_here')
SSH_PORT = int(os.getenv('SSH_PORT', 22))

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins='*')

sessions = {}

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    sid = str(request.sid)
    if sid in sessions:
        ssh, chan = sessions[sid]
        chan.close()
        ssh.close()
        del sessions[sid]
    print('Client disconnected')

@socketio.on('start-ssh')
def start_ssh(data):
    sid = str(request.sid)
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SSH_HOST, port=SSH_PORT, username=SSH_USER, password=SSH_PASS, look_for_keys=False, allow_agent=False)
        chan = ssh.invoke_shell()
        sessions[sid] = (ssh, chan)
        emit('terminal-output', {'output': f'Connected to {SSH_HOST} as {SSH_USER}\n'})
        def read_from_ssh():
            while True:
                try:
                    data = chan.recv(1024)
                    if not data:
                        break
                    socketio.emit('terminal-output', {'output': data.decode(errors='ignore')}, room=sid)
                except Exception:
                    break
        eventlet.spawn_n(read_from_ssh)
    except Exception as e:
        emit('terminal-output', {'output': f'Error: {str(e)}\n'})

@socketio.on('terminal-input')
def terminal_input(data):
    sid = str(request.sid)
    if sid in sessions:
        ssh, chan = sessions[sid]
        try:
            chan.send(data.get('command', ''))
        except Exception as e:
            emit('terminal-output', {'output': f'Error: {str(e)}\n'})

@socketio.on('end-ssh')
def end_ssh(data):
    sid = str(request.sid)
    if sid in sessions:
        ssh, chan = sessions[sid]
        chan.close()
        ssh.close()
        del sessions[sid]
        emit('terminal-output', {'output': 'SSH session closed.\n'})

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5001) 